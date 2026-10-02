import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ personas: [] });
  const { data, error } = await supabase.from("personas").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ personas: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const visualProfile = String(form.get("visualProfile") || "").trim();
  const file = form.get("reference") as File | null;
  if (!name) return NextResponse.json({ error: "Persona name is required" }, { status: 400 });

  let referenceImagePath: string | null = null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Reference must be an image" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Reference image must be under 8MB" }, { status: 400 });
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    referenceImagePath = userId + "/" + crypto.randomUUID() + "." + ext;
    const upload = await supabase.storage.from("references").upload(referenceImagePath, file, { contentType: file.type, upsert: false });
    if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const { data, error } = await supabase.from("personas").insert({
    user_id: userId, name, description, visual_profile: visualProfile, reference_image_path: referenceImagePath
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ persona: data }, { status: 201 });
}
