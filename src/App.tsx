import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '@/contexts/AppContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { LeadProvider } from '@/contexts/LeadContext'
import { CampaignProvider } from '@/contexts/CampaignContext'
import { AuditProvider } from '@/contexts/AuditContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { InactivityModal } from '@/components/auth/InactivityModal'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { BusinessOnboarding } from '@/pages/BusinessOnboarding'
import { PipelineJourney } from '@/pages/PipelineJourney'
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
  AdminProductApprovals,
} from '@/pages/Admin'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  // Display enterprise Login page before any actual workspace views
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <>
      <InactivityModal />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/business-onboarding" element={<BusinessOnboarding />} />
          <Route path="/pipeline-journey"   element={<PipelineJourney />} />
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

          {/* Admin routes — Enforced by Zero-Trust ProtectedRoute RBAC guard */}
          <Route path="/admin"              element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"        element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/product-approvals" element={<ProtectedRoute requiredRole="ADMIN"><AdminProductApprovals /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="ADMIN"><AdminSubscriptions /></ProtectedRoute>} />
          <Route path="/admin/voice-usage"  element={<ProtectedRoute requiredRole="ADMIN"><AdminVoiceUsage /></ProtectedRoute>} />
          <Route path="/admin/billing"      element={<ProtectedRoute requiredRole="ADMIN"><AdminBilling /></ProtectedRoute>} />
          <Route path="/admin/audit-logs"   element={<ProtectedRoute requiredRole="ADMIN"><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/admin/fraud"        element={<ProtectedRoute requiredRole="ADMIN"><AdminFraud /></ProtectedRoute>} />
          <Route path="/admin/system"       element={<ProtectedRoute requiredRole="ADMIN"><AdminSystem /></ProtectedRoute>} />
          <Route path="/admin/platform"     element={<ProtectedRoute requiredRole="ADMIN"><AdminPlatformSettings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuditProvider>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <LeadProvider>
                <CampaignProvider>
                  <AppRoutes />
                </CampaignProvider>
              </LeadProvider>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </AuditProvider>
    </BrowserRouter>
  )
}
