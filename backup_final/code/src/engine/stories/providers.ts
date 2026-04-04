// ============================================
// PROVIDER DE IA ABSTRATO
// ============================================

import { IAProvider, GenerateOptions } from './types';

/**
 * Interface abstrata para provedores de IA
 * Permite trocar facilmente entre OpenAI, Anthropic, Google, etc.
 */
export abstract class BaseIAProvider implements IAProvider {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string = '') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract generate(prompt: string, options?: GenerateOptions): Promise<string>;
  
  abstract getName(): string;

  protected async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  }
}

// ============================================
// OPENAI PROVIDER
// ============================================

export class OpenAIProvider extends BaseIAProvider {
  private model: string = 'gpt-4o';

  constructor(apiKey: string) {
    super(apiKey, 'https://api.openai.com/v1');
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.8,
          max_tokens: options?.maxTokens ?? 2000
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  getName(): string {
    return 'OpenAI';
  }

  setModel(model: string): void {
    this.model = model;
  }
}

// ============================================
// ANTHROPIC PROVIDER (Claude)
// ============================================

export class AnthropicProvider extends BaseIAProvider {
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    super(apiKey, 'https://api.anthropic.com/v1');
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.8,
          max_tokens: options?.maxTokens ?? 2000
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API Error: ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  getName(): string {
    return 'Anthropic Claude';
  }

  setModel(model: string): void {
    this.model = model;
  }
}

// ============================================
// GOOGLE GEMINI PROVIDER
// ============================================

export class GoogleProvider extends BaseIAProvider {
  private model: string = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    super(apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/models/${options?.model || this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.8,
            maxOutputTokens: options?.maxTokens ?? 2000
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API Error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  getName(): string {
    return 'Google Gemini';
  }

  setModel(model: string): void {
    this.model = model;
  }
}

// ============================================
// FACTORY DE PROVIDERS
// ============================================

export type ProviderType = 'openai' | 'anthropic' | 'google';

export function createIAProvider(type: ProviderType, apiKey: string): IAProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
    default:
      throw new Error(`Provider desconhecido: ${type}`);
  }
}
