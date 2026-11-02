// Catálogo de proveedores. Es la única lista que importa el cliente y el
// servidor: el Worker solo habla con los proveedores declarados aquí, así que
// este archivo es también la lista blanca de destinos.
//
// Los modelos listados son valores por defecto razonables. En Ajustes → Claves
// el usuario puede pedir la lista real a cada proveedor (GET /api/models) y
// elegir cualquier modelo que su clave permita.

export type ProviderKind = 'openai' | 'anthropic' | 'gemini'

export interface Provider {
  id: string
  name: string
  kind: ProviderKind
  /** Base de la API, sin barra final. */
  baseUrl: string
  /** Variable de entorno que puede aportar la clave en el servidor. */
  keyEnv: string
  /** Dónde crear la clave. */
  keyUrl: string
  /** Modelos sugeridos (fallback si no se consulta la lista real). */
  models: readonly string[]
  /** Color de marca para la interfaz. */
  color: string
}

export const PROVIDERS: readonly Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini'],
    color: '#10a37f',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    keyEnv: 'ANTHROPIC_API_KEY',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    models: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-opus-4-1'],
    color: '#d97757',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyEnv: 'GEMINI_API_KEY',
    keyUrl: 'https://aistudio.google.com/apikey',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
    color: '#4285f4',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    keyUrl: 'https://openrouter.ai/keys',
    models: [
      'openai/gpt-4o-mini',
      'anthropic/claude-sonnet-4.5',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    color: '#9aa0ff',
  },
  {
    id: 'groq',
    name: 'Groq',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    keyUrl: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'],
    color: '#f55036',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    kind: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    keyEnv: 'MISTRAL_API_KEY',
    keyUrl: 'https://console.mistral.ai/api-keys',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    color: '#ff9d2e',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    keyEnv: 'DEEPSEEK_API_KEY',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    color: '#4d6bfe',
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    kind: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    keyEnv: 'XAI_API_KEY',
    keyUrl: 'https://console.x.ai',
    models: ['grok-4', 'grok-3-mini'],
    color: '#c9cdd6',
  },
]

export const DEFAULT_PROVIDER = PROVIDERS[0] as Provider

export function providerById(id: string): Provider | undefined {
  return PROVIDERS.find((provider) => provider.id === id)
}

/** Etiqueta corta: «OpenAI · gpt-4o-mini». */
export function targetLabel(providerId: string, model: string): string {
  const provider = providerById(providerId)
  return provider ? `${provider.name} · ${model}` : model
}

/** Nombre de modelo sin el prefijo del proveedor, para columnas estrechas. */
export function shortModelId(model: string): string {
  const slash = model.lastIndexOf('/')
  return slash === -1 ? model : model.slice(slash + 1)
}
