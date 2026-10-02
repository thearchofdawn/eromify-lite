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
        await supabase.from("generation_jobs")
          .update({ status: result.status, completed_at: result.status === "completed" ? new Date().toISOString() : null })
          .eq("provider_job_id", jobId)
          .eq("user_id", userId);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read generation status" }, { status: 500 });
  }
}
