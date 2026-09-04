import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '@/contexts/AppContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { LeadDiscovery } from '@/pages/LeadDiscovery'
import { Leads } from '@/pages/Leads'
import { AIQualification } from '@/pages/AIQualification'
import { Campaigns } from '@/pages/Campaigns'
import { AIVoiceAgent } from '@/pages/AIVoiceAgent'
import { CallHistory } from '@/pages/CallHistory'
import { MarketIntelligence } from '@/pages/MarketIntelligence'
import { SalesPipeline } from '@/pages/SalesPipeline'
import { Analytics } from '@/pages/Analytics'
import { CRM } from '@/pages/CRM'
import { SettingsPage } from '@/pages/Settings'
import {
  AdminDashboard, AdminUsers, AdminAuditLogs, AdminFraud,
  AdminSystem, AdminVoiceUsage, AdminSubscriptions, AdminBilling, AdminPlatformSettings,
} from '@/pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/"                   element={<Dashboard />} />
              <Route path="/lead-discovery"     element={<LeadDiscovery />} />
              <Route path="/leads"              element={<Leads />} />
              <Route path="/ai-qualification"   element={<AIQualification />} />
              <Route path="/campaigns"          element={<Campaigns />} />
              <Route path="/ai-voice-agent"     element={<AIVoiceAgent />} />
              <Route path="/call-history"       element={<CallHistory />} />
              <Route path="/market-intelligence" element={<MarketIntelligence />} />
              <Route path="/pipeline"           element={<SalesPipeline />} />
              <Route path="/analytics"          element={<Analytics />} />
              <Route path="/crm"                element={<CRM />} />
              <Route path="/settings"           element={<SettingsPage />} />

              {/* Admin routes */}
              <Route path="/admin"              element={<AdminDashboard />} />
              <Route path="/admin/users"        element={<AdminUsers />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/voice-usage"  element={<AdminVoiceUsage />} />
              <Route path="/admin/billing"      element={<AdminBilling />} />
              <Route path="/admin/audit-logs"   element={<AdminAuditLogs />} />
              <Route path="/admin/fraud"        element={<AdminFraud />} />
              <Route path="/admin/system"       element={<AdminSystem />} />
              <Route path="/admin/platform"     element={<AdminPlatformSettings />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
