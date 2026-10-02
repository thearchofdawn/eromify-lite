# Eromify Lite

Self-hostable AI creator studio for consistent AI personas, image generation and later image-to-video workflows.

## Current stage
- Next.js App Router + TypeScript + Tailwind
- Persona-aware prompt enrichment
- Demo provider
- Real ComfyUI prompt submission
- ComfyUI job status endpoint
- Configurable ComfyUI API workflow
- Aspect-ratio and batch-size patching

## Connect your RTX 3060
Install ComfyUI on the NVIDIA machine and make it reachable at http://127.0.0.1:8188.

In ComfyUI, build/import the image workflow and choose **File → Export Workflow (API)**. The API format is the format ComfyUI expects for programmatic submission.

Prefer saving the exported JSON to a local file and setting:

`COMFYUI_WORKFLOW_PATH=C:\\ComfyUI\\workflows\\eromify-api.json`

This avoids pasting a large JSON document into `.env.local`.

Set the important node IDs from your exported workflow:

```env
COMFYUI_POSITIVE_NODE_ID=6
COMFYUI_NEGATIVE_NODE_ID=7
COMFYUI_LATENT_NODE_ID=5
COMFYUI_SEED_NODE_ID=3
COMFYUI_REFERENCE_NODE_ID=40
COMFYUI_OUTPUT_NODE_ID=9
```

These numbers are examples only; use the IDs from your own workflow.

For reference-image workflows, set COMFYUI_INPUT_DIR to the ComfyUI input folder and COMFYUI_REFERENCE_NODE_ID to the LoadImage node ID from the API workflow. Eromify Lite will stage the selected persona reference into that folder before submitting the job.

The exact FLUX/identity workflow depends on the nodes/checkpoints installed. A generic LoadImage node is not by itself an identity-preservation system. For consistent personas, use a workflow specifically designed for reference/identity conditioning. Verify every model and custom-node license before commercial use.

Before generating, check `http://localhost:3000/api/comfy/health`. A successful response contains `"ok": true`.

## Development
npm install
npm run dev

Demo mode is enabled by default. Set NEXT_PUBLIC_DEMO_MODE=false after ComfyUI is configured.

## Next milestones
1. Supabase Auth + persona persistence
2. Supabase Storage + gallery
3. Reliable ComfyUI output resolution
4. Reference-image identity workflow
5. Image-to-video worker
6. Workflow canvas
7. MCP server
