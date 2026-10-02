import type { GenerateInput, GenerateResult } from "../types";

type ComfyHistory = Record<string, {
  outputs?: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
}>;

export const comfyProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const base = process.env.COMFYUI_BASE_URL;
    if (!base) throw new Error("COMFYUI_BASE_URL is not configured.");

    // This adapter intentionally keeps workflow submission provider-agnostic.
    // The concrete JSON workflow can be swapped without changing the UI/API.
    const workflow = {
      "6": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["30", 0] }
      }
    };

    const res = await fetch(`${base}/prompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: workflow })
    });
    if (!res.ok) throw new Error(`ComfyUI prompt failed: ${res.status}`);

    const body = await res.json() as { prompt_id?: string };
    if (!body.prompt_id) throw new Error("ComfyUI did not return a prompt id.");

    return {
      jobId: body.prompt_id,
      provider: "comfyui",
      status: "queued",
      outputs: []
    };
  }
};
