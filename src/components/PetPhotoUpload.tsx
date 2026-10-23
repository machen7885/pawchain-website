import { useEffect, useId, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, RotateCcw, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export type PetPhotoUploadResult = {
  cid: string;
  ipfsUri: string;
  fileName: string;
};

type PetPhotoUploadProps = {
  /** Called after Pinata has returned a permanent IPFS content identifier. */
  onUploaded?: (result: PetPhotoUploadResult) => void;
  /** Lets another page reuse the component with a different server endpoint. */
  endpoint?: string;
  className?: string;
};

function validationMessage(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  // Check both the browser-reported MIME type and the filename extension before upload.
  if (!ACCEPTED_TYPES.has(file.type) || !ACCEPTED_EXTENSIONS.has(extension)) return "Choose a JPG, PNG, or WebP image.";
  if (file.size > MAX_FILE_SIZE) return "This image is larger than 10 MB. Choose a smaller file.";
  return null;
}

export function PetPhotoUpload({ onUploaded, endpoint = "/api/pet-photo-upload", className }: PetPhotoUploadProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PetPhotoUploadResult | null>(null);

  // Object URLs are local browser previews only; release them when selection changes or unmounts.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(nextFile: File | null) {
    setError(null);
    setSuccess(null);
    if (!nextFile) return;
    const validationError = validationMessage(nextFile);
    if (validationError) {
      setFile(null);
      setPreviewUrl(null);
      setError(validationError);
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
  }

  async function uploadPhoto() {
    if (!file || isUploading) return;
    setError(null);
    setSuccess(null);
    setIsUploading(true);
    try {
      // FormData keeps the binary image out of JSON and sends it to our secure Vercel endpoint.
      const body = new FormData();
      body.append("photo", file, file.name);
      const response = await fetch(endpoint, { method: "POST", body });
      const payload = await response.json().catch(() => ({})) as Partial<PetPhotoUploadResult & { error: string }>;
      if (!response.ok || !payload.cid || !payload.ipfsUri || !payload.fileName) throw new Error(payload.error || "The image could not be uploaded. Please try again.");
      const result: PetPhotoUploadResult = { cid: payload.cid, ipfsUri: payload.ipfsUri, fileName: payload.fileName };
      setSuccess(result);
      onUploaded?.(result);
    } catch (uploadError) {
      // Fetch throws for offline / network errors; the server returns a readable message for API errors.
      setError(uploadError instanceof Error ? uploadError.message : "A network error stopped the upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return <section className={cn("rounded-[2rem] border border-primary/20 bg-[#091619] p-6 shadow-[0_24px_80px_rgba(0,0,0,.24)] md:p-8", className)} aria-labelledby="photo-upload-title">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] tracking-[.16em] text-primary">STEP 01 / PHOTO UPLOAD</p><h2 id="photo-upload-title" className="mt-3 text-3xl font-semibold tracking-[-.05em] text-white">Upload your cat&apos;s best portrait</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">Use one clear, front-facing photo. JPG, PNG, or WebP only — up to 10 MB.</p></div>{file && <button type="button" onClick={reset} disabled={isUploading} className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /> Choose another</button>}</div>
    {!previewUrl ? <label htmlFor={inputId} className="mt-7 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-primary/[.035] p-6 text-center transition hover:border-primary/70 hover:bg-primary/[.07]"><ImagePlus className="h-8 w-8 text-primary" /><span className="mt-4 text-sm font-medium text-white">Select a photo from this device</span><span className="mt-2 text-xs text-white/42">Your picture is previewed before anything is uploaded.</span><input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /></label> : <div className="mt-7 grid gap-5 md:grid-cols-[220px_1fr] md:items-center"><img src={previewUrl} alt={`Preview of ${file?.name ?? "selected cat photo"}`} className="aspect-square w-full rounded-2xl border border-white/10 object-cover md:w-[220px]" /><div><p className="text-sm font-medium text-white">{file?.name}</p><p className="mt-1 text-xs text-white/42">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""} · ready to upload</p><button type="button" onClick={uploadPhoto} disabled={isUploading} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-[#071014] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{isUploading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Uploading to IPFS…</> : <><UploadCloud className="h-4 w-4" /> Upload photo to IPFS</>}</button></div></div>}
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</div>}
    {success && <div role="status" className="mt-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Photo uploaded successfully.</div><p className="mt-2 break-all font-mono text-xs text-primary/80">IPFS CID: {success.cid}</p></div>}
  </section>;
}
