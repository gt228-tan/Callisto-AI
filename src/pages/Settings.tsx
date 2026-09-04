import { useState } from 'react'
import { Settings, User, Building2, Brain, Volume2, Globe, Bell, Link2, Shield, CreditCard } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'

const tabs = [
  { id: 'profile',      label: 'Profile',       icon: <User className="w-3.5 h-3.5" /> },
  { id: 'company',      label: 'Company',       icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'ai',           label: 'AI Preferences', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'voice',        label: 'Voice Agent',   icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: 'languages',    label: 'Languages',     icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'notifications',label: 'Notifications', icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'integrations', label: 'Integrations',  icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'security',     label: 'Security',      icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'billing',      label: 'Billing',       icon: <CreditCard className="w-3.5 h-3.5" /> },
]

export function SettingsPage() {
  const { showToast } = useToast()
  const { language, setLanguage } = useAppContext()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState({ name: 'Tanishq Mehta', email: 'tanishq@demo-nexusai.com', phone: '+91-98765-00001', company: 'NexusAI Solutions', timezone: 'Asia/Kolkata' })

  function save() { showToast('success', 'Settings Saved', 'Your preferences have been updated') }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-amber-400" />
        <h1 className="text-sm font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex gap-4">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 panel p-2 h-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${activeTab === t.id ? 'bg-amber-500/10 text-amber-400' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 panel p-6 space-y-5 min-h-96">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Profile</div>
              {[{l:'Full Name',k:'name'},{l:'Email Address',k:'email'},{l:'Phone',k:'phone'},{l:'Timezone',k:'timezone'}].map(f => (
                <div key={f.k}>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.l}</label>
                  <input className="input max-w-md" value={(profile as any)[f.k]} onChange={e => setProfile(p => ({...p, [f.k]: e.target.value}))} />
                </div>
              ))}
              <button onClick={save} className="btn-primary text-xs">Save Profile</button>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">AI Preferences</div>
              {[
                { label: 'Min Intent Score Threshold', type: 'range', min: 50, max: 99, defaultVal: 75 },
                { label: 'Auto-qualify leads above score', type: 'toggle', defaultVal: true },
                { label: 'Enrich leads automatically', type: 'toggle', defaultVal: true },
                { label: 'Discovery frequency', type: 'select', options: ['Every hour','Every 6 hours','Daily','Weekly'] },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between max-w-md py-2 border-b border-bg-border/50">
                  <label className="text-xs text-text-primary">{f.label}</label>
                  {f.type === 'toggle' && (
                    <div className="w-10 h-5 bg-amber-500 rounded-full cursor-pointer relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                    </div>
                  )}
                  {f.type === 'select' && (
                    <select className="input w-36 text-xs">{(f as any).options.map((o: string) => <option key={o}>{o}</option>)}</select>
                  )}
                  {f.type === 'range' && (
                    <div className="flex items-center gap-2">
                      <input type="range" min={50} max={99} defaultValue={75} className="accent-amber-500 w-24" />
                      <span className="text-xs text-amber-400 font-mono w-6">75</span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={save} className="btn-primary text-xs">Save AI Settings</button>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Voice Agent Configuration</div>
              {[
                {l:'Default Agent Name', type:'input', val:'Aria'},
                {l:'Default Language', type:'select', opts:['English','Hindi','Gujarati','Tamil','Telugu','Arabic','Spanish','French','German']},
                {l:'Default Voice', type:'select', opts:['Professional Female','Professional Male','Native Hindi Female','British Male']},
                {l:'Call Speed', type:'select', opts:['0.85x (Slower)','1.0x (Normal)','1.1x (Slightly Faster)']},
                {l:'Max call duration (minutes)', type:'input', val:'10'},
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.l}</label>
                  {f.type === 'select'
                    ? <select className="input max-w-xs">{(f as any).opts.map((o: string) => <option key={o}>{o}</option>)}</select>
                    : <input className="input max-w-xs" defaultValue={(f as any).val} />
                  }
                </div>
              ))}
              <button onClick={save} className="btn-primary text-xs">Save Voice Settings</button>
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Interface Language</div>
              <div className="text-xs text-text-muted">Select the language for the platform interface</div>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[{code:'en',label:'English',native:'English'},{code:'hi',label:'Hindi',native:'हिंदी'},{code:'gu',label:'Gujarati',native:'ગુજરાતી'}].map(l => (
                  <button key={l.code} onClick={() => { setLanguage(l.code as any); showToast('success','Language Changed',`Interface language set to ${l.label}`) }}
                    className={`p-4 rounded border text-center transition-colors ${language === l.code ? 'bg-amber-500/10 border-amber-500/40' : 'border-bg-border hover:border-amber-500/30 bg-bg-card'}`}>
                    <div className="text-lg mb-1">{l.native}</div>
                    <div className="text-2xs text-text-muted">{l.label}</div>
                    {language === l.code && <div className="text-2xs text-amber-400 mt-1">✓ Active</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Security</div>
              {[
                {l:'Two-Factor Authentication', desc:'Add extra security to your account', btn:'Enable 2FA', variant:'btn-primary'},
                {l:'Change Password', desc:'Update your account password', btn:'Change Password', variant:'btn-secondary'},
                {l:'Active Sessions', desc:'2 active sessions (this device + 1 other)', btn:'View Sessions', variant:'btn-secondary'},
                {l:'API Keys', desc:'3 active API keys', btn:'Manage Keys', variant:'btn-secondary'},
              ].map(item => (
                <div key={item.l} className="flex items-center justify-between py-3 border-b border-bg-border/50">
                  <div>
                    <div className="text-xs font-medium text-text-primary">{item.l}</div>
                    <div className="text-2xs text-text-muted">{item.desc}</div>
                  </div>
                  <button onClick={() => showToast('info', item.l, 'Action initiated')} className={`${item.variant} text-xs`}>{item.btn}</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Billing</div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Enterprise Plan</div>
                    <div className="text-xs text-text-muted">$899/month · Billed monthly</div>
                  </div>
                  <button onClick={() => showToast('info','Upgrade','Opening plan comparison...')} className="btn-secondary text-xs">Upgrade Plan</button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-text-primary">Usage This Month</div>
                {[{l:'Contacts',u:24681,m:50000},{l:'Voice Minutes',u:4820,m:10000},{l:'API Calls',u:18420,m:100000},{l:'Storage',u:2.4,m:50}].map(r => (
                  <div key={r.l}>
                    <div className="flex justify-between text-2xs mb-1">
                      <span className="text-text-muted">{r.l}</span>
                      <span className="text-text-primary font-mono">{r.u} / {r.m}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill-amber" style={{width:`${(r.u/r.m)*100}%`}} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!['profile','ai','voice','languages','security','billing'].includes(activeTab) && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2 capitalize">{tabs.find(t=>t.id===activeTab)?.label}</div>
              <div className="text-xs text-text-muted">Configure your {tabs.find(t=>t.id===activeTab)?.label.toLowerCase()} preferences here.</div>
              <button onClick={save} className="btn-primary text-xs">Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
