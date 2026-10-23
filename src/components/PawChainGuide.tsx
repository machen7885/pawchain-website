import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string };

const starter: Message = {
  role: "assistant",
  content: "Hi — I’m the PawChain Guide. I can explain how the product works, how to connect MetaMask, and how pet identity tokenization works on Sepolia.",
};

const suggestions = ["How do I tokenize my pet ID?", "What data goes on chain?", "Is PawChain production-ready?"];

export function PawChainGuide(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([starter]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const result = await fetch("/api/pawchain-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      const payload = await result.json() as { answer?: string; error?: string };
      if (!result.ok || !payload.answer) throw new Error(payload.error ?? "The guide could not answer.");
      setMessages((current) => [...current, { role: "assistant", content: payload.answer! }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The guide could not answer.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void ask(input); };

  return <>
    {open && <aside className="fixed bottom-24 right-4 z-[90] flex h-[min(680px,calc(100svh-120px))] w-[min(410px,calc(100vw-32px))] flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071419]/95 shadow-[0_30px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl" aria-label="PawChain Guide">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Bot className="h-5 w-5" /></span><div><strong className="block text-sm font-medium text-white">PawChain Guide</strong><span className="flex items-center gap-1.5 text-[10px] text-white/35"><i className="h-1.5 w-1.5 rounded-full bg-primary" /> Product assistant</span></div></div>
        <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-white/45 hover:bg-white/5 hover:text-white" aria-label="Close PawChain Guide"><X className="h-4 w-4" /></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-primary text-[#071014]" : "rounded-bl-md border border-white/8 bg-white/[.045] text-white/70"}`}>{message.content}</div></div>)}
        {messages.length === 1 && <div className="grid gap-2">{suggestions.map((item) => <button key={item} onClick={() => void ask(item)} className="rounded-xl border border-white/8 px-3 py-2.5 text-left text-xs text-white/45 transition hover:border-primary/30 hover:text-white/75">{item}</button>)}</div>}
        {loading && <div className="flex items-center gap-2 text-xs text-white/35"><LoaderCircle className="h-4 w-4 animate-spin text-primary" /> Reading PawChain knowledge…</div>}
        {error && <p className="rounded-xl border border-red-300/15 bg-red-300/[.06] p-3 text-xs leading-5 text-red-100" role="alert">{error}</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="border-t border-white/10 p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-2 focus-within:border-primary/40"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(input); } }} rows={1} maxLength={1500} placeholder="Ask about PawChain…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/25" /><Button type="submit" size="sm" disabled={loading || !input.trim()} aria-label="Send question"><Send className="h-4 w-4" /></Button></div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[9px] text-white/25"><ShieldCheck className="h-3 w-3" /> Never share private keys, seed phrases, or personal data.</p>
      </form>
    </aside>}
    <button onClick={() => setOpen((value) => !value)} className="fixed bottom-5 right-5 z-[91] flex h-14 items-center gap-2 rounded-full border border-primary/25 bg-[#0b2022] px-5 text-sm font-medium text-white shadow-[0_15px_50px_rgba(0,0,0,.45),0_0_30px_rgba(136,240,220,.12)] transition hover:-translate-y-0.5 hover:border-primary/50" aria-expanded={open} aria-label={open ? "Close PawChain Guide" : "Open PawChain Guide"}>{open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5 text-primary" />}<span className="hidden sm:inline">Ask PawChain</span></button>
  </>;
}
