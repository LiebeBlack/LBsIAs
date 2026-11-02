/** Entorno compartido por el Worker de Cloudflare y el servidor Bun local. */
export interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> }
  PORT?: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GEMINI_API_KEY?: string
  OPENROUTER_API_KEY?: string
  GROQ_API_KEY?: string
  MISTRAL_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  XAI_API_KEY?: string
  [key: string]: unknown
}
