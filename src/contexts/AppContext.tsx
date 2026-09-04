import React, { createContext, useContext, useState } from 'react'
import type { Language } from '@/lib/i18n'

interface AppContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  globalSearchOpen: boolean
  setGlobalSearchOpen: (v: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)

  return (
    <AppContext.Provider value={{ language, setLanguage, sidebarCollapsed, setSidebarCollapsed, globalSearchOpen, setGlobalSearchOpen }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
