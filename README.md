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

In ComfyUI, build/import the image workflow and choose Save (API Format). Put that JSON into COMFYUI_WORKFLOW_JSON in .env.local.

For reference-image workflows, set COMFYUI_INPUT_DIR to the ComfyUI input folder and COMFYUI_REFERENCE_NODE_ID to the LoadImage node ID from the API workflow. Eromify Lite will stage the selected persona reference into that folder before submitting the job.

The exact FLUX/identity workflow depends on the nodes/checkpoints installed. Verify every model's license before commercial use.

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
