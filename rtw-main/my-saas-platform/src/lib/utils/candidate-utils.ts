import { Country } from 'country-state-city'

/**
 * Utility functions for candidate data formatting
 * These are client-safe and don't import any server-only code
 */

/**
 * Format experience years for display
 */
export function formatExperience(years: number): string {
  if (years >= 10) return '10+ years'
  if (years >= 5) return '5-10 years'
  if (years >= 3) return '3-5 years'
  if (years >= 1) return '1-3 years'
  return 'Less than 1 year'
}

/** Common nationality/gentilic aliases -> ISO 3166-1 alpha-2 */
const NATIONALITY_TO_ISO: Record<string, string> = {
  saudi: 'SA',
  'saudi arabia': 'SA',
  pakistani: 'PK',
  pakistan: 'PK',
  indian: 'IN',
  india: 'IN',
  indonesian: 'ID',
  indonesia: 'ID',
  filipino: 'PH',
  philippines: 'PH',
  egyptian: 'EG',
  egypt: 'EG',
  bangladeshi: 'BD',
  bangladesh: 'BD',
  'sri lankan': 'LK',
  'sri lanka': 'LK',
  nepalese: 'NP',
  nepal: 'NP',
  british: 'GB',
  'united kingdom': 'GB',
  uk: 'GB',
  american: 'US',
  'united states': 'US',
  usa: 'US',
  canadian: 'CA',
  canada: 'CA',
  australian: 'AU',
  australia: 'AU',
  'south african': 'ZA',
  'south africa': 'ZA',
  syrian: 'SY',
  syria: 'SY',
  jordanian: 'JO',
  jordan: 'JO',
  lebanese: 'LB',
  lebanon: 'LB',
  yemeni: 'YE',
  yemen: 'YE',
  sudanese: 'SD',
  sudan: 'SD',
  moroccan: 'MA',
  morocco: 'MA',
  tunisian: 'TN',
  tunisia: 'TN',
  algerian: 'DZ',
  algeria: 'DZ',
  ethiopian: 'ET',
  ethiopia: 'ET',
  kenyan: 'KE',
  kenya: 'KE',
  nigerian: 'NG',
  nigeria: 'NG',
  ghanaian: 'GH',
  ghana: 'GH',
  chinese: 'CN',
  china: 'CN',
  japanese: 'JP',
  japan: 'JP',
  korean: 'KR',
  'south korea': 'KR',
  vietnamese: 'VN',
  vietnam: 'VN',
  thai: 'TH',
  thailand: 'TH',
  malaysian: 'MY',
  malaysia: 'MY',
  singaporean: 'SG',
  singapore: 'SG',
}

const DEFAULT_FLAG = '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp'

/**
 * Resolve nationality string to ISO country code, then return flag URL that matches the candidate.
 * Uses country-state-city for name match and a gentilics map so "Pakistani" -> Pakistan flag, etc.
 */
export function getNationalityFlag(nationality: string): string {
  if (!nationality?.trim()) return DEFAULT_FLAG
  const n = nationality.trim().toLowerCase()
  const byAlias = NATIONALITY_TO_ISO[n]
  if (byAlias) return `https://flagcdn.com/w40/${byAlias.toLowerCase()}.png`
  const countries = Country.getAllCountries()
  const country = countries.find(
    (c) => c.name.toLowerCase() === n || c.isoCode.toLowerCase() === n
  )
  if (country) return `https://flagcdn.com/w40/${country.isoCode.toLowerCase()}.png`
  return DEFAULT_FLAG
}

