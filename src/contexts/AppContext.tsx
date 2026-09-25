import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { type Language, getLanguage, setLanguage as setLibLanguage, translate } from '@/lib/i18n'

export interface BusinessProduct {
  id: string
  name: string
  category: string
  description: string
  targetPrice: string
  valueProp: string
}

export interface BusinessPersona {
  title: string
  department: string
  painPoints: string[]
  budgetInfluence: 'High' | 'Final Sign-off' | 'Influencer'
}

export interface BusinessProfile {
  companyUrl: string
  companyName: string
  industry: string
  businessDesc: string
  products: BusinessProduct[]
  personas: BusinessPersona[]
  discoveryQueries: string[]
  updatedAt: string
}

const defaultBusinessProfile: BusinessProfile = {
  companyUrl: 'https://callistoai.com',
  companyName: 'Callisto AI Solutions',
  industry: 'Enterprise B2B Software & AI',
  businessDesc: 'Callisto AI provides autonomous conversational AI voice agents and predictive buyer intent intelligence for enterprise revenue teams, enabling automated multilingual qualification and CRM pipeline conversion.',
  products: [
    {
      id: 'p1',
      name: 'Autonomous AI Voice SDR',
      category: 'Conversational Voice AI',
      description: 'Human-like multilingual voice agent that dials prospects, handles live technical FAQs, drops voicemails, and schedules calendar demos.',
      targetPrice: '$1,200 / month + voice usage',
      valueProp: '10x SDR outreach throughput with zero latency and 31% qualification rate',
    },
    {
      id: 'p2',
      name: 'Public Intent Lead Discovery',
      category: 'Lead Intelligence & OSINT',
      description: 'Real-time monitoring of public buyer requirement posts on LinkedIn, X, public directories, and RFPs with verified provenance.',
      targetPrice: '$800 / month',
      valueProp: 'Catch active buyers with urgent projects before competitors reach them',
    },
    {
      id: 'p3',
      name: 'BANT Predictive Lead Qualifier',
      category: 'Revenue Analytics',
      description: 'AI scoring engine that validates budget, authority, urgency, and need clarity before human AE handover.',
      targetPrice: '$500 / month',
      valueProp: 'Eliminate 85% of unqualified sales meetings for account executives',
    },
  ],
  personas: [
    {
      title: 'VP / Head of Inside Sales',
      department: 'Revenue & Sales Operations',
      painPoints: ['Slow outbound dial rates', 'High SDR turnover', 'Inconsistent qualification quality'],
      budgetInfluence: 'Final Sign-off',
    },
    {
      title: 'Chief Technology Officer (CTO)',
      department: 'Engineering & Technology',
      painPoints: ['Complex telephony integration', 'Data privacy & encryption compliance', 'API latency'],
      budgetInfluence: 'High',
    },
    {
      title: 'Director of Demand Generation',
      department: 'Growth & Marketing',
      painPoints: ['Low conversion from inbound leads', 'Lack of source transparency', 'Delayed follow-ups'],
      budgetInfluence: 'Influencer',
    },
  ],
  discoveryQueries: [
    '"looking for sales automation" OR "need voice ai agent"',
    '"evaluating conversational ai SDR" site:linkedin.com',
    '"RFPs for outbound calling platform" OR "telephony integration"',
    '"seeking B2B lead generation" Bangalore OR "San Francisco"',
    'site:reddit.com/r/sales "alternative to twilio" OR "outbound sdr"',
  ],
  updatedAt: new Date().toISOString(),
}

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
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  businessProfile: BusinessProfile
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(getLanguage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'android' | 'ios'>('desktop')
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('callisto_theme')
      if (saved === 'light' || saved === 'dark') return saved
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    }
    try {
      localStorage.setItem('callisto_theme', theme)
    } catch {}
  }, [theme])

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const [businessProfile, setBusinessProfileState] = useState<BusinessProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('callisto_business_profile')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        // fallback
      }
    }
    return defaultBusinessProfile
  })

  const updateBusinessProfile = useCallback((patch: Partial<BusinessProfile>) => {
    setBusinessProfileState(prev => {
      const updated = { ...prev, ...patch, updatedAt: new Date().toISOString() }
      if (typeof window !== 'undefined') {
        localStorage.setItem('callisto_business_profile', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

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
      theme, setTheme, toggleTheme,
      businessProfile, updateBusinessProfile,
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

