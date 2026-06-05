import { DEFAULT_SYSTEM_PROMPT } from "../constants/systemPrompt";
import { DEFAULT_MODEL } from "./agent";

/** The agent configuration the user can edit, held in a single form. */
export interface ConfigValues {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export const DEFAULT_CONFIG: ConfigValues = {
  apiKey: "",
  model: DEFAULT_MODEL,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};
