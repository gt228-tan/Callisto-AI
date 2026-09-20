import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { type Language, getLanguage, setLanguage as setLibLanguage, translate } from '@/lib/i18n'

interface AppContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  globalSearchOpen: boolean
  setGlobalSearchOpen: (v: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (v: boolean) => void
  deviceMode: 'desktop' | 'android' | 'ios'
  setDeviceMode: (mode: 'desktop' | 'android' | 'ios') => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(getLanguage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'android' | 'ios'>('desktop')

  const setLanguage = useCallback((lang: Language) => {
    setLibLanguage(lang)
    setLangState(lang)
  }, [])

  const t = useCallback((key: string, fallback?: string) => {
    return translate(language, key, fallback)
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <AppContext.Provider value={{
      language, setLanguage, t,
      sidebarCollapsed, setSidebarCollapsed,
      globalSearchOpen, setGlobalSearchOpen,
      mobileNavOpen, setMobileNavOpen,
      deviceMode, setDeviceMode,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
