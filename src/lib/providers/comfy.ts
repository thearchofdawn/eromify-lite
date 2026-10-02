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

  const referenceNodeId = process.env.COMFYUI_REFERENCE_NODE_ID;
  if (referenceNodeId && input.referenceImageName && cloned[referenceNodeId]) {
    cloned[referenceNodeId].inputs.image = input.referenceImageName;
  }

  const sizes: Record<string, number[]> = {"1:1":[768,768],"4:5":[768,960],"9:16":[768,1344],"16:9":[1024,576]};
  const size = sizes[input.aspectRatio];
  const latent = Object.values(cloned).find(n =>
    ["EmptyLatentImage","EmptySD3LatentImage","EmptyLatentHires"].includes(n.class_type)
  );
  if (latent) {
    latent.inputs.width = size[0];
    latent.inputs.height = size[1];
    latent.inputs.batch_size = input.count;
  }
  return cloned;
}

function outputUrls(history: any): string[] {
  const outputs: string[] = [];
  for (const node of Object.values(history?.outputs ?? {}) as any[]) {
    for (const image of node?.images ?? []) {
      const base = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
      const params = new URLSearchParams({
        filename: String(image.filename),
        subfolder: String(image.subfolder || ""),
        type: String(image.type || "output")
      });
      outputs.push(base + "/view?" + params.toString());
    }
  }
  return [...new Set(outputs)];
}

export const comfyProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const base = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
    const res = await fetch(base + "/prompt", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({prompt: patchWorkflow(loadWorkflow(), input), client_id:"eromify-lite"})
    });
    const body = await res.json().catch(() => ({})) as ComfyPromptResponse;
    if (!res.ok || !body.prompt_id) throw new Error(body.error || ("ComfyUI prompt failed: " + res.status));
    return {jobId:body.prompt_id, provider:"comfyui", status:"queued", outputs:[]};
  },

  async status(jobId:string): Promise<GenerateResult> {
    const base=(process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/,"");
    const res=await fetch(base+"/history/"+encodeURIComponent(jobId),{cache:"no-store"});
    if(!res.ok) throw new Error("ComfyUI history failed: "+res.status);
    const data=await res.json();
    const history=data?.[jobId];
    if(!history) return {jobId,provider:"comfyui",status:"running",outputs:[]};
    const failed = Array.isArray(history?.status?.messages) && history.status.messages.some((m:any[]) => String(m?.[0]).toLowerCase().includes("error"));
    return {
      jobId,
      provider:"comfyui",
      status: failed ? "failed" : history.status?.completed ? "completed" : "running",
      outputs: outputUrls(history)
    };
  }
};
