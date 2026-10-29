import { PinataSDK } from "pinata";

type MetadataAttribute = { trait_type: string; value: string };
type Erc721Metadata = { name: string; description: string; image: string; attributes: MetadataAttribute[] };
type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(value: unknown): void; setHeader(name: string, value: string): void };

const MAX_METADATA_BYTES = 16_000;
const REQUIRED_TRAITS = ["Breed", "Date of Birth", "Gender", "Distinctive Marks", "Vaccination Records", "Owner Nickname", "Contact Note"];

function isValidMetadata(value: unknown): value is Erc721Metadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<Erc721Metadata>;
  if (typeof metadata.name !== "string" || !metadata.name.trim() || metadata.name.length > 120) return false;
  if (typeof metadata.description !== "string" || metadata.description.length > 1_000) return false;
  if (typeof metadata.image !== "string" || !/^ipfs:\/\/[a-zA-Z0-9]+$/.test(metadata.image)) return false;
  if (!Array.isArray(metadata.attributes) || metadata.attributes.length !== REQUIRED_TRAITS.length) return false;
  return metadata.attributes.every((attribute, index) => attribute
    && typeof attribute.trait_type === "string"
    && attribute.trait_type === REQUIRED_TRAITS[index]
    && typeof attribute.value === "string"
    && attribute.value.length <= 2_000
  );
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  // The client creates the standard metadata shape, then this endpoint verifies it before Pinata sees it.
  const metadata = (request.body as { metadata?: unknown } | undefined)?.metadata;
  if (!isValidMetadata(metadata) || Buffer.byteLength(JSON.stringify(metadata), "utf8") > MAX_METADATA_BYTES) {
    return response.status(400).json({ error: "The pet metadata is invalid or too large." });
  }

  const jwt = process.env.PINATA_JWT;
  if (!jwt) return response.status(503).json({ error: "Metadata uploads are not configured yet." });

  try {
    // PINATA_JWT is read only in this Vercel function, never in browser code.
    const pinata = new PinataSDK({ pinataJwt: jwt });
    const safeName = metadata.name.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "pet";
    const uploaded = await pinata.upload.public.json(metadata).name(`pawchain-pet-metadata-${Date.now()}-${safeName}`);
    return response.status(200).json({ cid: uploaded.cid, ipfsUri: `ipfs://${uploaded.cid}` });
  } catch (error) {
    // Avoid exposing Pinata internals while keeping the client message actionable.
    console.error("Pinata metadata upload failed", error);
    return response.status(502).json({ error: "The metadata upload failed. Check your connection and try again." });
  }
}
