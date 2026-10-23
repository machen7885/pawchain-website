export type KnowledgeChunk = { id: string; title: string; keywords: string[]; content: string };

// Curated from PawChain's specification, threat model, ADRs, implementation, and roadmap.
// Keep this file synchronized when product decisions or user-facing flows change.
export const PAWCHAIN_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: "product",
    title: "Product promise and current maturity",
    keywords: ["what", "pawchain", "product", "status", "prototype", "identity"],
    content: "PawChain ID is an open-set biometric identity system for individual cats, bound to a responsible household, with vet-attested sterilisation status and a refundable deposit. The outcome is: a specific animal is bound to a specific responsible household, and a stranger can verify that binding in under 30 seconds with a phone. It is a prototype and single-city pilot design, not a deployed authority or a claim of regulatory adoption. Current repository work has implemented the capture pipeline foundations; registry, production PetID contract, attestations, and accountability are planned stages.",
  },
  {
    id: "user-flow",
    title: "How a household uses PawChain",
    keywords: ["use", "start", "register", "enrol", "enroll", "steps", "household"],
    content: "Intended user flow: connect a wallet; capture at least five quality-gated live frames; prove custody with two capture sessions at least 24 hours apart; run duplicate detection; create the PetID metadata; upload public metadata to IPFS; mint the soulbound PetID to the responsible household; then view the record and later receive vet-signed attestations. The current website wallet, mint, and owned-record components are frontend scaffolds and require the real deployed contract, IPFS uploader, and backend registry before production use.",
  },
  {
    id: "tokenization",
    title: "Tokenizing a pet identity",
    keywords: ["token", "tokenize", "mint", "nft", "erc721", "sepolia", "metamask", "ipfs"],
    content: "Prototype tokenization flow: install MetaMask, connect the wallet, switch to Sepolia, provide pet name/type/birth date/chip or NFC ID/owner note, upload ERC-721 metadata JSON to IPFS, then call mintPet(owner, metadataURI, chipId) and confirm the transaction. The UI shows the Sepolia transaction hash. The contract address is configured with VITE_PAWCHAIN_CONTRACT_ADDRESS. Never ask a user for a seed phrase or private key. The repository does not yet contain the production ERC-721 implementation or deployed address, so the assistant must clearly label tokenization as unavailable until those are configured.",
  },
  {
    id: "storage",
    title: "On-chain and off-chain storage",
    keywords: ["metadata", "storage", "ipfs", "chain", "biometric", "privacy", "chip"],
    content: "On chain: token ownership/binding, an immutable metadata URI, commitments, transfer history, and adjudicated decisions. IPFS/off chain: public descriptive NFT metadata. Registry/server only: biometric templates and sensitive operational records. Raw pet frames must be deleted within 24 hours. The token anchors only a salted hash commitment of a biometric template; raw images and reusable biometric templates must never be public or placed on chain. Owner notes and chip IDs placed in public NFT metadata are publicly readable, so users must not include private contact or medical information.",
  },
  {
    id: "soulbound",
    title: "Soulbound identity and transfers",
    keywords: ["soulbound", "transfer", "sell", "marketplace", "rehoming", "owner"],
    content: "A PetID is soulbound because responsibility must not be tradeable. Ordinary ERC-721 sales and marketplace transfers are intentionally rejected. Legitimate re-homing uses a two-party signed transfer ceremony with both household keys and a 72-hour cooling period, preserving a readable transfer history.",
  },
  {
    id: "capture",
    title: "Capture and biometric pipeline",
    keywords: ["camera", "capture", "photo", "scan", "face", "nose", "quality", "liveness"],
    content: "The capture pipeline is phone frame input, cat detection, landmark alignment, quality gating, multi-frame liveness, face plus nose signals, template extraction, open-set search, and deduplication. At least five accepted frames are required. Low-quality frames are rejected before upload. Templates are versioned; templates from different model versions must never be compared.",
  },
  {
    id: "accuracy",
    title: "Accuracy and human safeguards",
    keywords: ["accuracy", "false", "match", "threshold", "appeal", "penalty", "slash"],
    content: "Targets are top-1 identification at least 90% on unseen cats, false accept rate at most 1%, and false reject rate at most 10%. A false reject costs another scan; a false accept can wrongly accuse a household. Therefore every penalty path requires a human adjudicator, written finding, evidence bundle, and 30-day appeal window. Automated slashes permitted: zero.",
  },
  {
    id: "records",
    title: "Viewing owned PetIDs",
    keywords: ["view", "record", "owned", "wallet", "card", "history"],
    content: "The records module reads the connected MetaMask account on Sepolia, obtains token IDs through tokensOfOwner(address) or ERC721Enumerable, resolves tokenURI metadata through an IPFS gateway, and shows pet name, species, chip/NFC ID, token ID, and mint time. Mint time comes from mintedAt(tokenId) when available or the original Transfer event block timestamp.",
  },
  {
    id: "security",
    title: "Security and prohibited guidance",
    keywords: ["security", "private", "key", "seed", "fraud", "safe", "secret"],
    content: "Never request or accept wallet seed phrases, private keys, DeepSeek keys, biometric source images, or personal contact data in chat. Never claim PawChain is an authority, that a biometric match proves wrongdoing, or that the prototype is production-ready. Never guide users to bypass deduplication, custody proof, human review, appeals, or soulbound transfer controls.",
  },
];

function terms(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];
}

export function retrieveKnowledge(query: string, limit = 6): KnowledgeChunk[] {
  const queryTerms = new Set(terms(query));
  return PAWCHAIN_KNOWLEDGE
    .map((chunk) => {
      const haystack = new Set([...chunk.keywords, ...terms(chunk.title), ...terms(chunk.content)]);
      let score = 0;
      queryTerms.forEach((term) => { if (haystack.has(term)) score += chunk.keywords.includes(term) ? 4 : 1; });
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}
