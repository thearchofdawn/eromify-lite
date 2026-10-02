import { NextResponse } from "next/server";
import { getGenerationStatus } from "@/src/lib/providers";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  try {
    const result = await getGenerationStatus(jobId);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = await createClient();
      const { data: claims } = await supabase.auth.getClaims();
      const userId = claims?.claims?.sub;

      if (userId) {
        const { data: job } = await supabase
          .from("generation_jobs")
          .select("id, persona_id")
          .eq("provider_job_id", jobId)
          .eq("user_id", userId)
          .single();

        if (job) {
          await supabase.from("generation_jobs")
            .update({
              status: result.status,
              error: result.status === "failed" ? "ComfyUI generation failed" : null,
              completed_at: result.status === "completed" ? new Date().toISOString() : null
            })
            .eq("id", job.id)
            .eq("user_id", userId);

          if (result.status === "completed" && result.outputs.length) {
            const { data: existing } = await supabase
              .from("assets")
              .select("external_url")
              .eq("job_id", job.id)
              .eq("user_id", userId);

            const existingUrls = new Set((existing ?? []).map((item: any) => item.external_url).filter(Boolean));
            const newAssets = result.outputs
              .filter(url => !existingUrls.has(url))
              .map(url => ({
                user_id: userId,
                persona_id: job.persona_id,
                job_id: job.id,
                asset_type: "image",
                external_url: url
              }));

            if (newAssets.length) await supabase.from("assets").insert(newAssets);
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to read generation status"
    }, { status: 500 });
  }
}
