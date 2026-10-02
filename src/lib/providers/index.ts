import type { GenerateInput, GenerateResult } from "../types";
import { demoProvider } from "./demo";
import { comfyProvider } from "./comfy";
import { geminiProvider } from "./gemini";

function providerName() {
  return (process.env.IMAGE_PROVIDER || "gemini").toLowerCase();
}

export async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return demoProvider.generate(input);
  if (providerName() === "gemini") return geminiProvider.generate(input);
  return comfyProvider.generate(input);
}

export async function getGenerationStatus(jobId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return { status: "completed", outputs: [] };
  if (providerName() === "gemini") return { status: "completed", outputs: [] };
  return comfyProvider.status(jobId);
}
