import type { GenerateInput, GenerateResult } from "../types";

const MODEL = process.env.HIGGSFIELD_IMAGE_MODEL || "nano_banana_2";

export const higgsfieldProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    throw new Error(
      "Higgsfield provider requires a server-side integration. Use Higgsfield's API/SDK credentials in your deployment and implement the provider adapter there."
    );
  }
};
