import { NextResponse } from "next/server";
import { getGenerationStatus } from "@/src/lib/providers";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({error:"jobId is required"},{status:400});
  try { return NextResponse.json(await getGenerationStatus(jobId)); }
  catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Unable to read generation status"},{status:500}); }
}
