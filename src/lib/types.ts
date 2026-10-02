export type Persona = {
  id: string;
  name: string;
  description: string;
  visualProfile: string;
  referenceImageUrl?: string;
};

export type GenerateInput = {
  personaId: string;
  prompt: string;
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  count: number;
};

export type GenerateResult = {
  jobId: string;
  provider: string;
  status: "queued" | "running" | "completed" | "failed";
  outputs: string[];
};
