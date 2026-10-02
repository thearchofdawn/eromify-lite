import type { GenerateInput, GenerateResult } from "../types";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

async function generateOne(input: GenerateInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const parts: any[] = [{ type: "text", text: input.prompt }];
  if (input.referenceImageUrl) {
    const image = await fetch(input.referenceImageUrl);
    if (!image.ok) throw new Error("Unable to load reference image");
    parts.unshift({
      type: "image",
      mime_type: image.headers.get("content-type") || "image/jpeg",
      data: Buffer.from(await image.arrayBuffer()).toString("base64")
    });
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: MODEL,
      input: parts,
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: input.aspectRatio,
        image_size: process.env.GEMINI_IMAGE_SIZE || "1K"
      }
    })
  });
  const json: any = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || "Gemini image generation failed");

  if (json?.output_image?.data) return json.output_image;
  for (const step of json?.steps || []) {
    for (const block of step?.content || []) {
      if (block?.type === "image" && block?.data) return block;
    }
  }
  throw new Error("Gemini returned no image");
}

export const geminiProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const images = await Promise.all(Array.from({ length: input.count }, () => generateOne(input)));
    return {
      jobId: crypto.randomUUID(),
      provider: "gemini",
      status: "completed",
      outputs: images.map((image: any) =>
        `data:${image.mime_type || "image/jpeg"};base64,${image.data}`
      )
    };
  }
};
