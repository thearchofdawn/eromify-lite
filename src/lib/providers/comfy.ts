import type { GenerateInput, GenerateResult } from "../types";
import fs from "node:fs/promises";

type ComfyPromptResponse = { prompt_id?: string; error?: string };
type ApiWorkflow = Record<string, { class_type: string; inputs: Record<string, unknown> }>;

async function loadWorkflow(): Promise<ApiWorkflow> {
  const path = process.env.COMFYUI_WORKFLOW_PATH?.trim();
  const raw = path
    ? await fs.readFile(path, "utf8").catch(() => {
        throw new Error("Could not read COMFYUI_WORKFLOW_PATH: " + path);
      })
    : process.env.COMFYUI_WORKFLOW_JSON;
  if (!raw) throw new Error("Set COMFYUI_WORKFLOW_PATH (recommended) or COMFYUI_WORKFLOW_JSON.");
  try { return JSON.parse(raw) as ApiWorkflow; }
  catch { throw new Error("The configured ComfyUI workflow is not valid JSON."); }
}

function findNode(workflow: ApiWorkflow, id: string | undefined, classes: string[]) {
  if (id && workflow[id]) return workflow[id];
  return Object.values(workflow).find(n => classes.includes(n.class_type));
}

function patchWorkflow(workflow: ApiWorkflow, input: GenerateInput): ApiWorkflow {
  const cloned = JSON.parse(JSON.stringify(workflow)) as ApiWorkflow;
  const positive = findNode(cloned, process.env.COMFYUI_POSITIVE_NODE_ID, ["CLIPTextEncode","CLIPTextEncodeSDXL","CLIPTextEncodeFlux","CLIPTextEncodeFlux2"]);
  if (!positive) throw new Error("No positive text encoder found. Set COMFYUI_POSITIVE_NODE_ID.");
  positive.inputs.text = input.prompt;

  const negative = findNode(cloned, process.env.COMFYUI_NEGATIVE_NODE_ID, ["CLIPTextEncode","CLIPTextEncodeSDXL","CLIPTextEncodeFlux","CLIPTextEncodeFlux2"]);
  if (negative && negative !== positive) {
    negative.inputs.text = process.env.COMFYUI_NEGATIVE_PROMPT || "low quality, blurry, distorted face, extra fingers, bad anatomy";
  }

  if (input.referenceImageName) {
    const referenceNodeId = process.env.COMFYUI_REFERENCE_NODE_ID;
    if (!referenceNodeId || !cloned[referenceNodeId]) {
      throw new Error("Reference image supplied but COMFYUI_REFERENCE_NODE_ID is not configured.");
    }
    cloned[referenceNodeId].inputs.image = input.referenceImageName;
  }

  const sizes: Record<string, number[]> = {"1:1":[768,768],"4:5":[768,960],"9:16":[768,1344],"16:9":[1024,576]};
  const size = sizes[input.aspectRatio];
  const latent = findNode(cloned, process.env.COMFYUI_LATENT_NODE_ID, ["EmptyLatentImage","EmptySD3LatentImage","EmptyLatentHires"]);
  if (!latent) throw new Error("No latent node found. Set COMFYUI_LATENT_NODE_ID.");
  if (latent) {
    latent.inputs.width = size[0];
    latent.inputs.height = size[1];
    latent.inputs.batch_size = input.count;
  }

  const seedNode = findNode(cloned, process.env.COMFYUI_SEED_NODE_ID, ["KSampler","KSamplerAdvanced"]);
  if (seedNode) {
    const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    if ("seed" in seedNode.inputs) seedNode.inputs.seed = seed;
    if ("noise_seed" in seedNode.inputs) seedNode.inputs.noise_seed = seed;
  }

  const outputNode = findNode(cloned, process.env.COMFYUI_OUTPUT_NODE_ID, ["SaveImage"]);
  if (outputNode && "filename_prefix" in outputNode.inputs) {
    outputNode.inputs.filename_prefix = process.env.COMFYUI_OUTPUT_PREFIX || "EromifyLite";
  }
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
      body: JSON.stringify({prompt: patchWorkflow(await loadWorkflow(), input), client_id:"eromify-lite"})
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
