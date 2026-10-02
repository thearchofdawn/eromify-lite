import type { GenerateInput, GenerateResult } from "../types";

export const demoProvider = {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    await new Promise((r) => setTimeout(r, 500));
    const count = Math.max(1, Math.min(input.count, 4));
    return {
      jobId: crypto.randomUUID(),
      provider: "demo",
      status: "completed",
      outputs: Array.from({ length: count }, (_, i) =>
        `https://picsum.photos/seed/eromify-${input.personaId}-${i}/768/960`
      )
    };
  }
};
