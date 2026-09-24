export type SupportedLanguage = 'en' | 'hi' | 'gu'

export interface LanguageInfo {
  code: SupportedLanguage
  name: string
  nativeName: string
  flag: string
  locale: string
  defaultVoice: string
  defaultAgentName: string
  badgeClass: string
  sampleGreeting: string
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    locale: 'en-US',
    defaultVoice: 'Aria (US English Neural)',
    defaultAgentName: 'Aria (Enterprise SDR)',
    badgeClass: 'badge-blue',
    sampleGreeting: 'Hello! I am calling from Callisto AI Solutions regarding your sales automation project.',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    locale: 'hi-IN',
    defaultVoice: 'Swara (Hindi Neural SDR)',
    defaultAgentName: 'Swara (Hindi SDR)',
    badgeClass: 'badge-high',
    sampleGreeting: 'नमस्ते! मैं Callisto AI से आपकी सेल्स ऑटोमेशन आवश्यकता के लिए बात कर रही हूँ।',
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    locale: 'gu-IN',
    defaultVoice: 'Gaurav (Gujarati Neural)',
    defaultAgentName: 'Gaurav (Gujarati SDR)',
    badgeClass: 'badge-success',
    sampleGreeting: 'નમસ્તે! હું Callisto AI માંથી આપના સેલ્સ ગ્રોથ અને AI કૉલિંગ પ્રોજેક્ટ અંગે વાત કરું છું.',
  },
}

export const LANGUAGE_LIST: LanguageInfo[] = Object.values(SUPPORTED_LANGUAGES)

export interface LocationDetectionResult {
  primary: SupportedLanguage
  secondary: SupportedLanguage[]
  regionName: string
  confidence: number
  reason: string
}

/**
 * Automatically detects the optimal calling and interaction language
 * based on lead location, city, state, or demographic indicators.
 */
export function detectLanguageFromLocation(locationStr: string, prospectName: string = ''): LocationDetectionResult {
  const loc = (locationStr || '').toLowerCase().trim()
  const name = (prospectName || '').toLowerCase().trim()

  // 1. Detect Gujarat & Gujarati-first regions
  const gujaratKeywords = [
    'ahmedabad', 'surat', 'vadodara', 'baroda', 'rajkot', 'bhavnagar',
    'jamnagar', 'gandhinagar', 'anand', 'mehsana', 'gujarat', 'vapi'
  ]
  const isGujaratLoc = gujaratKeywords.some(k => loc.includes(k))
  const isGujaratiSurname = name.includes('patel') || name.includes('shah') || name.includes('modi') || name.includes('mehta')

  if (isGujaratLoc || (loc.includes('india') && isGujaratiSurname && !loc.includes('bangalore') && !loc.includes('chennai') && !loc.includes('hyderabad'))) {
    return {
      primary: 'gu',
      secondary: ['hi', 'en'],
      regionName: isGujaratLoc ? 'Gujarat Region' : 'Western India',
      confidence: isGujaratLoc ? 98 : 88,
      reason: `Location "${locationStr}" maps to Gujarat. Native Gujarati neural voice achieves +34% higher answer & qualification conversion.`,
    }
  }

  // 2. Detect Hindi belt & North/Central India regions
  const hindiKeywords = [
    'delhi', 'new delhi', 'ncr', 'mumbai', 'pune', 'noida', 'gurgaon', 'gurugram',
    'lucknow', 'jaipur', 'indore', 'bhopal', 'chandigarh', 'patna', 'kanpur',
    'nagpur', 'varanasi', 'agra', 'maharashtra', 'uttar pradesh', 'rajasthan',
    'madhya pradesh', 'bihar', 'haryana', 'punjab', 'ghaziabad', 'faridabad'
  ]
  const isHindiLoc = hindiKeywords.some(k => loc.includes(k))

  if (isHindiLoc) {
    return {
      primary: 'hi',
      secondary: ['en', 'gu'],
      regionName: 'North / Central India',
      confidence: 95,
      reason: `Location "${locationStr}" is in the Hindi-speaking market. Hindi neural voice ensures natural cadence and rapport.`,
    }
  }

  // 3. Pan-India Tech Hubs & Global Locations (Bangalore, Hyderabad, Chennai, International)
  return {
    primary: 'en',
    secondary: ['hi', 'gu'],
    regionName: loc.includes('india') ? 'Pan-India Corporate' : 'Global / International',
    confidence: 90,
    reason: `Location "${locationStr}" is an enterprise / multinational corporate market. English recommended with Hindi/Gujarati code-switching available.`,
  }
}
