"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clapperboard, ImagePlus, LayoutDashboard, Library, Plus, Sparkles, Upload, Wand2 } from "lucide-react";
import { personas as demoPersonas } from "@/src/lib/demo-data";
import type { Persona } from "@/src/lib/types";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Personas", icon: Sparkles },
  { label: "Generate", icon: Wand2 },
  { label: "Gallery", icon: Library },
  { label: "Videos", icon: Clapperboard }
];

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function Home() {
  const [active, setActive] = useState("Generate");
  const [personas, setPersonas] = useState<Persona[]>(demoPersonas);
  const [personaId, setPersonaId] = useState(demoPersonas[0].id);
  const [prompt, setPrompt] = useState("Luxury rooftop fashion photoshoot at golden hour, editorial lighting, premium Instagram aesthetic");
  const [ratio, setRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("4:5");
  const [count, setCount] = useState(4);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [personaModal, setPersonaModal] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    fetch("/api/personas")
      .then(async res => {
        if (res.status === 401) { window.location.href = "/login"; return null; }
        return res.json();
      })
      .then(data => {
        if (data?.personas?.length) {
          setPersonas(data.personas.map((p: any) => ({
            id: p.id, name: p.name, description: p.description,
            visualProfile: p.visual_profile, referenceImageUrl: p.reference_image_path,
            createdAt: p.created_at
          })));
        }
      })
      .catch(() => {});
  }, []);

  const persona = useMemo(() => personas.find(p => p.id === personaId) ?? personas[0], [personaId, personas]);

  async function generate() {
    if (!persona) return;
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
    } finally { setLoading(false); }
  }

  function addPersona(p: Persona) {
    setPersonas(current => [p, ...current]);
    setPersonaId(p.id);
    setPersonaModal(false);
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
            <div className="text-xs text-zinc-500">{supabaseConfigured ? "CLOUD + LOCAL" : "LOCAL MODE"}</div>
            <div className="mt-1 text-sm">{supabaseConfigured ? "Supabase persistence ready" : "Demo provider active"}</div>
            <div className="mt-3 h-1.5 rounded-full bg-zinc-800"><div className="h-full w-1/2 rounded-full bg-violet" /></div>
            <div className="mt-2 text-xs text-zinc-500">{supabaseConfigured ? "ComfyUI can run on your own GPU" : "Add Supabase + ComfyUI in .env.local"}</div>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-line px-5 py-4 md:px-8 flex items-center justify-between">
            <div><div className="text-sm text-zinc-500">Studio / {active}</div><h1 className="mt-1 text-xl font-semibold">{active}</h1></div>
            <button onClick={() => setPersonaModal(true)} className="flex items-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              <Plus size={16} /> New Persona
            </button>
          </header>

          <div className="p-5 md:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-3xl border border-line bg-panel p-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400"><Wand2 size={16} /> Image Generator</div>
                <div className="mt-6 grid gap-5">
                  <label className="grid gap-2"><span className="text-xs uppercase tracking-wider text-zinc-500">Persona</span>
                    <select value={personaId} onChange={e => setPersonaId(e.target.value)} className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none focus:border-violet">
                      {personas.map(p => <option key={p.id} value={p.id}>{p.name} — {p.description}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2"><span className="text-xs uppercase tracking-wider text-zinc-500">Prompt</span>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="resize-none rounded-xl border border-line bg-black/30 px-4 py-3 text-sm leading-6 outline-none focus:border-violet" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2"><span className="text-xs uppercase tracking-wider text-zinc-500">Aspect ratio</span>
                      <select value={ratio} onChange={e => setRatio(e.target.value as typeof ratio)} className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none">{["1:1","4:5","9:16","16:9"].map(r=><option key={r}>{r}</option>)}</select>
                    </label>
                    <label className="grid gap-2"><span className="text-xs uppercase tracking-wider text-zinc-500">Images</span>
                      <select value={count} onChange={e => setCount(Number(e.target.value))} className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none">{[1,2,4,8].map(n=><option key={n} value={n}>{n}</option>)}</select>
                    </label>
                  </div>
                  <button onClick={generate} disabled={loading || !persona} className="group flex items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-medium text-white shadow-glow disabled:opacity-60">
                    {loading ? "Generating…" : "Generate images"} <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-panel p-6">
                <div className="flex items-center justify-between"><div className="text-sm text-zinc-400">Current persona</div><span className="rounded-full bg-violet/10 px-3 py-1 text-xs text-violet">Identity profile</span></div>
                {persona ? <><div className="mt-5 rounded-2xl border border-line bg-black/20 p-5">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet/30 to-fuchsia/10">
                    {persona.referenceImageUrl ? <div className="h-full w-full bg-white/5" /> : <Sparkles size={28} className="text-violet" />}
                  </div>
                  <div className="mt-4 text-lg font-semibold">{persona.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">{persona.description}</div>
                  <p className="mt-4 text-sm leading-6 text-zinc-500">{persona.visualProfile}</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Images" value="—" /><Metric label="Videos" value="—" /><Metric label="Jobs" value="—" /></div></> : <div className="mt-5 text-sm text-zinc-500">Create a persona to start.</div>}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-line bg-panel p-6">
              <div className="flex items-center justify-between"><div><div className="text-sm text-zinc-400">Latest outputs</div><div className="mt-1 text-lg font-semibold">Your generated content</div></div><button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ImagePlus size={16}/> Gallery</button></div>
              {images.length ? <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{images.map((src,i)=><img key={i} src={src} alt={`${persona?.name ?? "Persona"} generated ${i+1}`} className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-white/5" />)}</div>
              : <div className="mt-5 flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-line bg-black/10 text-center"><div><Sparkles className="mx-auto text-zinc-600" size={28}/><div className="mt-3 text-sm text-zinc-500">Generate a batch to see your content here.</div></div></div>}
            </div>
          </div>
        </section>
      </div>
      {personaModal && <PersonaModal onClose={() => setPersonaModal(false)} onCreated={addPersona} />}
    </main>
  );
}

function PersonaModal({ onClose, onCreated }: { onClose:()=>void; onCreated:(p:Persona)=>void }) {
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [visualProfile,setVisualProfile]=useState("");
  const [reference,setReference]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const form = new FormData();
    form.set("name",name); form.set("description",description); form.set("visualProfile",visualProfile);
    if (reference) form.set("reference",reference);
    try {
      const res=await fetch("/api/personas",{method:"POST",body:form});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error || "Could not create persona");
      const p=data.persona;
      onCreated({id:p.id,name:p.name,description:p.description,visualProfile:p.visual_profile,referenceImageUrl:p.reference_image_path,createdAt:p.created_at});
    } catch(e) { setError(e instanceof Error ? e.message : "Could not create persona"); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-line bg-panel p-6 shadow-2xl">
      <div className="flex items-start justify-between"><div><div className="text-xs uppercase tracking-[0.25em] text-violet">Identity</div><h2 className="mt-2 text-xl font-semibold">Create persona</h2></div><button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">✕</button></div>
      <div className="mt-6 grid gap-4">
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Persona name" className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none"/>
        <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description, e.g. luxury fashion creator" className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none"/>
        <textarea required value={visualProfile} onChange={e=>setVisualProfile(e.target.value)} rows={4} placeholder="Visual identity: age, hair, eyes, body type, style, photography look…" className="resize-none rounded-xl border border-line bg-black/30 px-4 py-3 outline-none"/>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-black/20 px-4 py-4 text-sm text-zinc-400 hover:text-white"><Upload size={17}/><span>{reference ? reference.name : "Optional reference image (max 8MB)"}</span><input type="file" accept="image/*" onChange={e=>setReference(e.target.files?.[0] ?? null)} className="hidden"/></label>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
        <button disabled={busy} className="rounded-xl bg-violet px-4 py-3 font-medium disabled:opacity-60">{busy ? "Creating…" : "Create persona"}</button>
      </div>
    </form>
  </div>;
}

function Metric({label,value}:{label:string;value:string}) {
  return <div className="rounded-2xl border border-line bg-black/15 p-4"><div className="text-xs text-zinc-600">{label}</div><div className="mt-2 text-lg">{value}</div></div>;
}
