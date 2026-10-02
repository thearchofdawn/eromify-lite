"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Clapperboard, ImagePlus, LayoutDashboard, Library, Plus, Sparkles, Wand2 } from "lucide-react";
import { personas } from "@/src/lib/demo-data";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Personas", icon: Sparkles },
  { label: "Generate", icon: Wand2 },
  { label: "Gallery", icon: Library },
  { label: "Videos", icon: Clapperboard }
];

export default function Home() {
  const [active, setActive] = useState("Generate");
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [prompt, setPrompt] = useState("Luxury rooftop fashion photoshoot at golden hour, editorial lighting, premium Instagram aesthetic");
  const [ratio, setRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("4:5");
  const [count, setCount] = useState(4);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const persona = useMemo(() => personas.find((p) => p.id === personaId)!, [personaId]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personaId, prompt, aspectRatio: ratio, count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(data.outputs ?? []);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-line bg-[#0d0d13] p-5 hidden md:flex md:flex-col">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.3em] text-violet">AI Creator Studio</div>
            <div className="mt-2 text-2xl font-semibold">Eromify Lite</div>
          </div>
          <nav className="space-y-1">
            {nav.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => setActive(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === label ? "bg-violet/15 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-line bg-panel p-4">
            <div className="text-xs text-zinc-500">LOCAL MODE</div>
            <div className="mt-1 text-sm">Demo provider active</div>
            <div className="mt-3 h-1.5 rounded-full bg-zinc-800"><div className="h-full w-1/4 rounded-full bg-violet" /></div>
            <div className="mt-2 text-xs text-zinc-500">Swap to ComfyUI in .env.local</div>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-line px-5 py-4 md:px-8 flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-500">Studio / {active}</div>
              <h1 className="mt-1 text-xl font-semibold">{active}</h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              <Plus size={16} /> New Persona
            </button>
          </header>

          <div className="p-5 md:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-3xl border border-line bg-panel p-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400"><Wand2 size={16} /> Image Generator</div>
                <div className="mt-6 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-wider text-zinc-500">Persona</span>
                    <select value={personaId} onChange={(e) => setPersonaId(e.target.value)}
                      className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none focus:border-violet">
                      {personas.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.description}</option>)}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-wider text-zinc-500">Prompt</span>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
                      className="resize-none rounded-xl border border-line bg-black/30 px-4 py-3 text-sm leading-6 outline-none focus:border-violet" />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">Aspect ratio</span>
                      <select value={ratio} onChange={(e) => setRatio(e.target.value as typeof ratio)}
                        className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none">
                        {["1:1","4:5","9:16","16:9"].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">Images</span>
                      <select value={count} onChange={(e) => setCount(Number(e.target.value))}
                        className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none">
                        {[1,2,4,8].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  </div>

                  <button onClick={generate} disabled={loading}
                    className="group flex items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-medium text-white shadow-glow disabled:opacity-60">
                    {loading ? "Generating…" : "Generate images"} <ArrowUpRight size={17} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-panel p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">Current persona</div>
                  <span className="rounded-full bg-violet/10 px-3 py-1 text-xs text-violet">Identity profile</span>
                </div>
                <div className="mt-5 rounded-2xl border border-line bg-black/20 p-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet/30 to-fuchsia/10">
                    <Sparkles size={28} className="text-violet" />
                  </div>
                  <div className="mt-4 text-lg font-semibold">{persona.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">{persona.description}</div>
                  <p className="mt-4 text-sm leading-6 text-zinc-500">{persona.visualProfile}</p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric label="Images" value="—" />
                  <Metric label="Videos" value="—" />
                  <Metric label="Jobs" value="—" />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-line bg-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-400">Latest outputs</div>
                  <div className="mt-1 text-lg font-semibold">Your generated content</div>
                </div>
                <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ImagePlus size={16}/> Gallery</button>
              </div>
              {images.length ? (
                <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {images.map((src, i) => <img key={i} src={src} alt={`${persona.name} generated ${i+1}`} className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-white/5" />)}
                </div>
              ) : (
                <div className="mt-5 flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-line bg-black/10 text-center">
                  <div><Sparkles className="mx-auto text-zinc-600" size={28}/><div className="mt-3 text-sm text-zinc-500">Generate a batch to see your content here.</div></div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-line bg-black/15 p-4"><div className="text-xs text-zinc-600">{label}</div><div className="mt-2 text-lg">{value}</div></div>;
}
