import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const { data: persona } = await supabase.from("personas").select("reference_image_path").eq("id", id).eq("user_id", userId).single();
  if (!persona) return NextResponse.json({ error: "Persona not found" }, { status: 404 });

  if (persona.reference_image_path) {
    await supabase.storage.from("references").remove([persona.reference_image_path]);
  }

  const { error } = await supabase.from("personas").delete().eq("id", id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
