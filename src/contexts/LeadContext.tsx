import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { leads as defaultLeads, type Lead, type LeadStatus, type IntentLevel } from '@/data/leads'
import type { DuplicateStrategy } from '@/lib/excelLeads'
import { normalizePhoneNumber } from '@/lib/excelLeads'

const STORAGE_KEY = 'callisto_ai_leads_v2'

function parseStoredLead(l: any): Lead {
  return {
    ...l,
    discoveredAt: l.discoveredAt ? new Date(l.discoveredAt) : new Date(),
    enrichedAt: l.enrichedAt ? new Date(l.enrichedAt) : null,
    lastActivity: l.lastActivity ? new Date(l.lastActivity) : new Date(),
  }
}

function loadInitialLeads(): Lead[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(parseStoredLead)
      }
    }
  } catch (err) {
    console.error('Failed to load leads from localStorage:', err)
  }
  return defaultLeads.map(parseStoredLead)
}

interface LeadContextValue {
  leadsList: Lead[]
  addLeads: (
    newLeads: Partial<Lead>[],
    strategy?: DuplicateStrategy,
    updatedLeadMap?: Map<string, Partial<Lead>>
  ) => { added: number; updated: number; skipped: number }
  updateLead: (id: string, updates: Partial<Lead>) => void
  deleteLeads: (ids: string[]) => void
  getLead: (id: string) => Lead | undefined
  resetLeads: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [leadsList, setLeadsList] = useState<Lead[]>(loadInitialLeads)

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsList))
    } catch (err) {
      console.error('Failed to save leads to localStorage:', err)
    }
  }, [leadsList])

  const addLeads = useCallback(
    (
      newLeads: Partial<Lead>[],
      strategy: DuplicateStrategy = 'skip',
      updatedLeadMap?: Map<string, Partial<Lead>>
    ) => {
      let added = 0
      let updated = 0
      let skipped = 0

      setLeadsList(prev => {
        let currentLeads = [...prev]

        // 1. If we have explicit update map (from validation engine)
        if (updatedLeadMap && updatedLeadMap.size > 0) {
          currentLeads = currentLeads.map(lead => {
            if (updatedLeadMap.has(lead.id)) {
              updated++
              return { ...lead, ...updatedLeadMap.get(lead.id), lastActivity: new Date() }
            }
            return lead
          })
        }

        // 2. Process new leads
        const leadsToAppend: Lead[] = []

        newLeads.forEach(rawLead => {
          const normEmail = (rawLead.email || '').toLowerCase().trim()
          const normPhone = normalizePhoneNumber(rawLead.phone || '')

          // Check against existing in current list
          const existingIdx = currentLeads.findIndex(el => {
            const elEmail = (el.email || '').toLowerCase().trim()
            const elPhone = normalizePhoneNumber(el.phone || '')
            return (normEmail && elEmail === normEmail) || (normPhone && elPhone === normPhone)
          })

          if (existingIdx !== -1) {
            if (strategy === 'skip') {
              skipped++
              return
            } else if (strategy === 'update') {
              currentLeads[existingIdx] = {
                ...currentLeads[existingIdx],
                ...rawLead,
                lastActivity: new Date(),
              }
              updated++
              return
            }
            // If strategy is 'keep_both', continue and add as new
          }

          // Build complete lead
          const id = rawLead.id || `LEAD-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          const score = rawLead.intentScore ?? Math.floor(Math.random() * 15) + 82
          const fullLead: Lead = {
            id,
            name: rawLead.name || 'Unnamed Prospect',
            jobTitle: rawLead.jobTitle || 'Executive Contact',
            company: rawLead.company || 'Enterprise Company',
            industry: rawLead.industry || 'Technology & Enterprise',
            location: rawLead.location || 'Global',
            country: rawLead.country || (rawLead.location?.includes('India') ? 'India' : 'USA'),
            primaryLanguage: rawLead.primaryLanguage,
            secondaryLanguages: rawLead.secondaryLanguages,
            requirement: rawLead.requirement || 'Outbound sales outreach inquiry.',
            intentScore: score,
            intent: (rawLead.intent || (score >= 85 ? 'HIGH' : score >= 65 ? 'MEDIUM' : 'LOW')) as IntentLevel,
            source: (rawLead.source || 'CSV / Excel Import') as any,
            sourceUrl: rawLead.sourceUrl || 'Spreadsheet Upload',
            email: rawLead.email || '',
            phone: rawLead.phone || '',
            linkedin: rawLead.linkedin || '',
            website: rawLead.website || '',
            companySize: rawLead.companySize || '50-500 employees',
            employees: rawLead.employees || 200,
            funding: rawLead.funding || 'Series A/B',
            hiringStatus: rawLead.hiringStatus || 'Actively Hiring',
            techStack: rawLead.techStack || ['CRM Connector'],
            competitors: rawLead.competitors || [],
            aiReasoning: rawLead.aiReasoning || 'Imported prospect ready for autonomous AI calling.',
            aiRecommendations: rawLead.aiRecommendations || ['Initiate introductory voice call'],
            status: (rawLead.status || 'NEW') as LeadStatus,
            discoveredAt: rawLead.discoveredAt ? new Date(rawLead.discoveredAt) : new Date(),
            enrichedAt: rawLead.enrichedAt ? new Date(rawLead.enrichedAt) : null,
            lastActivity: new Date(),
            nextAction: rawLead.nextAction || 'Queue in AI Voice Agent',
            budgetSignal: rawLead.budgetSignal || 'HIGH',
            timeline: rawLead.timeline || 'Immediate',
            decisionMaker: rawLead.decisionMaker ?? true,
            needClarity: rawLead.needClarity || 85,
            urgency: rawLead.urgency || 80,
            budgetScore: rawLead.budgetScore || 82,
            authorityScore: rawLead.authorityScore || 85,
            fitScore: rawLead.fitScore || 88,
            campaignId: rawLead.campaignId || null,
            tags: rawLead.tags || ['Direct Upload'],
          }

          leadsToAppend.push(fullLead)
          added++
        })

        return [...leadsToAppend, ...currentLeads]
      })

      return { added, updated, skipped }
    },
    []
  )

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeadsList(prev =>
      prev.map(lead =>
        lead.id === id ? { ...lead, ...updates, lastActivity: new Date() } : lead
      )
    )
  }, [])

  const deleteLeads = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setLeadsList(prev => prev.filter(lead => !idSet.has(lead.id)))
  }, [])

  const getLead = useCallback(
    (id: string) => {
      return leadsList.find(lead => lead.id === id)
    },
    [leadsList]
  )

  const resetLeads = useCallback(() => {
    setLeadsList(defaultLeads.map(parseStoredLead))
  }, [])

  return (
    <LeadContext.Provider
      value={{
        leadsList,
        addLeads,
        updateLead,
        deleteLeads,
        getLead,
        resetLeads,
      }}
    >
      {children}
    </LeadContext.Provider>
  )
}

export function useLeads() {
  const ctx = useContext(LeadContext)
  if (!ctx) {
    throw new Error('useLeads must be used within a LeadProvider')
  }
  return ctx
}
