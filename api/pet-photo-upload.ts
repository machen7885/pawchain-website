import { File } from "node:buffer";
import type { IncomingMessage } from "node:http";
import Busboy from "busboy";
import { PinataSDK } from "pinata";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

// Multipart must reach Busboy as a stream, rather than Vercel's JSON body parser.
export const config = { api: { bodyParser: false } };

type ApiResponse = { status(code: number): ApiResponse; json(value: unknown): void; setHeader(name: string, value: string): void };
type UploadedImage = { buffer: Buffer; name: string; mimeType: string };

class UploadError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function validateImage(name: string, mimeType: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (!ACCEPTED_EXTENSIONS.has(extension) || !ACCEPTED_TYPES.has(mimeType)) throw new UploadError("Only JPG, PNG, and WebP images are accepted.");
}

/** Reads one multipart image without writing a user's photo to the Vercel filesystem. */
function readImage(request: IncomingMessage): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const contentType = request.headers["content-type"];
    if (!contentType?.includes("multipart/form-data")) return reject(new UploadError("Upload a photo using multipart form data."));

    // Reject clearly oversized requests early, before buffering the body in memory.
    const declaredLength = Number(request.headers["content-length"] ?? 0);
    if (declaredLength > MAX_FILE_SIZE + 100_000) return reject(new UploadError("This image is larger than 10 MB.", 413));

    let image: UploadedImage | null = null;
    let parseError: UploadError | null = null;
    const parser = Busboy({ headers: request.headers, limits: { files: 1, fileSize: MAX_FILE_SIZE } });

    parser.on("file", (fieldName, stream, info) => {
      if (fieldName !== "photo" || image) {
        parseError = new UploadError("Send one photo in the photo field.");
        stream.resume();
        return;
      }
      try { validateImage(info.filename, info.mimeType); } catch (error) {
        parseError = error instanceof UploadError ? error : new UploadError("The selected file is not a supported image.");
        stream.resume();
        return;
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("limit", () => { parseError = new UploadError("This image is larger than 10 MB.", 413); });
      stream.on("end", () => { if (!parseError) image = { buffer: Buffer.concat(chunks), name: info.filename, mimeType: info.mimeType }; });
    });
    parser.on("filesLimit", () => { parseError = new UploadError("Upload one photo at a time."); });
    parser.on("error", () => reject(new UploadError("The image upload could not be read.")));
    parser.on("finish", () => {
      if (parseError) return reject(parseError);
      if (!image) return reject(new UploadError("Choose a photo before uploading."));
      resolve(image);
    });
    request.pipe(parser);
  });
}

export default async function handler(request: IncomingMessage, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  const jwt = process.env.PINATA_JWT;
  if (!jwt) return response.status(503).json({ error: "Photo uploads are not configured yet." });

  try {
    const image = await readImage(request);
    // PINATA_JWT stays server-side: this SDK instance exists only inside the Vercel API function.
    const pinata = new PinataSDK({ pinataJwt: jwt });
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const file = new File([image.buffer], safeName, { type: image.mimeType });
    // Node's File implementation is compatible at runtime; cast bridges its narrower TypeScript declaration.
    const uploaded = await pinata.upload.public.file(file as unknown as globalThis.File).name(`pawchain-pet-photo-${Date.now()}-${safeName}`);

    return response.status(200).json({ cid: uploaded.cid, ipfsUri: `ipfs://${uploaded.cid}`, fileName: image.name });
  } catch (error) {
    if (error instanceof UploadError) return response.status(error.status).json({ error: error.message });
    // Keep upstream Pinata details private while still reporting a helpful network/API failure.
    console.error("Pinata photo upload failed", error);
    return response.status(502).json({ error: "The IPFS upload failed. Check your connection and try again." });
  }
}
