import { useState, type FormEvent } from "react";
import { CheckCircle2, FileJson, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PetDetails = {
  petName: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  distinctiveMarks: string;
  vaccinationRecords: string;
  ownerNickname: string;
  contactNote: string;
};

export type Erc721Metadata = {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
};

export type MetadataUploadResult = {
  cid: string;
  ipfsUri: string;
  metadata: Erc721Metadata;
};

type PetMetadataFormProps = {
  /** The CID emitted by PetPhotoUpload after the pet photo reaches IPFS. */
  imageCid?: string;
  /** Pass the metadata CID to the NFT mint module when it is ready. */
  onMetadataUploaded?: (result: MetadataUploadResult) => void;
  endpoint?: string;
  className?: string;
};

const emptyDetails: PetDetails = {
  petName: "", breed: "", dateOfBirth: "", gender: "", distinctiveMarks: "", vaccinationRecords: "", ownerNickname: "", contactNote: "",
};

/** Creates the portable JSON shape marketplaces and ERC-721 tokenURI readers expect. */
export function createPetMetadata(details: PetDetails, imageCid: string): Erc721Metadata {
  const value = (input: string) => input.trim() || "Not provided";
  return {
    name: details.petName.trim(),
    description: `PawChain PetID for ${details.petName.trim()}. Pet details were supplied by the owner and stored as NFT metadata on IPFS.`,
    image: `ipfs://${imageCid}`,
    // Keep every requested field as a standard ERC-721 attribute, including blank optional answers.
    attributes: [
      { trait_type: "Breed", value: value(details.breed) },
      { trait_type: "Date of Birth", value: value(details.dateOfBirth) },
      { trait_type: "Gender", value: value(details.gender) },
      { trait_type: "Distinctive Marks", value: value(details.distinctiveMarks) },
      { trait_type: "Vaccination Records", value: value(details.vaccinationRecords) },
      { trait_type: "Owner Nickname", value: value(details.ownerNickname) },
      { trait_type: "Contact Note", value: value(details.contactNote) },
    ],
  };
}

export function PetMetadataForm({ imageCid, onMetadataUploaded, endpoint = "/api/pet-metadata-upload", className }: PetMetadataFormProps) {
  const [details, setDetails] = useState<PetDetails>(emptyDetails);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<MetadataUploadResult | null>(null);

  function update<K extends keyof PetDetails>(field: K, value: PetDetails[K]) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!details.petName.trim()) return setError("Pet name is required.");
    if (!imageCid) return setError("Upload a pet photo first so its IPFS CID can be added to the metadata.");

    const metadata = createPetMetadata(details, imageCid);
    setIsUploading(true);
    try {
      // The JSON is created on the client so the parent can use the exact metadata it sends for minting.
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      });
      const payload = await response.json().catch(() => ({})) as Partial<{ cid: string; ipfsUri: string; error: string }>;
      if (!response.ok || !payload.cid || !payload.ipfsUri) throw new Error(payload.error || "Metadata could not be uploaded. Please try again.");

      const result = { cid: payload.cid, ipfsUri: payload.ipfsUri, metadata };
      setSuccess(result);
      onMetadataUploaded?.(result);
    } catch (uploadError) {
      // This catches both a failed fetch and the friendly error returned by the Vercel endpoint.
      setError(uploadError instanceof Error ? uploadError.message : "A network error stopped the metadata upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return <section className={cn("rounded-[2rem] border border-white/10 bg-[#0a151a] p-6 shadow-[0_24px_80px_rgba(0,0,0,.2)] md:p-8", className)} aria-labelledby="pet-metadata-title">
    <p className="font-mono text-[10px] tracking-[.16em] text-primary">STEP 02 / PET METADATA</p>
    <h2 id="pet-metadata-title" className="mt-3 text-3xl font-semibold tracking-[-.05em] text-white">Create your pet&apos;s on-chain profile</h2>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55">This generates standard ERC-721 metadata and pins it to IPFS. The metadata CID is what the mint step will use as the NFT&apos;s token URI.</p>
    {!imageCid && <div role="status" className="mt-5 rounded-xl border border-amber-200/20 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-100/85">Waiting for a pet photo CID. Complete Step 01 first.</div>}
    {imageCid && <p className="mt-5 break-all font-mono text-[11px] text-primary/80">PHOTO CID / {imageCid}</p>}

    <form onSubmit={submit} className="mt-7 grid gap-5 md:grid-cols-2">
      <label className="grid gap-2 text-sm text-white/75">Pet name <input required value={details.petName} onChange={(event) => update("petName", event.target.value)} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="Mochi" /></label>
      <label className="grid gap-2 text-sm text-white/75">Breed <input value={details.breed} onChange={(event) => update("breed", event.target.value)} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="Domestic shorthair" /></label>
      <label className="grid gap-2 text-sm text-white/75">Date of birth <input type="date" value={details.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" /></label>
      <label className="grid gap-2 text-sm text-white/75">Gender <select value={details.gender} onChange={(event) => update("gender", event.target.value)} className="rounded-xl border border-white/12 bg-[#0a151a] px-4 py-3 text-white outline-none transition focus:border-primary/70"><option value="">Select (optional)</option><option>Female</option><option>Male</option><option>Unknown</option></select></label>
      <label className="grid gap-2 text-sm text-white/75 md:col-span-2">Distinctive marks <textarea value={details.distinctiveMarks} onChange={(event) => update("distinctiveMarks", event.target.value)} className="min-h-24 rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="For example: white patch on chest, green eyes" /></label>
      <label className="grid gap-2 text-sm text-white/75 md:col-span-2">Vaccination records <textarea value={details.vaccinationRecords} onChange={(event) => update("vaccinationRecords", event.target.value)} className="min-h-24 rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="For example: rabies vaccine, date, clinic reference" /></label>
      <label className="grid gap-2 text-sm text-white/75">Owner nickname <input value={details.ownerNickname} onChange={(event) => update("ownerNickname", event.target.value)} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="Alex" /></label>
      <label className="grid gap-2 text-sm text-white/75">Contact note <input value={details.contactNote} onChange={(event) => update("contactNote", event.target.value)} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-3 text-white outline-none transition focus:border-primary/70" placeholder="A safe way to contact the owner" /></label>
      <p className="md:col-span-2 text-xs leading-relaxed text-amber-100/65">Only include information you are comfortable making public. IPFS content and NFT metadata are not private and may be permanently accessible.</p>
      <div className="md:col-span-2"><button type="submit" disabled={isUploading || !imageCid} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-[#071014] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{isUploading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Uploading metadata…</> : <><FileJson className="h-4 w-4" /> Generate & upload metadata</>}</button></div>
    </form>

    {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</div>}
    {success && <div role="status" className="mt-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Metadata uploaded successfully.</div><p className="mt-2 break-all font-mono text-xs text-primary/80">METADATA CID: {success.cid}</p></div>}
  </section>;
}
