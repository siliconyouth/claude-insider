/**
 * Countries Utility
 *
 * ISO 3166-1 alpha-2 country codes and names for location selection.
 * Sorted alphabetically by country name.
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (e.g., "US")
  name: string; // Full country name (e.g., "United States")
  flag: string; // Emoji flag
}

/**
 * Complete list of countries with ISO codes and flag emojis
 */
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CD", name: "Congo (DRC)", flag: "🇨🇩" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KP", name: "Korea (North)", flag: "🇰🇵" },
  { code: "KR", name: "Korea (South)", flag: "🇰🇷" },
  { code: "XK", name: "Kosovo", flag: "🇽🇰" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

/**
 * Find country by code
 */
export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/**
 * Find country by name (case-insensitive partial match)
 */
export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter((c) => c.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get country flag emoji by code
 */
export function getCountryFlag(code: string): string {
  const country = findCountry(code);
  return country?.flag || "🏳️";
}

/**
 * Get display label with flag
 * @returns "🇷🇸 Serbia"
 */
export function getCountryDisplayLabel(code: string): string {
  const country = findCountry(code);
  if (!country) return code;
  return `${country.flag} ${country.name}`;
}

/**
 * Format location display string
 * @param city Optional city name
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns "Belgrade, Serbia" or just "Serbia" if no city
 */
export function formatLocation(city?: string, countryCode?: string): string {
  if (!countryCode) return city || "";

  const country = findCountry(countryCode);
  const countryName = country?.name || countryCode;

  if (city) {
    return `${city}, ${countryName}`;
  }

  return countryName;
}

/**
 * Format location with flag
 * @returns "🇷🇸 Belgrade, Serbia"
 */
export function formatLocationWithFlag(city?: string, countryCode?: string): string {
  if (!countryCode) return city || "";

  const country = findCountry(countryCode);
  const location = formatLocation(city, countryCode);

  if (country) {
    return `${country.flag} ${location}`;
  }

  return location;
}
