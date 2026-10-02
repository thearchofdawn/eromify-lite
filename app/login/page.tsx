"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Account created. Check your email if confirmation is enabled.");
    else window.location.href = "/";
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-panel p-7">
        <div className="text-xs uppercase tracking-[0.3em] text-violet">Eromify Lite</div>
        <h1 className="mt-3 text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your studio account"}</h1>
        <p className="mt-2 text-sm text-zinc-500">Your personas and generations stay attached to your account.</p>
        <div className="mt-7 grid gap-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="Email" className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="rounded-xl border border-line bg-black/30 px-4 py-3 outline-none" />
          {message && <div className="rounded-xl border border-line bg-white/5 p-3 text-sm text-zinc-300">{message}</div>}
          <button disabled={busy} className="rounded-xl bg-violet px-4 py-3 font-medium disabled:opacity-60">{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </div>
        <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("")}} className="mt-5 text-sm text-zinc-500 hover:text-white">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
