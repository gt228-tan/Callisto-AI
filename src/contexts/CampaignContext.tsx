import React, { createContext, useContext, useState, useEffect } from 'react'
import { campaigns as initialCampaigns, type Campaign } from '@/data/campaigns'
import { useAudit } from './AuditContext'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'callisto_ai_campaigns'

function parseCampaign(c: any): Campaign {
  return {
    ...c,
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : null,
    completedAt: c.completedAt ? new Date(c.completedAt) : null,
  }
}

function loadInitialCampaigns(): Campaign[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(parseCampaign)
      }
    }
  } catch (err) {
    console.error('Failed to load campaigns from localStorage:', err)
  }
  return initialCampaigns.map(parseCampaign)
}

interface CampaignContextValue {
  campaignList: Campaign[]
  addCampaign: (campaign: Partial<Campaign> & { name: string }) => Campaign
  togglePause: (id: string) => void
  deleteCampaign: (id: string) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  resetCampaigns: () => void
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaignList, setCampaignList] = useState<Campaign[]>(loadInitialCampaigns)
  const { logAction } = useAudit()
  const { user } = useAuth()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaignList))
    } catch (err) {
      console.error('Failed to save campaigns to localStorage:', err)
    }
  }, [campaignList])

  function addCampaign(data: Partial<Campaign> & { name: string }): Campaign {
    const newCamp: Campaign = {
      id: `C00${campaignList.length + 1}`,
      name: data.name || 'New AI Campaign',
      target: data.target || 'Selected Leads',
      agent: data.agent || `${data.voice || 'Professional Female'} Agent`,
      status: data.status || 'ACTIVE',
      language: data.language || 'English',
      voice: data.voice || 'Professional Female',
      tone: data.tone || 'Consultative',
      leads: data.leadIds && data.leadIds.length > 0 ? data.leadIds.length : (data.leads ?? Math.floor(Math.random() * 100) + 20),
      calls: data.calls ?? 0,
      answered: data.answered ?? 0,
      qualified: data.qualified ?? 0,
      meetings: data.meetings ?? 0,
      conversion: data.conversion ?? 0,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      objective: data.objective || '',
      greeting: data.greeting || '',
      maxRetries: data.maxRetries ?? 3,
      retryInterval: data.retryInterval || '24 hours',
      type: data.type || 'AI_DISCOVERY_CALLING',
      leadIds: data.leadIds || [],
      sourceType: data.sourceType || 'AI_DISCOVERED',
    }

    setCampaignList(prev => [newCamp, ...prev])

    logAction({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CAMPAIGN_CREATE_WRITE',
      resource: `Campaign: ${newCamp.name}`,
      status: 'SUCCESS',
      details: `Created campaign ${newCamp.id} with ${newCamp.leads} target prospects (Voice: ${newCamp.voice}, Language: ${newCamp.language}).`,
    }).catch(() => {})

    return newCamp
  }

  function togglePause(id: string) {
    let nextStatus = 'PAUSED'
    setCampaignList(prev =>
      prev.map(c => {
        if (c.id === id) {
          nextStatus = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
          return { ...c, status: nextStatus as any }
        }
        return c
      })
    )

    logAction({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CAMPAIGN_STATUS_TOGGLE',
      resource: `Campaign: ${id}`,
      status: 'SUCCESS',
      details: `Campaign status changed to ${nextStatus}.`,
    }).catch(() => {})
  }

  function deleteCampaign(id: string) {
    setCampaignList(prev => prev.filter(c => c.id !== id))

    logAction({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CAMPAIGN_DELETE_WRITE',
      resource: `Campaign: ${id}`,
      status: 'SUCCESS',
      details: `Campaign deleted by user.`,
    }).catch(() => {})
  }

  function updateCampaign(id: string, updates: Partial<Campaign>) {
    setCampaignList(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  function resetCampaigns() {
    setCampaignList(initialCampaigns.map(parseCampaign))
  }

  return (
    <CampaignContext.Provider
      value={{
        campaignList,
        addCampaign,
        togglePause,
        deleteCampaign,
        updateCampaign,
        resetCampaigns,
      }}
    >
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaigns() {
  const ctx = useContext(CampaignContext)
  if (!ctx) {
    throw new Error('useCampaigns must be used within a CampaignProvider')
  }
  return ctx
}
