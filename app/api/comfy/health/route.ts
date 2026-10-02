import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const base = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
  try {
    const response = await fetch(base + "/system_stats", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ ok: false, error: "ComfyUI returned HTTP " + response.status, base }, { status: 502 });
    return NextResponse.json({ ok: true, base, system: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach ComfyUI. Start ComfyUI and verify COMFYUI_BASE_URL.", base }, { status: 503 });
  }
}
