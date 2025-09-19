// Currency mapping based on country names and common location indicators
const CURRENCY_MAPPING: { [key: string]: string } = {
  // North America
  'united states': '$',
  'usa': '$',
  'us': '$',
  'america': '$',
  'canada': 'C$',
  'mexico': 'MX$',

  // Europe
  'germany': '€',
  'france': '€',
  'spain': '€',
  'italy': '€',
  'netherlands': '€',
  'belgium': '€',
  'austria': '€',
  'portugal': '€',
  'ireland': '€',
  'finland': '€',
  'luxembourg': '€',
  'slovenia': '€',
  'slovakia': '€',
  'estonia': '€',
  'latvia': '€',
  'lithuania': '€',
  'malta': '€',
  'cyprus': '€',
  'united kingdom': '£',
  'uk': '£',
  'britain': '£',
  'england': '£',
  'scotland': '£',
  'wales': '£',
  'switzerland': 'CHF',
  'norway': 'kr',
  'sweden': 'kr',
  'denmark': 'kr',
  'poland': 'zł',
  'czech republic': 'Kč',
  'hungary': 'Ft',
  'romania': 'RON',
  'bulgaria': 'лв',
  'croatia': 'kn',

  // Asia
  'japan': '¥',
  'china': '¥',
  'south korea': '₩',
  'india': '₹',
  'singapore': 'S$',
  'hong kong': 'HK$',
  'taiwan': 'NT$',
  'thailand': '฿',
  'malaysia': 'RM',
  'indonesia': 'Rp',
  'philippines': '₱',
  'vietnam': '₫',

  // Oceania
  'australia': 'A$',
  'new zealand': 'NZ$',

  // Middle East
  'israel': '₪',
  'saudi arabia': 'SR',
  'uae': 'AED',
  'turkey': '₺',

  // Africa
  'south africa': 'R',
  'egypt': 'E£',
  'nigeria': '₦',

  // South America
  'brazil': 'R$',
  'argentina': 'AR$',
  'chile': 'CL$',
  'colombia': 'CO$',
  'peru': 'S/',
};

export const getCurrencyForLocation = (address: string): string => {
  if (!address) return '$'; // Default to USD

  const lowerAddress = address.toLowerCase();

  // Check for country matches in the address
  for (const [country, currency] of Object.entries(CURRENCY_MAPPING)) {
    if (lowerAddress.includes(country)) {
      return currency;
    }
  }

  // Check for common city names as fallback
  const cityMapping: { [key: string]: string } = {
    'new york': '$',
    'los angeles': '$',
    'chicago': '$',
    'toronto': 'C$',
    'vancouver': 'C$',
    'london': '£',
    'paris': '€',
    'berlin': '€',
    'rome': '€',
    'madrid': '€',
    'amsterdam': '€',
    'tokyo': '¥',
    'seoul': '₩',
    'beijing': '¥',
    'shanghai': '¥',
    'sydney': 'A$',
    'melbourne': 'A$',
    'mumbai': '₹',
    'delhi': '₹',
    'singapore': 'S$',
    'dubai': 'AED',
    'tel aviv': '₪',
    'zurich': 'CHF',
    'stockholm': 'kr',
    'oslo': 'kr',
  };

  for (const [city, currency] of Object.entries(cityMapping)) {
    if (lowerAddress.includes(city)) {
      return currency;
    }
  }

  // Default to USD if no match found
  return '$';
};