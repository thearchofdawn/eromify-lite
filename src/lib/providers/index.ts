import type { GenerateInput, GenerateResult } from "../types";
import { demoProvider } from "./demo";
import { comfyProvider } from "./comfy";

export async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return demoProvider.generate(input);
  return comfyProvider.generate(input);
}
