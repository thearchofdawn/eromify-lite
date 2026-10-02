import type { GenerateInput, GenerateResult } from "../types";

type ComfyPromptResponse = { prompt_id?: string; error?: string };
type ApiWorkflow = Record<string, { class_type: string; inputs: Record<string, unknown> }>;

function loadWorkflow(): ApiWorkflow {
  const raw = process.env.COMFYUI_WORKFLOW_JSON;
  if (!raw) throw new Error("COMFYUI_WORKFLOW_JSON is missing. Export your ComfyUI workflow in API format.");
  try { return JSON.parse(raw) as ApiWorkflow; }
  catch { throw new Error("COMFYUI_WORKFLOW_JSON is not valid JSON."); }
}

function patchWorkflow(workflow: ApiWorkflow, input: GenerateInput): ApiWorkflow {
  const cloned = JSON.parse(JSON.stringify(workflow)) as ApiWorkflow;
  const encoders = Object.values(cloned).filter(n =>
    ["CLIPTextEncode","CLIPTextEncodeSDXL","CLIPTextEncodeFlux"].includes(n.class_type)
  );
  if (encoders[0]) encoders[0].inputs.text = input.prompt;
  if (encoders[1]) encoders[1].inputs.text = "high quality, photorealistic, " + input.prompt;

  const size = ({ "1:1":[768,768], "4:5":[768,960], "9:16":[768,1344], "16:9":[1024,576] } as Record<string, number[]>)[input.aspectRatio];
  const latent = Object.values(cloned).find(n =>
    ["EmptyLatentImage","EmptySD3LatentImage","EmptyLatentHires"].includes(n.class_type)
  );
  if (latent && size) {
    latent.inputs.width = size[0];
    latent.inputs.height = size[1];
    latent.inputs.batch_size = input.count;
  }
  return cloned;
}

export const comfyProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const base = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
    const workflow = patchWorkflow(loadWorkflow(), input);
    const res = await fetch(base + "/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: workflow, client_id: "eromify-lite" })
    });
    const body = await res.json().catch(() => ({})) as ComfyPromptResponse;
    if (!res.ok || !body.prompt_id) throw new Error(body.error || ("ComfyUI prompt failed: " + res.status));
    return { jobId: body.prompt_id, provider: "comfyui", status: "queued", outputs: [] };
  },
  async status(jobId: string) {
    const base = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
    const res = await fetch(base + "/history/" + encodeURIComponent(jobId), { cache: "no-store" });
    if (!res.ok) throw new Error("ComfyUI history failed: " + res.status);
    return res.json();
  }
};
