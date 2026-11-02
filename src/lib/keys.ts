// Selección de proveedor/modelo según las claves disponibles. El cliente nunca
// envía una petición si no hay ninguna credencial: primero reutiliza la clave
// guardada del proveedor elegido y, si falta, la de otro proveedor disponible.

import { PROVIDERS } from '../shared/providers'
import type { ModelChoice } from '../shared/types'

type KeyMap = Record<string, string>

export function hasProviderKey(
  providerId: string,
  keys: KeyMap,
  serverKeys: Record<string, boolean>,
): boolean {
  return Boolean(keys[providerId]?.trim() || serverKeys[providerId])
}

export function availableProviders(keys: KeyMap, serverKeys: Record<string, boolean>): string[] {
  return PROVIDERS.filter((provider) => hasProviderKey(provider.id, keys, serverKeys)).map(
    (provider) => provider.id,
  )
}

/** Mantiene el modelo actual si tiene clave; si no, usa el primer proveedor con clave. */
export function resolveTarget(
  choice: ModelChoice,
  keys: KeyMap,
  serverKeys: Record<string, boolean>,
): { choice: ModelChoice; switched: boolean } {
  if (hasProviderKey(choice.provider, keys, serverKeys)) return { choice, switched: false }

  const provider = PROVIDERS.find((candidate) => hasProviderKey(candidate.id, keys, serverKeys))
  if (!provider) return { choice, switched: false }

  return {
    choice: { provider: provider.id, model: provider.models[0] ?? choice.model },
    switched: true,
  }
}

export interface TargetPlan {
  targets: ModelChoice[]
  switched: ModelChoice | null
  skipped: number
}

/**
 * Elige objetivos ejecutables. En modo comparación omite los modelos sin clave;
 * si no queda ninguno, usa el modelo activo o el primer proveedor con clave.
 */
export function chooseTargets(
  requested: ModelChoice[],
  compare: boolean,
  fallback: ModelChoice,
  keys: KeyMap,
  serverKeys: Record<string, boolean>,
): TargetPlan {
  if (!compare) {
    const resolved = resolveTarget(requested[0] ?? fallback, keys, serverKeys)
    if (!hasProviderKey(resolved.choice.provider, keys, serverKeys)) {
      return { targets: [], switched: null, skipped: 0 }
    }
    return {
      targets: [resolved.choice],
      switched: resolved.switched ? resolved.choice : null,
      skipped: 0,
    }
  }

  const usable = requested.filter((target) => hasProviderKey(target.provider, keys, serverKeys))
  const skipped = requested.length - usable.length
  if (usable.length) return { targets: usable, switched: null, skipped }

  const resolved = resolveTarget(fallback, keys, serverKeys)
  if (!hasProviderKey(resolved.choice.provider, keys, serverKeys)) {
    return { targets: [], switched: null, skipped }
  }
  return {
    targets: [resolved.choice],
    switched: resolved.switched ? resolved.choice : null,
    skipped,
  }
}
