"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, RefreshCw } from "lucide-react";

type Asset = { id:string; asset_type:string; external_url:string|null; storage_path:string|null; created_at:string };

export default function GalleryPage() {
  const [assets,setAssets]=useState<Asset[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res=await fetch("/api/gallery",{cache:"no-store"});
      const data=await res.json();
      if(res.status===401){window.location.href="/login";return;}
      if(!res.ok) throw new Error(data.error||"Unable to load gallery");
      setAssets(data.assets||[]);
    } catch(e){setError(e instanceof Error?e.message:"Unable to load gallery");}
    finally{setLoading(false);}
  }

  useEffect(()=>{load()},[]);

  return <main className="min-h-screen bg-ink p-5 md:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft size={16}/> Studio</Link>
          <h1 className="mt-5 text-3xl font-semibold">Gallery</h1>
          <p className="mt-2 text-sm text-zinc-500">Generated images saved from your creator jobs.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={15}/> Refresh</button>
      </div>
      {error && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
      {loading ? <div className="mt-8 text-sm text-zinc-500">Loading gallery…</div>
      : assets.length ? <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {assets.map(asset => <div key={asset.id} className="overflow-hidden rounded-2xl border border-line bg-panel">
          {asset.external_url ? <img src={asset.external_url} alt="Generated asset" className="aspect-[4/5] w-full object-cover"/> : <div className="flex aspect-[4/5] items-center justify-center"><ImageIcon className="text-zinc-600"/></div>}
          <div className="p-3 text-xs text-zinc-600">{new Date(asset.created_at).toLocaleString()}</div>
        </div>)}
      </div>
      : <div className="mt-8 rounded-3xl border border-dashed border-line p-16 text-center text-sm text-zinc-500">No generated assets yet. Create a persona and generate your first batch.</div>}
    </div>
  </main>;
}
