import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Camera, Check, ChevronRight, Github, Menu, ScanFace, ShieldCheck, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const principles = [
  { no: "01", title: "Identity", caption: "Which animal is this?", body: "Face and nose-print recognition create a persistent biometric signature—independent of collars, chips, or claims.", meta: "WEEKS 02—04", icon: ScanFace },
  { no: "02", title: "Registration", caption: "Who is answerable?", body: "A soulbound PetID connects one animal to one responsible household, with a visible, auditable transfer ceremony.", meta: "WEEK 05", icon: ShieldCheck },
  { no: "03", title: "Attestation", caption: "Who can assert a fact?", body: "Signed veterinary credentials make sterilisation status verifiable—not a rumor hiding in a database field.", meta: "WEEKS 06—07", icon: Check },
  { no: "04", title: "Incentive", caption: "Why participate?", body: "A refundable deposit aligns action with accountability, while human review protects households from automated harm.", meta: "WEEK 07", icon: Sparkles },
];

const stages = [
  { key: "CAPTURE", title: "Phone frame in", note: "Live, multi-frame capture" },
  { key: "ALIGN", title: "Quality first", note: "Detect · landmark · align" },
  { key: "IDENTIFY", title: "PetID resolved", note: "Open-set biometric search" },
  { key: "VERIFY", title: "Binding verified", note: "Readable in under 30 seconds" },
];

const tickerItems = ["OPEN-SET IDENTITY", "FACE + NOSE SIGNAL", "HUMAN-GATED", "RAW FRAMES ≤ 24H", "VERIFY ≤ 30S"];

const communityCases = [
  {
    id: "CASE 001",
    title: "Portrait signal",
    image: "/community/community-cat-portrait.jpg",
    alt: "Orange-and-white community cat looking directly toward the camera",
    copy: "A close, steady portrait gives the capture flow a clear view of face landmarks and nose detail—the raw material for a persistent PetID.",
    condition: "CLOSE PORTRAIT",
    tags: ["FACE", "NOSE", "ALIGN"],
  },
  {
    id: "CASE 002",
    title: "Everyday capture",
    image: "/community/community-cat-home.jpg",
    alt: "Orange-and-white community cat standing on a bed in ordinary room light",
    copy: "Ordinary room light and natural movement reflect where PawChain needs to work: at home, on a phone, without a studio setup.",
    condition: "HOME LIGHT",
    tags: ["PHONE", "MULTI-FRAME", "QUALITY"],
  },
];

function CursorAura() {
  return <div className="cursor-aura" aria-hidden="true"><i /><b /></div>;
}

function SignalTicker() {
  return <div className="signal-ticker" aria-label="PawChain system characteristics">
    <div className="ticker-track">{[...tickerItems, ...tickerItems].map((item, i) => <span key={`${item}-${i}`}><i />{item}</span>)}</div>
  </div>;
}

function tiltMove(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") return;
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  target.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
  target.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
  target.style.setProperty("--spot-x", `${((x + .5) * 100).toFixed(1)}%`);
  target.style.setProperty("--spot-y", `${((y + .5) * 100).toFixed(1)}%`);
}

function tiltReset(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return <a href="#top" className="group inline-flex items-center gap-2.5" aria-label="PawChain home">
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><b /></span>
    <span className={cn("font-display font-semibold tracking-[-.05em]", compact ? "text-lg" : "text-xl")}>pawchain<span className="text-primary">.</span></span>
  </a>;
}

function CatSignal() {
  return <div className="signal-shell" aria-label="Animated cat identity scan visual">
    <div className="signal-orbit signal-orbit-a" /><div className="signal-orbit signal-orbit-b" />
    <div className="signal-grid" />
    <svg className="cat-line" viewBox="0 0 420 420" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="catStroke" x1="60" y1="60" x2="360" y2="360"><stop stopColor="#88f0dc"/><stop offset="1" stopColor="#5d7cff"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M113 155 86 76l80 43c13-5 28-8 44-8s31 3 44 8l80-43-27 79c23 28 36 64 36 101 0 89-50 132-113 132S97 345 97 256c0-37 13-73 36-101Z" fill="rgba(9,28,34,.28)" stroke="url(#catStroke)" strokeWidth="2" filter="url(#glow)"/>
      <path d="M155 239c14-12 30-17 55-17s41 5 55 17M176 271c22 18 46 18 68 0M210 244v28M150 245l-58-13M154 262l-66 6M270 245l58-13M266 262l66 6" fill="none" stroke="url(#catStroke)" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
      <circle cx="160" cy="211" r="6" fill="#88f0dc"/><circle cx="260" cy="211" r="6" fill="#88f0dc"/><circle cx="210" cy="246" r="5" fill="#7388ff"/>
      <g fill="none" stroke="#88f0dc" opacity=".24"><path d="M30 210h70M320 210h70M210 30v79M210 388v-40"/><circle cx="210" cy="235" r="170"/><circle cx="210" cy="235" r="142" strokeDasharray="3 7"/></g>
    </svg>
    <div className="scan-line" />
    <div className="signal-chip signal-chip-left"><span>FACE</span><strong>0.94</strong></div>
    <div className="signal-chip signal-chip-right"><span>LIVENESS</span><strong>PASS</strong></div>
    <div className="signal-status"><i /> BIOMETRIC SIGNAL ACQUIRED</div>
  </div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [["System", "#system"], ["Community", "#community"], ["Protocol", "#protocol"], ["Principles", "#principles"], ["Roadmap", "#roadmap"]];
  return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8 md:pt-6">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between rounded-full border border-white/10 bg-[#071014]/70 px-5 backdrop-blur-xl md:px-7">
      <Wordmark compact />
      <nav className="hidden items-center gap-6 lg:flex xl:gap-8">{nav.map(([label, href]) => <a key={label} href={href} className="nav-link">{label}</a>)}</nav>
      <div className="hidden items-center gap-2 lg:flex">
        <Button variant="ghost" size="sm" asChild><a href="https://github.com/machen7885/pawchain" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> GitHub</a></Button>
        <Button size="sm" asChild><a href="#protocol">Explore the protocol <ArrowRight className="h-3.5 w-3.5" /></a></Button>
      </div>
      <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 lg:hidden" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <div className="mx-auto mt-2 max-w-[1440px] rounded-[1.5rem] border border-white/10 bg-[#0a151a]/95 p-4 backdrop-blur-xl lg:hidden">{nav.map(([label, href]) => <a onClick={() => setOpen(false)} key={label} href={href} className="block rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white">{label}</a>)}</div>}
  </header>;
}

function Metric({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const target = Number(value.match(/[\d.]+/)?.[0] ?? 0);
  const [display, setDisplay] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    const duration = 1100;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, target, visible]);

  const rendered = value.replace(/[\d.]+/, Number.isInteger(target) ? String(Math.round(display)) : display.toFixed(1));
  return <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: .7, ease: [0.22, 1, 0.36, 1] }} className="metric">
    <strong>{rendered}</strong><span>{label}</span>
  </motion.div>;
}

function SectionLabel({ children, index }: { children: string; index: string }) {
  return <div className="section-label"><span>{index}</span><div className="h-px flex-1 bg-white/10"/><em>{children}</em></div>;
}

export default function App() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroY = useTransform(scrollYProgress, [0, .2], [0, 100]);
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => { const t = setInterval(() => setActiveStage(v => (v + 1) % stages.length), 2600); return () => clearInterval(t); }, []);
  useEffect(() => {
    let frame = 0;
    const updatePointer = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        root.style.setProperty("--cursor-x", `${event.clientX}px`);
        root.style.setProperty("--cursor-y", `${event.clientY}px`);
        root.style.setProperty("--hero-rx", `${((.5 - event.clientY / innerHeight) * 4).toFixed(2)}deg`);
        root.style.setProperty("--hero-ry", `${((event.clientX / innerWidth - .5) * 5).toFixed(2)}deg`);
        root.style.setProperty("--hero-x", `${((event.clientX / innerWidth - .5) * 16).toFixed(1)}px`);
        root.style.setProperty("--hero-y", `${((event.clientY / innerHeight - .5) * 12).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointermove", updatePointer); };
  }, []);
  const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ left: `${6 + (i * 37) % 90}%`, top: `${8 + (i * 53) % 84}%`, animationDelay: `${(i % 6) * .6}s` })), []);

  return <div id="top" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
    <CursorAura />
    <motion.div className="fixed left-0 right-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-primary to-[#7189ff]" style={{ scaleX: progress }} />
    <Header />

    <main>
      <section className="hero relative flex min-h-[100svh] items-end px-5 pb-10 pt-32 md:px-10 md:pb-14 lg:px-16">
        <div className="hero-haze" />
        {particles.map((p, i) => <i key={i} className="particle" style={p} />)}
        <motion.div style={{ y: heroY }} className="mx-auto grid min-w-0 w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 min-w-0 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .7 }}><Badge className="mb-7"><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_#88f0dc]" /> Applied AI · Verifiable Identity</Badge></motion.div>
            <motion.h1 initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: .16, duration: 1, ease: [0.22, 1, 0.36, 1] }} className="hero-title">Every animal,<br/><span>known.</span></motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .8 }} className="mt-7 max-w-xl text-lg leading-relaxed text-white/55 md:text-xl">A biometric identity and accountability protocol for cats—binding one animal to one responsible household, without turning trust into a black box.</motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .48, duration: .75 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><a href="#system">See how it works <ArrowDown className="h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" asChild><a href="https://github.com/machen7885/pawchain" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> View the build</a></Button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .62, duration: .8 }} className="mt-12 flex max-w-xl border-t border-white/10 pt-6">
              <div className="mr-6 border-r border-white/10 pr-6"><p className="mono-label">SYSTEM PROMISE</p><p className="mt-2 max-w-[230px] text-sm text-white/60">A stranger can verify the binding in under 30 seconds.</p></div>
              <div><p className="mono-label">CURRENT STATE</p><p className="mt-2 inline-flex items-center gap-2 text-sm text-white/60"><i className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Pilot prototype · Week 02</p></div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .24, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="relative flex min-h-[480px] min-w-0 items-center justify-center lg:min-h-[650px]"><div className="signal-parallax"><CatSignal /></div></motion.div>
        </motion.div>
        <div className="absolute bottom-7 right-8 hidden items-center gap-3 text-[10px] uppercase tracking-[.24em] text-white/25 xl:flex"><span>Scroll to investigate</span><span className="grid h-8 w-8 place-items-center rounded-full border border-white/10"><ArrowDown className="h-3 w-3" /></span></div>
      </section>

      <SignalTicker />

      <section id="system" className="section-wrap border-t border-white/10">
        <SectionLabel index="01">THE SYSTEM</SectionLabel>
        <div className="grid gap-16 py-20 lg:grid-cols-[.8fr_1.2fr] lg:py-32">
          <div><Badge>THE OUTCOME</Badge><h2 className="section-title mt-6">Identity is not<br/>a name on paper.</h2></div>
          <div className="lg:pt-16"><p className="statement">A specific animal is bound to a specific responsible household—and that relationship can be verified by anyone with a phone.</p><p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/48">PawChain combines biometric recognition, verifiable credentials, and human-governed accountability. The chain records commitments and decisions. The raw biometric never needs to become public.</p>
            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-4"><Metric value="≤ 30s" label="Verify a binding"/><Metric value="≤ 1%" label="False accept budget" delay={.08}/><Metric value="0" label="Automated penalties" delay={.16}/><Metric value="≤ 24h" label="Raw image retention" delay={.24}/></div>
          </div>
        </div>
      </section>

      <section id="community" className="community-section relative overflow-hidden border-y border-white/10 py-24 lg:py-32">
        <div className="community-haze" aria-hidden="true" />
        <div className="section-wrap relative z-10">
          <SectionLabel index="02">EARLY COMMUNITY CASES</SectionLabel>
          <div className="mt-14 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <Badge><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_#88f0dc]" /> REAL-WORLD INPUT</Badge>
              <h2 className="section-title mt-7">Real pets.<br/><span className="text-white/28">Real signals.</span></h2>
            </div>
            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-xl leading-relaxed text-white/62 md:text-2xl">Early community members are helping PawChain learn what capture looks like outside a lab: different distance, light, posture, and movement.</p>
              <p className="mt-5 text-sm leading-relaxed text-white/38">These are community-submitted pilot examples, not published biometric results. They show the conditions the prototype is being designed to handle.</p>
            </div>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-12 lg:items-start">
            {communityCases.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * .1, duration: .75, ease: [0.22, 1, 0.36, 1] }} className={cn("community-case", index === 0 ? "lg:col-span-7" : "lg:col-span-5 lg:mt-24")}>
              <Card onPointerMove={tiltMove} onPointerLeave={tiltReset} className="case-card tilt-surface h-full overflow-hidden border-white/12 bg-[#091619]">
                <img src={item.image} alt={item.alt} className="case-photo" loading="lazy" />
                <div className="case-photo-shade" />
                <div className="case-scan-line" aria-hidden="true" />
                <div className="case-frame" aria-hidden="true"><i/><i/><i/><i/></div>
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 font-mono text-[9px] tracking-[.16em] text-white/68 md:p-7">
                  <span>{item.id} / COMMUNITY</span><span className="live-label"><i /> PILOT INPUT</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8">
                  <div className="mb-5 flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="case-tag">{tag}</span>)}</div>
                  <p className="font-mono text-[10px] tracking-[.16em] text-primary/75">{item.condition}</p>
                  <h3 className="mt-3 text-4xl font-semibold tracking-[-.055em] md:text-5xl">{item.title}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/58 md:text-base">{item.copy}</p>
                </div>
              </Card>
            </motion.article>)}
          </div>

          <div className="community-flow mt-5 grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:grid-cols-3">
            <div><Camera/><span>01 / GUIDED CAPTURE</span><strong>5+ quality-gated frames</strong><p>A phone-led sequence gathers more than one lucky angle.</p></div>
            <div><ScanFace/><span>02 / ON-DEVICE GATE</span><strong>Weak frames stay local</strong><p>Blurred or unusable frames are re-prompted before upload.</p></div>
            <div><ShieldCheck/><span>03 / PRIVACY BOUNDARY</span><strong>Raw frames ≤ 24 hours</strong><p>The durable record is a template—not a public photo gallery.</p></div>
          </div>
        </div>
      </section>

      <section id="protocol" className="relative bg-[#dce8e5] px-5 py-24 text-[#081516] md:px-10 lg:px-16 lg:py-32">
        <div className="absolute inset-0 protocol-grid opacity-35" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><Badge className="border-[#183b37]/15 bg-[#183b37]/5 text-[#183b37]">LIVE PROTOCOL</Badge><h2 className="mt-6 max-w-4xl text-[clamp(3.4rem,7vw,7.5rem)] font-semibold leading-[.85] tracking-[-.075em]">From a glance<br/>to a <span className="text-[#1c8573]">proof.</span></h2></div><p className="max-w-sm text-base leading-relaxed text-[#203735]/65">One continuous path from phone camera to a privacy-preserving, human-readable identity binding.</p></div>
          <div className="mt-20 grid items-stretch gap-4 lg:grid-cols-[.72fr_1.28fr]">
            <div className="space-y-2">{stages.map((stage, i) => <button key={stage.key} onMouseEnter={() => setActiveStage(i)} onFocus={() => setActiveStage(i)} className={cn("stage-button", i === activeStage && "active")}><span>0{i+1}</span><div><strong>{stage.title}</strong><small>{stage.note}</small></div><ChevronRight /></button>)}</div>
            <Card onPointerMove={tiltMove} onPointerLeave={tiltReset} className="protocol-card tilt-surface relative min-h-[560px] overflow-hidden border-[#183b37]/15 bg-[#0b1a1b] text-white">
              <div className="tilt-glow"/><div className="protocol-card-grid"/><div className="protocol-stream stream-a"><i /></div><div className="protocol-stream stream-b"><i /></div><div className="protocol-stream stream-c"><i /></div><div className="absolute left-6 top-6 right-6 flex justify-between font-mono text-[10px] tracking-[.16em] text-white/35"><span>PAWCHAIN / CAPTURE.PIPELINE</span><span className="live-label"><i /> LIVE SIMULATION</span></div>
              <div className="absolute inset-0 grid place-items-center"><motion.div key={activeStage} initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} className="pipeline-core"><div className="pipeline-rings"/><ScanFace className="h-14 w-14 text-primary"/><span>{stages[activeStage].key}</span></motion.div></div>
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2"><div className="readout"><span>QUALITY</span><strong>{activeStage > 0 ? "0.92" : "SCANNING"}</strong></div><div className="readout"><span>LIVENESS</span><strong>{activeStage > 1 ? "PASS" : "PENDING"}</strong></div><div className="readout"><span>LATENCY</span><strong>{activeStage === 3 ? "84 MS" : "—"}</strong></div></div>
            </Card>
          </div>
        </div>
      </section>

      <section id="principles" className="section-wrap py-24 lg:py-32">
        <SectionLabel index="03">FOUR PRIMITIVES</SectionLabel>
        <div className="mt-16 grid gap-12 lg:grid-cols-[.65fr_1.35fr]"><div className="lg:sticky lg:top-32 lg:self-start"><h2 className="section-title">Remove one.<br/><span className="text-white/28">Watch it collapse.</span></h2><p className="mt-6 max-w-sm leading-relaxed text-white/45">Each layer answers one question the layer below cannot. Together, they turn recognition into accountability.</p></div>
          <div className="divide-y divide-white/10 border-y border-white/10">{principles.map((item, i) => <motion.article key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: i * .06 }} className="principle group"><div className="flex items-center gap-5"><span className="font-mono text-xs text-primary">{item.no}</span><item.icon className="h-5 w-5 text-white/30 transition-colors group-hover:text-primary"/><div><h3>{item.title}</h3><p>{item.caption}</p></div></div><p className="max-w-md text-sm leading-relaxed text-white/45">{item.body}</p><span className="font-mono text-[10px] tracking-[.14em] text-white/25">{item.meta}</span></motion.article>)}</div>
        </div>
      </section>

      <section className="section-wrap py-20 lg:py-28">
        <div onPointerMove={tiltMove} onPointerLeave={tiltReset} className="risk-panel tilt-surface"><div className="tilt-glow"/><div className="risk-noise"/><div className="risk-orbit"/><div className="relative z-10 grid gap-14 lg:grid-cols-2"><div><Badge className="border-[#8fa0ff]/30 bg-[#798dff]/10 text-[#aebaff]">ERRORS HAVE CONSEQUENCES</Badge><h2 className="mt-7 text-5xl font-semibold leading-[.95] tracking-[-.06em] md:text-7xl">Accuracy is not<br/>a moral alibi.</h2></div><div className="flex flex-col justify-end"><p className="text-xl leading-relaxed text-white/62">A failed scan costs seconds. A wrong match can cost a household money and reputation. PawChain’s threshold is designed around that asymmetry.</p><div className="mt-9 grid grid-cols-2 gap-3"><div className="risk-stat"><span>FALSE REJECT</span><strong>≤ 10%</strong><small>Scan again</small></div><div className="risk-stat accent"><span>FALSE ACCEPT</span><strong>≤ 1%</strong><small>Human review required</small></div></div></div></div></div>
      </section>

      <section id="roadmap" className="section-wrap py-24 lg:py-32">
        <SectionLabel index="04">BUILD IN PUBLIC</SectionLabel>
        <div className="mt-16 flex flex-col justify-between gap-10 lg:flex-row lg:items-end"><h2 className="section-title max-w-3xl">Eight weeks.<br/>One verifiable system.</h2><Button variant="outline" asChild><a href="https://github.com/machen7885/pawchain" target="_blank" rel="noreferrer">Follow the evidence <Github className="h-4 w-4" /></a></Button></div>
        <div className="mt-16 overflow-x-auto pb-4"><div className="roadmap min-w-[1050px]">{["Problem framing", "Capture pipeline", "Biometric identity", "Eval harness", "Registry", "DID + credentials", "Accountability", "Demo day"].map((label, i) => <div key={label} className={cn("roadmap-item", i < 2 && "done", i === 1 && "current")}><span>0{i+1}</span><i/><strong>{label}</strong><small>{i === 0 ? "SHIPPED" : i === 1 ? "IN BUILD" : "PLANNED"}</small></div>)}</div></div>
      </section>

      <section className="px-5 pb-5 md:px-8 md:pb-8"><div onPointerMove={tiltMove} onPointerLeave={tiltReset} className="cta-panel tilt-surface"><div className="tilt-glow dark"/><div className="cta-orb"/><div className="cta-sweep"/><div className="relative z-10"><Badge>OPEN PROTOTYPE</Badge><h2>Make every<br/>identity count.</h2><p>Read the decisions. Run the gates. Challenge the system.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" className="bg-[#071014] text-white hover:bg-[#0c1c22]" asChild><a href="https://github.com/machen7885/pawchain" target="_blank" rel="noreferrer">Explore on GitHub <ArrowRight className="h-4 w-4" /></a></Button><Button size="lg" variant="outline" className="border-[#071014]/20 text-[#071014] hover:bg-[#071014]/5" asChild><a href="#top">Back to signal</a></Button></div></div></div></section>
    </main>

    <footer className="px-6 py-10 md:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center"><Wordmark compact/><p className="max-w-md text-xs leading-relaxed text-white/30">Prototype · single-city pilot · not deployed · not an enforcement authority</p><div className="flex items-center gap-5"><a className="footer-link" href="#community">Community</a><a className="footer-link" href="https://github.com/machen7885/pawchain" target="_blank" rel="noreferrer">GitHub ↗</a></div></div></footer>
  </div>;
}
