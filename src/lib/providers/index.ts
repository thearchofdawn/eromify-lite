import type { GenerateInput, GenerateResult } from "../types";
import { demoProvider } from "./demo";
import { comfyProvider } from "./comfy";

export async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return demoProvider.generate(input);
  return comfyProvider.generate(input);
}
export async function getGenerationStatus(jobId:string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return {status:"completed",outputs:[]};
  return comfyProvider.status(jobId);
}
