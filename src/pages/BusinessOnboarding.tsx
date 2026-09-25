import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Sparkles, Building2, FileText, Upload, Plus, Trash2, CheckCircle2,
  ArrowRight, Search, Target, Users, ShieldCheck, Check, RefreshCw, Layers
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'

interface ProductItem {
  id: string
  name: string
  category: string
  description: string
  targetPrice: string
  valueProp: string
}

interface ICPPersona {
  title: string
  department: string
  painPoints: string[]
  budgetInfluence: 'High' | 'Final Sign-off' | 'Influencer'
}

export function BusinessOnboarding() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t, businessProfile, updateBusinessProfile } = useAppContext()

  const [companyUrl, setCompanyUrl] = useState(businessProfile.companyUrl)
  const [companyName, setCompanyName] = useState(businessProfile.companyName)
  const [industry, setIndustry] = useState(businessProfile.industry)
  const [businessDesc, setBusinessDesc] = useState(businessProfile.businessDesc)

  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [hasScanned, setHasScanned] = useState(true)

  const [products, setProducts] = useState<ProductItem[]>(businessProfile.products)

  const [documents, setDocuments] = useState([
    { name: 'CallistoAI_Enterprise_Pitch_2026.pdf', size: '3.8 MB', date: 'Indexed 2 hours ago', status: 'SYNCHRONIZED' },
    { name: 'Product_Catalog_Pricing_Q4.docx', size: '1.4 MB', date: 'Indexed Yesterday', status: 'SYNCHRONIZED' },
    { name: 'Security_Architecture_SOC2.pdf', size: '920 KB', date: 'Indexed 3 days ago', status: 'SYNCHRONIZED' },
  ])

  const [personas, setPersonas] = useState<ICPPersona[]>(businessProfile.personas)

  const [discoveryQueries, setDiscoveryQueries] = useState(businessProfile.discoveryQueries)

  async function handleScanUrl() {
    if (!companyUrl) {
      showToast('error', 'URL Required', 'Please enter your corporate website URL')
      return
    }

    setIsScanning(true)
    const scanSteps = [
      'Pinging DNS and checking robots.txt & sitemap...',
      'Crawling public landing pages and product catalogs...',
      'Running NLP entity extraction on value propositions...',
      'Synthesizing customer persona matrix & buyer pain points...',
      'Extracting target keyword triggers for public lead discovery...',
      'Syncing with AI Voice Persona knowledge base...',
      'Analysis complete! Ideal Customer Profile updated.',
    ]

    for (const step of scanSteps) {
      setScanStep(step)
      await new Promise(r => setTimeout(r, 450))
    }

    const updatedQueries = [
      `"looking for ${products[0]?.name || 'automation'}" site:linkedin.com`,
      `"need ${companyName} alternative" OR "recommend ${industry}"`,
      `site:reddit.com/r/sales "outbound calling" OR "${products[0]?.category || 'SDR'}"`,
      `filetype:pdf "RFP" "${industry}" 2026`,
    ]
    setDiscoveryQueries(updatedQueries)

    updateBusinessProfile({
      companyUrl,
      companyName,
      industry,
      businessDesc,
      products,
      personas,
      discoveryQueries: updatedQueries,
    })

    setIsScanning(false)
    setHasScanned(true)
    showToast('success', 'Business Understood', 'AI successfully generated ICP, buyer personas, and discovery triggers from your website')
  }

  function handleAddProduct() {
    const newP: ProductItem = {
      id: `p-${Date.now()}`,
      name: 'Custom Enterprise Add-on',
      category: 'Professional Services',
      description: 'Dedicated enterprise voice onboarding, custom telephony routing, and CRM field mapping.',
      targetPrice: '$2,500 one-time',
      valueProp: 'Tailored enterprise rollout with dedicated SLA',
    }
    const updated = [...products, newP]
    setProducts(updated)
    updateBusinessProfile({ products: updated })
    showToast('success', 'Product Added', 'New offering added to AI knowledge base')
  }

  function handleApplyToDiscovery() {
    updateBusinessProfile({
      companyUrl,
      companyName,
      industry,
      businessDesc,
      products,
      personas,
      discoveryQueries,
    })
    showToast('success', 'ICP Applied', 'Applying target personas and queries to AI Lead Discovery...')
    navigate('/lead-discovery')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-bg-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  {t('onboard.title', 'Business Understanding & ICP Engine')}
                </h1>
                <span className="badge-blue text-2xs font-mono">STEP 1</span>
              </div>
              <p className="text-2xs text-text-muted mt-0.5">
                {t('onboard.subtitle', 'Provide your company URL and business docs to let AI extract your value proposition and target buyer personas')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyToDiscovery}
            className="btn-primary text-xs gap-1.5 py-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            {t('onboard.startDiscovery', 'Apply to Lead Discovery')}
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* URL Input & Scanner Banner */}
      <div className="panel p-4 sm:p-5 bg-gradient-to-br from-bg-card via-bg-card to-amber-500/5 border border-amber-500/30 rounded-xl space-y-4 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="text-2xs text-text-muted uppercase tracking-wide font-bold mb-1 block">
                {t('onboard.companyUrl', 'Company Website / URL')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    className="input pl-9 text-xs font-mono w-full"
                    placeholder="https://yourcompany.com"
                    value={companyUrl}
                    onChange={e => setCompanyUrl(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScanUrl}
                  disabled={isScanning}
                  className="btn-primary text-xs gap-1.5 shrink-0 px-4 py-2"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'text-amber-300'}`} />
                  {isScanning ? t('onboard.scanning', 'Scanning...') : t('onboard.scanBtn', 'AI Scan Website & Products')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide font-bold mb-1 block">
                  {t('onboard.companyName', 'Company Name')}
                </label>
                <input
                  className="input text-xs w-full"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide font-bold mb-1 block">
                  Industry / Domain
                </label>
                <input
                  className="input text-xs w-full"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-2xs text-text-muted uppercase tracking-wide font-bold mb-1 block">
                {t('onboard.businessDesc', 'Business Description & Offerings')}
              </label>
              <textarea
                rows={3}
                className="input text-xs w-full resize-none leading-relaxed"
                value={businessDesc}
                onChange={e => setBusinessDesc(e.target.value)}
              />
            </div>
          </div>

          {/* Document Upload Quick Drop */}
          <div className="p-3.5 bg-bg-secondary/70 border border-bg-border rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Grounding Documents
                </span>
                <span className="badge-success text-3xs">3 INDEXED</span>
              </div>
              <p className="text-2xs text-text-muted">Pitch decks, product catalogs, technical FAQs</p>

              <div className="space-y-1.5 mt-3 max-h-36 overflow-y-auto pr-1">
                {documents.map((d, i) => (
                  <div key={i} className="p-2 bg-bg-card rounded border border-bg-border flex items-center justify-between text-2xs">
                    <div className="truncate min-w-0 pr-2">
                      <div className="text-text-primary font-medium truncate">{d.name}</div>
                      <div className="text-3xs text-text-muted">{d.size} · {d.date}</div>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                showToast('info', 'Document Added', 'Corporate whitepaper uploaded and vectorized into embeddings')
                setDocuments(prev => [{ name: 'Enterprise_Security_Architecture.pdf', size: '2.1 MB', date: 'Just now', status: 'SYNCHRONIZED' }, ...prev])
              }}
              className="btn-secondary text-2xs w-full gap-1 py-1 justify-center"
            >
              <Upload className="w-3 h-3" /> Upload Catalog / Pitch Deck
            </button>
          </div>
        </div>

        {/* Live scanning progress bar */}
        {isScanning && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-2xs">
              <span className="text-amber-400 font-semibold flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> {scanStep}
              </span>
              <span className="font-mono text-amber-400">Processing URL</span>
            </div>
            <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Results grid: Products + ICP Personas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Products & Services Portfolio */}
        <div className="panel space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-text-primary">
                {t('onboard.productsTitle', 'Products & Services Portfolio')}
              </span>
              <span className="badge text-2xs font-mono">{products.length} Products</span>
            </div>
            <button
              onClick={handleAddProduct}
              className="btn-secondary text-2xs py-1 px-2 gap-1"
            >
              <Plus className="w-3 h-3" /> Add Product
            </button>
          </div>

          <div className="space-y-2.5">
            {products.map(p => (
              <div key={p.id} className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-1.5 hover:border-amber-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-primary">{p.name}</span>
                    <span className="ml-2 badge-blue text-3xs">{p.category}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-amber-400">{p.targetPrice}</span>
                </div>
                <p className="text-2xs text-text-secondary leading-relaxed">{p.description}</p>
                <div className="text-2xs text-success flex items-center gap-1 font-medium pt-0.5">
                  <Check className="w-3 h-3 shrink-0" /> {p.valueProp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI-Generated Ideal Customer Profile (ICP) */}
        <div className="panel space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-text-primary">
                {t('onboard.icpTitle', 'AI-Generated Ideal Customer Profile (ICP)')}
              </span>
            </div>
            <span className="badge-success text-3xs font-mono">HIGH FIT</span>
          </div>

          {/* Personas */}
          <div className="space-y-2">
            <div className="text-2xs uppercase tracking-wider text-text-muted font-bold">
              {t('onboard.personas', 'Target Buyer Personas')}
            </div>
            {personas.map((persona, i) => (
              <div key={i} className="p-2.5 bg-bg-card rounded border border-bg-border space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-amber-400" /> {persona.title}
                  </div>
                  <span className="badge-amber text-3xs">{persona.budgetInfluence}</span>
                </div>
                <div className="text-2xs text-text-muted">{persona.department}</div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {persona.painPoints.map((pt, j) => (
                    <span key={j} className="text-3xs px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary border border-bg-border">
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Discovery Queries */}
          <div className="pt-2 border-t border-bg-border space-y-1.5">
            <div className="text-2xs uppercase tracking-wider text-text-muted font-bold">
              {t('onboard.discoveryQueries', 'Recommended Public Discovery Queries')}
            </div>
            <div className="space-y-1">
              {discoveryQueries.map((q, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded bg-bg-secondary border border-bg-border/60 text-2xs font-mono text-amber-300 flex items-center justify-between">
                  <span className="truncate pr-2">{q}</span>
                  <span className="text-3xs text-text-muted">Public Signal</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
