import OpenAI from "openai";
import type { AiGenerateTextRequest, AiProviderResolvedConfig, AiUsage } from "./types";

export interface OpenAiCompatibleResult {
  text: string;
  usage?: AiUsage;
}

export class OpenAiCompatibleClient {
  private readonly client: OpenAI;

  constructor(private readonly config: AiProviderResolvedConfig) {
    if (!config.apiKey) {
      throw new Error(`${config.provider} API key is missing.`);
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined
    });
  }

  async generateText(request: AiGenerateTextRequest): Promise<OpenAiCompatibleResult> {
    if (!this.config.model) {
      throw new Error(`${this.config.provider} model is missing.`);
    }

    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      messages: request.messages.map((message) => ({ role: message.role, content: message.content })),
      temperature: request.temperature ?? 0.4,
      max_tokens: request.maxTokens ?? 1200,
      response_format: request.responseFormat === "json_object" ? { type: "json_object" } : undefined
    });

    const content = completion.choices[0]?.message?.content;
    const text = typeof content === "string" ? content.trim() : "";

    if (!text) {
      throw new Error(`${this.config.provider} returned an empty response.`);
    }

    return {
      text,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens
      }
    };
  }
}
