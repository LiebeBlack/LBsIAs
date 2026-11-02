import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  defaultSystemPrompt,
  detectLocale,
  formatAgo,
  formatDateTime,
  formatNumber,
  isLocale,
  plural,
  translate,
} from '../shared/i18n'
import type { Locale, TranslationKey, TranslationParams } from '../shared/i18n'
import type { LocalePreference } from '../shared/types'

export interface I18n {
  locale: Locale
  t(key: TranslationKey, params?: TranslationParams): string
  p(key: string, count: number): string
  ago(timestamp: number): string
  date(timestamp: number): string
  num(value: number, digits?: number): string
  defaultSystem: string
}

const I18nContext = createContext<I18n | null>(null)

export function resolveLocale(preference: LocalePreference): Locale {
  return isLocale(preference) ? preference : detectLocale()
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      t: (key, params) => translate(locale, key, params),
      p: (key, count) => plural(locale, key, count),
      ago: (timestamp) => formatAgo(locale, timestamp),
      date: (timestamp) => formatDateTime(locale, timestamp),
      num: (amount, digits) => formatNumber(locale, amount, digits),
      defaultSystem: defaultSystemPrompt(locale),
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n debe usarse dentro de I18nProvider')
  return context
}
