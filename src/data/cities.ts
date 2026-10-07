/**
 * The city catalogue.
 *
 * Coordinates are the city centre (used for sun geometry — accuracy well under
 * a degree is plenty for that). `tz` is the IANA zone the place actually lives
 * in, and it is the single source of truth for offset, DST and abbreviation:
 * nothing here hard-codes a UTC number, so the list stays correct as
 * governments change their clocks.
 *
 * Row shape (tuple):
 *   [id, name, country, cc, zone, lat, lng, region, metroMillions, admin?, note?]
 */

export type RegionKey =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'namerica'
  | 'samerica'
  | 'oceania'
  | 'mideast'
  | 'antarctic'

export const REGIONS: Record<RegionKey, string> = {
  africa: 'Africa',
  asia: 'Asia',
  europe: 'Europe',
  namerica: 'North America',
  samerica: 'South America',
  oceania: 'Oceania & Pacific',
  mideast: 'Middle East',
  antarctic: 'Antarctic',
}

export const REGION_ORDER: RegionKey[] = [
  'namerica',
  'samerica',
  'europe',
  'africa',
  'mideast',
  'asia',
  'oceania',
  'antarctic',
]

export type City = {
  id: string
  name: string
  country: string
  cc: string
  tz: string
  lat: number
  lng: number
  region: RegionKey
  /** Metro population in millions — used only to rank relevance. */
  popM: number
  admin?: string
  note?: string
}

type Row = [
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  RegionKey,
  number,
  string?,
  string?,
]

const ROWS: Row[] = [
  // ── North America & Caribbean ────────────────────────────────────────────
  ['new-york', 'New York', 'United States', 'US', 'America/New_York', 40.713, -74.006, 'namerica', 18.8, 'New York', 'The city that sets the Wall Street clock'],
  ['toronto', 'Toronto', 'Canada', 'CA', 'America/Toronto', 43.653, -79.384, 'namerica', 6.3, 'Ontario'],
  ['montreal', 'Montréal', 'Canada', 'CA', 'America/Toronto', 45.501, -73.567, 'namerica', 4.3, 'Quebec'],
  ['halifax', 'Halifax', 'Canada', 'CA', 'America/Halifax', 44.648, -63.575, 'namerica', 0.44, 'Nova Scotia'],
  ['st-johns', 'St. John’s', 'Canada', 'CA', 'America/St_Johns', 47.561, -52.712, 'namerica', 0.21, 'Newfoundland', 'A half-hour zone: UTC−3:30'],
  ['winnipeg', 'Winnipeg', 'Canada', 'CA', 'America/Winnipeg', 49.895, -97.138, 'namerica', 0.83, 'Manitoba'],
  ['regina', 'Regina', 'Canada', 'CA', 'America/Regina', 50.445, -104.618, 'namerica', 0.24, 'Saskatchewan', 'Stays on UTC−6 all year'],
  ['calgary', 'Calgary', 'Canada', 'CA', 'America/Edmonton', 51.045, -114.071, 'namerica', 1.5, 'Alberta'],
  ['vancouver', 'Vancouver', 'Canada', 'CA', 'America/Vancouver', 49.283, -123.121, 'namerica', 2.7, 'British Columbia'],
  ['iqaluit', 'Iqaluit', 'Canada', 'CA', 'America/Iqaluit', 63.75, -68.518, 'namerica', 0.008, 'Nunavut'],
  ['nuuk', 'Nuuk', 'Greenland', 'GL', 'America/Nuuk', 64.175, -51.735, 'namerica', 0.19, '', 'Greenlandic DST matches Europe’s'],
  ['chicago', 'Chicago', 'United States', 'US', 'America/Chicago', 41.878, -87.63, 'namerica', 8.9, 'Illinois'],
  ['houston', 'Houston', 'United States', 'US', 'America/Chicago', 29.76, -95.37, 'namerica', 2.4, 'Texas'],
  ['dallas', 'Dallas', 'United States', 'US', 'America/Chicago', 32.777, -96.797, 'namerica', 1.7, 'Texas'],
  ['minneapolis', 'Minneapolis', 'United States', 'US', 'America/Chicago', 44.978, -93.265, 'namerica', 3.7, 'Minnesota'],
  ['indianapolis', 'Indianapolis', 'United States', 'US', 'America/Indiana/Indianapolis', 39.768, -86.158, 'namerica', 2.1, 'Indiana'],
  ['atlanta', 'Atlanta', 'United States', 'US', 'America/New_York', 33.749, -84.388, 'namerica', 6.2, 'Georgia'],
  ['miami', 'Miami', 'United States', 'US', 'America/New_York', 25.762, -80.192, 'namerica', 6.1, 'Florida'],
  ['boston', 'Boston', 'United States', 'US', 'America/New_York', 42.36, -71.058, 'namerica', 4.9, 'Massachusetts'],
  ['philadelphia', 'Philadelphia', 'United States', 'US', 'America/New_York', 39.953, -75.164, 'namerica', 6.2, 'Pennsylvania'],
  ['washington', 'Washington, D.C.', 'United States', 'US', 'America/New_York', 38.907, -77.037, 'namerica', 6.3, 'District of Columbia'],
  ['detroit', 'Detroit', 'United States', 'US', 'America/Detroit', 42.331, -83.046, 'namerica', 4.3, 'Michigan'],
  ['denver', 'Denver', 'United States', 'US', 'America/Denver', 39.74, -104.99, 'namerica', 2.9, 'Colorado'],
  ['phoenix', 'Phoenix', 'United States', 'US', 'America/Phoenix', 33.448, -112.074, 'namerica', 4.9, 'Arizona', 'No DST — so LA is an hour behind it in summer'],
  ['las-vegas', 'Las Vegas', 'United States', 'US', 'America/Los_Angeles', 36.169, -115.14, 'namerica', 0.67, 'Nevada'],
  ['los-angeles', 'Los Angeles', 'United States', 'US', 'America/Los_Angeles', 34.052, -118.243, 'namerica', 12.5, 'California'],
  ['san-francisco', 'San Francisco', 'United States', 'US', 'America/Los_Angeles', 37.774, -122.419, 'namerica', 9.7, 'California'],
  ['seattle', 'Seattle', 'United States', 'US', 'America/Los_Angeles', 47.606, -122.332, 'namerica', 4.0, 'Washington'],
  ['anchorage', 'Anchorage', 'United States', 'US', 'America/Anchorage', 61.218, -149.9, 'namerica', 0.4, 'Alaska'],
  ['nome', 'Nome', 'United States', 'US', 'America/Nome', 64.501, -165.406, 'namerica', 0.004, 'Alaska', '21 hours behind Russia across the strait'],
  ['honolulu', 'Honolulu', 'United States', 'US', 'Pacific/Honolulu', 21.307, -157.858, 'oceania', 0.36, 'Hawaii', 'UTC−10 and never on DST'],
  ['mexico-city', 'Mexico City', 'Mexico', 'MX', 'America/Mexico_City', 19.433, -99.133, 'namerica', 9.2, 'CDMX', 'DST abolished in 2022'],
  ['tijuana', 'Tijuana', 'Mexico', 'MX', 'America/Tijuana', 32.507, -117.004, 'namerica', 1.9, 'Baja California', 'Still shifts with San Diego'],
  ['cancun', 'Cancún', 'Mexico', 'MX', 'America/Cancun', 21.162, -86.851, 'namerica', 0.9, 'Quintana Roo', 'Eastern time, unlike the rest of Mexico'],
  ['guadalajara', 'Guadalajara', 'Mexico', 'MX', 'America/Mexico_City', 20.667, -103.347, 'namerica', 1.5, 'Jalisco'],
  ['monterrey', 'Monterrey', 'Mexico', 'MX', 'America/Monterrey', 25.686, -100.316, 'namerica', 1.3, 'Nuevo León'],
  ['hermosillo', 'Hermosillo', 'Mexico', 'MX', 'America/Hermosillo', 29.073, -110.961, 'namerica', 0.9, 'Sonora', 'Its clocks never change'],
  ['guatemala-city', 'Guatemala City', 'Guatemala', 'GT', 'America/Guatemala', 14.634, -90.507, 'namerica', 0.3],
  ['san-jose', 'San José', 'Costa Rica', 'CR', 'America/Costa_Rica', 9.928, -84.09, 'namerica', 0.35],
  ['panama-city', 'Panama City', 'Panama', 'PA', 'America/Panama', 8.982, -79.52, 'namerica', 1.9, '', 'Never on DST, so it swaps partners seasonally'],
  ['havana', 'Havana', 'Cuba', 'CU', 'America/Havana', 23.114, -82.366, 'namerica', 2.1],
  ['kingston', 'Kingston', 'Jamaica', 'JM', 'America/Jamaica', 17.971, -76.793, 'namerica', 0.6],
  ['nassau', 'Nassau', 'Bahamas', 'BS', 'America/Nassau', 25.048, -77.355, 'namerica', 0.28],
  ['santo-domingo', 'Santo Domingo', 'Dominican Republic', 'DO', 'America/Santo_Domingo', 18.476, -69.893, 'namerica', 3.0],
  ['san-juan', 'San Juan', 'Puerto Rico', 'PR', 'America/Puerto_Rico', 18.466, -66.105, 'namerica', 2.4, '', 'Atlantic UTC−4 all year'],
  ['bridgetown', 'Bridgetown', 'Barbados', 'BB', 'America/Barbados', 13.1, -59.617, 'namerica', 0.11],
  ['port-of-spain', 'Port of Spain', 'Trinidad & Tobago', 'TT', 'America/Port_of_Spain', 10.659, -61.504, 'namerica', 0.08],
  ['bermuda', 'Hamilton', 'Bermuda', 'BM', 'Atlantic/Bermuda', 32.294, -64.785, 'namerica', 0.006, '', 'UTC−4 with US-style DST'],

  // ── South America ────────────────────────────────────────────────────────
  ['bogota', 'Bogotá', 'Colombia', 'CO', 'America/Bogota', 4.711, -74.072, 'samerica', 11.3],
  ['lima', 'Lima', 'Peru', 'PE', 'America/Lima', -12.046, -77.043, 'samerica', 11.4],
  ['quito', 'Quito', 'Ecuador', 'EC', 'America/Guayaquil', -0.181, -78.467, 'samerica', 2.8, '', 'On the equator: sunrise ~6am all year'],
  ['caracas', 'Caracas', 'Venezuela', 'VE', 'America/Caracas', 10.48, -66.904, 'samerica', 2.9],
  ['georgetown', 'Georgetown', 'Guyana', 'GY', 'America/Guyana', 6.824, -58.156, 'samerica', 0.2],
  ['paramaribo', 'Paramaribo', 'Suriname', 'SR', 'America/Paramaribo', 5.852, -55.204, 'samerica', 0.25],
  ['cayenne', 'Cayenne', 'French Guiana', 'GF', 'America/Cayenne', 4.937, -52.333, 'samerica', 0.14],
  ['manaus', 'Manaus', 'Brazil', 'BR', 'America/Manaus', -3.119, -60.026, 'samerica', 2.3, 'Amazonas', 'UTC−4 in the rainforest'],
  ['rio-branco', 'Rio Branco', 'Brazil', 'BR', 'America/Rio_Branco', -9.975, -67.825, 'samerica', 0.42, 'Acre'],
  ['recife', 'Recife', 'Brazil', 'BR', 'America/Recife', -8.047, -34.877, 'samerica', 1.6, 'Pernambuco'],
  ['salvador', 'Salvador', 'Brazil', 'BR', 'America/Bahia', -12.977, -38.501, 'samerica', 2.9, 'Bahia'],
  ['fortaleza', 'Fortaleza', 'Brazil', 'BR', 'America/Fortaleza', -3.718, -38.543, 'samerica', 2.7, 'Ceará'],
  ['sao-paulo', 'São Paulo', 'Brazil', 'BR', 'America/Sao_Paulo', -23.55, -46.633, 'samerica', 22.6, 'São Paulo', 'DST abolished in 2019'],
  ['rio-de-janeiro', 'Rio de Janeiro', 'Brazil', 'BR', 'America/Sao_Paulo', -22.906, -43.172, 'samerica', 6.8, 'Rio de Janeiro'],
  ['brasilia', 'Brasília', 'Brazil', 'BR', 'America/Sao_Paulo', -15.794, -47.882, 'samerica', 3.1, 'Federal District'],
  ['porto-alegre', 'Porto Alegre', 'Brazil', 'BR', 'America/Sao_Paulo', -30.034, -51.219, 'samerica', 1.4, 'Rio Grande do Sul'],
  ['montevideo', 'Montevideo', 'Uruguay', 'UY', 'America/Montevideo', -34.903, -56.165, 'samerica', 1.4],
  ['buenos-aires', 'Buenos Aires', 'Argentina', 'AR', 'America/Argentina/Buenos_Aires', -34.604, -58.382, 'samerica', 15.4],
  ['cordoba', 'Córdoba', 'Argentina', 'AR', 'America/Argentina/Cordoba', -31.42, -64.183, 'samerica', 1.4],
  ['mendoza', 'Mendoza', 'Argentina', 'AR', 'America/Argentina/Mendoza', -32.89, -68.827, 'samerica', 0.5, '', 'Andes wine country'],
  ['santiago', 'Santiago', 'Chile', 'CL', 'America/Santiago', -33.449, -70.669, 'samerica', 6.8, '', 'Southern DST runs Sep–Apr'],
  ['punta-arenas', 'Punta Arenas', 'Chile', 'CL', 'America/Punta_Arenas', -53.15, -70.916, 'samerica', 0.13, 'Magallanes', 'The southernmost city on Earth'],
  ['la-paz', 'La Paz', 'Bolivia', 'BO', 'America/La_Paz', -16.49, -68.15, 'samerica', 2.0, '', 'Highest capital city on Earth'],
  ['asuncion', 'Asunción', 'Paraguay', 'PY', 'America/Asuncion', -25.263, -57.575, 'samerica', 0.52],
  ['hanga-roa', 'Hanga Roa', 'Chile', 'CL', 'Pacific/Easter', -27.135, -109.35, 'oceania', 0.008, 'Easter Island', 'Chile, but its own UTC−6 zone'],

  // ── Europe ───────────────────────────────────────────────────────────────
  ['london', 'London', 'United Kingdom', 'GB', 'Europe/London', 51.507, -0.128, 'europe', 9.5, '', 'The world’s reference clock — GMT in winter, BST in summer'],
  ['dublin', 'Dublin', 'Ireland', 'IE', 'Europe/Dublin', 53.35, -6.26, 'europe', 1.4],
  ['lisbon', 'Lisbon', 'Portugal', 'PT', 'Europe/Lisbon', 38.722, -9.139, 'europe', 3.0],
  ['porto', 'Porto', 'Portugal', 'PT', 'Europe/Lisbon', 41.149, -8.611, 'europe', 1.7],
  ['funchal', 'Funchal', 'Portugal', 'PT', 'Atlantic/Madeira', 32.649, -16.905, 'europe', 0.11, 'Madeira', 'An hour behind the mainland'],
  ['ponta-delgada', 'Ponta Delgada', 'Portugal', 'PT', 'Atlantic/Azores', 37.741, -25.676, 'europe', 0.06, 'Azores', 'UTC−1, west of Lisbon'],
  ['madrid', 'Madrid', 'Spain', 'ES', 'Europe/Madrid', 40.417, -3.703, 'europe', 6.8, '', 'Sunrise after 8am in winter, on CET'],
  ['barcelona', 'Barcelona', 'Spain', 'ES', 'Europe/Madrid', 41.387, 2.17, 'europe', 5.6],
  ['las-palmas', 'Las Palmas', 'Spain', 'ES', 'Atlantic/Canary', 28.124, -15.436, 'europe', 0.8, 'Canary Islands', 'Same clock as London'],
  ['paris', 'Paris', 'France', 'FR', 'Europe/Paris', 48.857, 2.352, 'europe', 11.1],
  ['marseille', 'Marseille', 'France', 'FR', 'Europe/Paris', 43.297, 5.381, 'europe', 0.87],
  ['brussels', 'Brussels', 'Belgium', 'BE', 'Europe/Brussels', 50.85, 4.352, 'europe', 1.2, '', 'CET heart of the EU'],
  ['amsterdam', 'Amsterdam', 'Netherlands', 'NL', 'Europe/Amsterdam', 52.37, 4.896, 'europe', 2.5],
  ['luxembourg', 'Luxembourg', 'Luxembourg', 'LU', 'Europe/Luxembourg', 49.612, 6.13, 'europe', 0.12],
  ['andorra-la-vella', 'Andorra la Vella', 'Andorra', 'AD', 'Europe/Andorra', 42.507, 1.521, 'europe', 0.02],
  ['gibraltar', 'Gibraltar', 'Gibraltar', 'GI', 'Europe/Gibraltar', 36.141, -5.351, 'europe', 0.03],
  ['zurich', 'Zürich', 'Switzerland', 'CH', 'Europe/Zurich', 47.377, 8.541, 'europe', 1.4],
  ['geneva', 'Geneva', 'Switzerland', 'CH', 'Europe/Zurich', 46.204, 6.143, 'europe', 0.5],
  ['milan', 'Milan', 'Italy', 'IT', 'Europe/Rome', 45.464, 9.19, 'europe', 3.1],
  ['rome', 'Rome', 'Italy', 'IT', 'Europe/Rome', 41.902, 12.496, 'europe', 4.3],
  ['naples', 'Naples', 'Italy', 'IT', 'Europe/Rome', 40.834, 14.252, 'europe', 3.1],
  ['vienna', 'Vienna', 'Austria', 'AT', 'Europe/Vienna', 48.208, 16.373, 'europe', 1.9],
  ['berlin', 'Berlin', 'Germany', 'DE', 'Europe/Berlin', 52.52, 13.405, 'europe', 3.6],
  ['munich', 'Munich', 'Germany', 'DE', 'Europe/Berlin', 48.135, 11.582, 'europe', 1.5, 'Bavaria'],
  ['frankfurt', 'Frankfurt', 'Germany', 'DE', 'Europe/Berlin', 50.111, 8.686, 'europe', 0.75],
  ['hamburg', 'Hamburg', 'Germany', 'DE', 'Europe/Berlin', 53.551, 9.994, 'europe', 1.9],
  ['copenhagen', 'Copenhagen', 'Denmark', 'DK', 'Europe/Copenhagen', 55.676, 12.568, 'europe', 1.4],
  ['torshavn', 'Tórshavn', 'Faroe Islands', 'FO', 'Atlantic/Faroe', 62.007, -6.79, 'europe', 0.02],
  ['oslo', 'Oslo', 'Norway', 'NO', 'Europe/Oslo', 59.913, 10.752, 'europe', 1.0],
  ['bergen', 'Bergen', 'Norway', 'NO', 'Europe/Oslo', 60.393, 5.325, 'europe', 0.29],
  ['longyearbyen', 'Longyearbyen', 'Norway', 'SJ', 'Arctic/Longyearbyen', 78.224, 15.668, 'europe', 0.002, 'Svalbard', 'Polar night in January, midnight sun in July'],
  ['stockholm', 'Stockholm', 'Sweden', 'SE', 'Europe/Stockholm', 59.329, 18.068, 'europe', 1.7],
  ['helsinki', 'Helsinki', 'Finland', 'FI', 'Europe/Helsinki', 60.17, 24.938, 'europe', 1.4],
  ['tallinn', 'Tallinn', 'Estonia', 'EE', 'Europe/Tallinn', 59.437, 24.754, 'europe', 0.45],
  ['riga', 'Riga', 'Latvia', 'LV', 'Europe/Riga', 56.949, 24.106, 'europe', 0.64],
  ['vilnius', 'Vilnius', 'Lithuania', 'LT', 'Europe/Vilnius', 54.687, 25.28, 'europe', 0.6],
  ['warsaw', 'Warsaw', 'Poland', 'PL', 'Europe/Warsaw', 52.23, 21.012, 'europe', 1.8],
  ['prague', 'Prague', 'Czechia', 'CZ', 'Europe/Prague', 50.075, 14.437, 'europe', 1.3],
  ['bratislava', 'Bratislava', 'Slovakia', 'SK', 'Europe/Bratislava', 48.148, 17.107, 'europe', 0.43],
  ['budapest', 'Budapest', 'Hungary', 'HU', 'Europe/Budapest', 47.498, 19.04, 'europe', 1.8],
  ['ljubljana', 'Ljubljana', 'Slovenia', 'SI', 'Europe/Ljubljana', 46.057, 14.505, 'europe', 0.3],
  ['zagreb', 'Zagreb', 'Croatia', 'HR', 'Europe/Zagreb', 45.815, 15.982, 'europe', 0.8],
  ['belgrade', 'Belgrade', 'Serbia', 'RS', 'Europe/Belgrade', 44.787, 20.457, 'europe', 1.7],
  ['sarajevo', 'Sarajevo', 'Bosnia & Herz.', 'BA', 'Europe/Sarajevo', 43.856, 18.413, 'europe', 0.4],
  ['skopje', 'Skopje', 'North Macedonia', 'MK', 'Europe/Skopje', 41.997, 21.429, 'europe', 0.6],
  ['tirana', 'Tirana', 'Albania', 'AL', 'Europe/Tirane', 41.328, 19.819, 'europe', 0.5],
  ['athens', 'Athens', 'Greece', 'GR', 'Europe/Athens', 37.984, 23.727, 'europe', 3.2],
  ['thessaloniki', 'Thessaloniki', 'Greece', 'GR', 'Europe/Athens', 40.64, 22.94, 'europe', 1.0],
  ['sofia', 'Sofia', 'Bulgaria', 'BG', 'Europe/Sofia', 42.698, 23.322, 'europe', 1.3],
  ['bucharest', 'Bucharest', 'Romania', 'RO', 'Europe/Bucharest', 44.427, 26.103, 'europe', 1.9],
  ['chisinau', 'Chișinău', 'Moldova', 'MD', 'Europe/Chisinau', 47.01, 28.864, 'europe', 0.8],
  ['kyiv', 'Kyiv', 'Ukraine', 'UA', 'Europe/Kiev', 50.45, 30.523, 'europe', 3.0],
  ['lviv', 'Lviv', 'Ukraine', 'UA', 'Europe/Kiev', 49.84, 24.03, 'europe', 0.73],
  ['minsk', 'Minsk', 'Belarus', 'BY', 'Europe/Minsk', 53.9, 27.567, 'europe', 2.0, '', 'Permanent UTC+3 since 2011'],
  ['valletta', 'Valletta', 'Malta', 'MT', 'Europe/Malta', 35.9, 14.515, 'europe', 0.06],
  ['reykjavik', 'Reykjavík', 'Iceland', 'IS', 'Atlantic/Reykjavik', 64.147, -21.943, 'europe', 0.23, '', 'UTC+0 forever, no DST'],
  ['moscow', 'Moscow', 'Russia', 'RU', 'Europe/Moscow', 55.755, 37.617, 'europe', 12.6],
  ['saint-petersburg', 'St Petersburg', 'Russia', 'RU', 'Europe/Moscow', 59.931, 30.361, 'europe', 5.6],
  ['sochi', 'Sochi', 'Russia', 'RU', 'Europe/Moscow', 43.603, 39.734, 'europe', 0.41],
  ['kaliningrad', 'Kaliningrad', 'Russia', 'RU', 'Europe/Kaliningrad', 54.71, 20.453, 'europe', 0.5, '', 'An hour of Russia inside the EU'],
  ['yekaterinburg', 'Yekaterinburg', 'Russia', 'RU', 'Asia/Yekaterinburg', 56.839, 60.613, 'europe', 1.5, '', 'Two hours east of Moscow'],
  ['chelyabinsk', 'Chelyabinsk', 'Russia', 'RU', 'Asia/Yekaterinburg', 55.154, 61.429, 'europe', 1.2],
  ['novosibirsk', 'Novosibirsk', 'Russia', 'RU', 'Asia/Novosibirsk', 55.008, 82.939, 'asia', 1.6],
  ['krasnoyarsk', 'Krasnoyarsk', 'Russia', 'RU', 'Asia/Krasnoyarsk', 56.011, 92.862, 'asia', 1.2],
  ['irkutsk', 'Irkutsk', 'Russia', 'RU', 'Asia/Irkutsk', 52.286, 104.305, 'asia', 0.6, '', 'Five hours east of Moscow'],
  ['yakutsk', 'Yakutsk', 'Russia', 'RU', 'Asia/Yakutsk', 62.035, 129.677, 'asia', 0.4, '', '−50 °C winters, UTC+9'],
  ['vladivostok', 'Vladivostok', 'Russia', 'RU', 'Asia/Vladivostok', 43.107, 131.884, 'asia', 0.6],
  ['khabarovsk', 'Khabarovsk', 'Russia', 'RU', 'Asia/Vladivostok', 48.482, 135.084, 'asia', 0.6, '', 'Two Russian cities, one clock, 770 km apart'],
  ['petropavlovsk', 'Petropavlovsk-Kamchatsky', 'Russia', 'RU', 'Asia/Kamchatka', 53.043, 158.642, 'asia', 0.18, '', 'Among the first cities into each new day'],

  // ── Middle East ──────────────────────────────────────────────────────────
  ['istanbul', 'Istanbul', 'Türkiye', 'TR', 'Europe/Istanbul', 41.008, 28.978, 'mideast', 15.9, '', 'One zone, two continents, no DST'],
  ['ankara', 'Ankara', 'Türkiye', 'TR', 'Europe/Istanbul', 39.933, 32.859, 'mideast', 5.8],
  ['izmir', 'İzmir', 'Türkiye', 'TR', 'Europe/Istanbul', 38.42, 27.14, 'mideast', 4.4],
  ['dubai', 'Dubai', 'United Arab Emirates', 'AE', 'Asia/Dubai', 25.205, 55.27, 'mideast', 3.6, '', 'UTC+4 all year, never on DST'],
  ['abu-dhabi', 'Abu Dhabi', 'United Arab Emirates', 'AE', 'Asia/Dubai', 24.454, 54.379, 'mideast', 1.5],
  ['riyadh', 'Riyadh', 'Saudi Arabia', 'SA', 'Asia/Riyadh', 24.711, 46.675, 'mideast', 7.7],
  ['jeddah', 'Jeddah', 'Saudi Arabia', 'SA', 'Asia/Riyadh', 21.486, 39.192, 'mideast', 4.7],
  ['doha', 'Doha', 'Qatar', 'QA', 'Asia/Qatar', 25.285, 51.531, 'mideast', 2.4],
  ['manama', 'Manama', 'Bahrain', 'BH', 'Asia/Bahrain', 26.223, 50.586, 'mideast', 0.2],
  ['kuwait-city', 'Kuwait City', 'Kuwait', 'KW', 'Asia/Kuwait', 29.376, 47.984, 'mideast', 3.1],
  ['baghdad', 'Baghdad', 'Iraq', 'IQ', 'Asia/Baghdad', 33.315, 44.366, 'mideast', 8.1],
  ['tehran', 'Tehran', 'Iran', 'IR', 'Asia/Tehran', 35.689, 51.389, 'mideast', 9.4, '', 'Quarter hour: UTC+3:30'],
  ['tabriz', 'Tabriz', 'Iran', 'IR', 'Asia/Tehran', 38.096, 46.274, 'mideast', 1.7],
  ['amman', 'Amman', 'Jordan', 'JO', 'Asia/Amman', 31.954, 35.945, 'mideast', 4.1, '', 'Permanent UTC+3 since 2022'],
  ['jerusalem', 'Jerusalem', 'Israel / Palestine', 'IL', 'Asia/Jerusalem', 31.769, 35.216, 'mideast', 1.1],
  ['tel-aviv', 'Tel Aviv', 'Israel', 'IL', 'Asia/Jerusalem', 32.085, 34.782, 'mideast', 1.5, '', 'The week starts on Sunday'],
  ['beirut', 'Beirut', 'Lebanon', 'LB', 'Asia/Beirut', 33.894, 35.502, 'mideast', 2.2],
  ['damascus', 'Damascus', 'Syria', 'SY', 'Asia/Damascus', 33.513, 36.292, 'mideast', 2.6],
  ['sanaa', "Sana'a", 'Yemen', 'YE', 'Asia/Aden', 15.369, 44.191, 'mideast', 3.0],
  ['muscat', 'Muscat', 'Oman', 'OM', 'Asia/Muscat', 23.588, 58.384, 'mideast', 1.7],
  ['nicosia', 'Nicosia', 'Cyprus', 'CY', 'Asia/Nicosia', 35.173, 33.365, 'mideast', 0.3],
  ['baku', 'Baku', 'Azerbaijan', 'AZ', 'Asia/Baku', 40.409, 49.868, 'mideast', 2.3, '', 'Caspian UTC+4'],
  ['tbilisi', 'Tbilisi', 'Georgia', 'GE', 'Asia/Tbilisi', 41.694, 44.802, 'mideast', 1.2],
  ['yerevan', 'Yerevan', 'Armenia', 'AM', 'Asia/Yerevan', 40.179, 44.499, 'mideast', 0.9],

  // ── Africa ───────────────────────────────────────────────────────────────
  ['cairo', 'Cairo', 'Egypt', 'EG', 'Africa/Cairo', 30.044, 31.236, 'africa', 22.1],
  ['alexandria', 'Alexandria', 'Egypt', 'EG', 'Africa/Cairo', 31.2, 29.919, 'africa', 5.5],
  ['khartoum', 'Khartoum', 'Sudan', 'SD', 'Africa/Khartoum', 15.501, 32.56, 'africa', 6.2, '', 'Moved to UTC+2 in 2017'],
  ['addis-ababa', 'Addis Ababa', 'Ethiopia', 'ET', 'Africa/Addis_Ababa', 9.02, 38.746, 'africa', 5.5, '', 'Ethiopian clocks read six hours behind'],
  ['asmara', 'Asmara', 'Eritrea', 'ER', 'Africa/Asmara', 15.323, 38.93, 'africa', 1.0],
  ['djibouti', 'Djibouti', 'Djibouti', 'DJ', 'Africa/Djibouti', 11.593, 43.148, 'africa', 0.6],
  ['mogadishu', 'Mogadishu', 'Somalia', 'SO', 'Africa/Mogadishu', 2.047, 45.318, 'africa', 2.6],
  ['nairobi', 'Nairobi', 'Kenya', 'KE', 'Africa/Nairobi', -1.286, 36.817, 'africa', 5.3],
  ['kampala', 'Kampala', 'Uganda', 'UG', 'Africa/Kampala', 0.348, 32.579, 'africa', 3.8],
  ['kigali', 'Kigali', 'Rwanda', 'RW', 'Africa/Kigali', -1.954, 30.061, 'africa', 1.7],
  ['dar-es-salaam', 'Dar es Salaam', 'Tanzania', 'TZ', 'Africa/Dar_es_Salaam', -6.792, 39.208, 'africa', 7.9],
  ['juba', 'Juba', 'South Sudan', 'SS', 'Africa/Juba', 4.852, 31.582, 'africa', 0.6],
  ['lusaka', 'Lusaka', 'Zambia', 'ZM', 'Africa/Lusaka', -15.415, 28.288, 'africa', 3.4],
  ['harare', 'Harare', 'Zimbabwe', 'ZW', 'Africa/Harare', -17.832, 31.049, 'africa', 3.1],
  ['lilongwe', 'Lilongwe', 'Malawi', 'MW', 'Africa/Blantyre', -13.983, 33.787, 'africa', 1.1],
  ['maputo', 'Maputo', 'Mozambique', 'MZ', 'Africa/Maputo', -25.969, 32.573, 'africa', 1.8],
  ['antananarivo', 'Antananarivo', 'Madagascar', 'MG', 'Indian/Antananarivo', -18.879, 47.507, 'africa', 3.0],
  ['port-louis', 'Port Louis', 'Mauritius', 'MU', 'Indian/Mauritius', -20.161, 57.502, 'africa', 0.6],
  ['victoria', 'Victoria', 'Seychelles', 'SC', 'Indian/Mahe', -4.616, 55.447, 'africa', 0.03],
  ['gaborone', 'Gaborone', 'Botswana', 'BW', 'Africa/Gaborone', -24.655, 25.909, 'africa', 0.5],
  ['windhoek', 'Windhoek', 'Namibia', 'NA', 'Africa/Windhoek', -22.561, 17.065, 'africa', 0.4, '', 'Shares UTC+2 with Cape Town'],
  ['johannesburg', 'Johannesburg', 'South Africa', 'ZA', 'Africa/Johannesburg', -26.205, 28.049, 'africa', 6.1],
  ['cape-town', 'Cape Town', 'South Africa', 'ZA', 'Africa/Johannesburg', -33.925, 18.424, 'africa', 4.8],
  ['durban', 'Durban', 'South Africa', 'ZA', 'Africa/Johannesburg', -29.858, 31.022, 'africa', 4.1],
  ['casablanca', 'Casablanca', 'Morocco', 'MA', 'Africa/Casablanca', 33.573, -7.59, 'africa', 4.0, '', 'Steps back an hour during Ramadan'],
  ['rabat', 'Rabat', 'Morocco', 'MA', 'Africa/Casablanca', 34.021, -6.841, 'africa', 2.1],
  ['algiers', 'Algiers', 'Algeria', 'DZ', 'Africa/Algiers', 36.754, 3.059, 'africa', 3.4],
  ['tunis', 'Tunis', 'Tunisia', 'TN', 'Africa/Tunis', 36.807, 10.182, 'africa', 3.0],
  ['tripoli', 'Tripoli', 'Libya', 'LY', 'Africa/Tripoli', 32.887, 13.191, 'africa', 2.7],
  ['lagos', 'Lagos', 'Nigeria', 'NG', 'Africa/Lagos', 6.524, -3.379, 'africa', 16.5, '', 'West Africa’s biggest city'],
  ['abuja', 'Abuja', 'Nigeria', 'NG', 'Africa/Lagos', 9.077, 7.398, 'africa', 3.6],
  ['kinshasa', 'Kinshasa', 'DR Congo', 'CD', 'Africa/Kinshasa', -4.442, 15.266, 'africa', 19.3, '', 'One country, two zones'],
  ['lubumbashi', 'Lubumbashi', 'DR Congo', 'CD', 'Africa/Lubumbashi', -11.661, 27.48, 'africa', 2.8, '', 'An hour ahead of its own capital'],
  ['accra', 'Accra', 'Ghana', 'GH', 'Africa/Accra', 5.604, -0.187, 'africa', 2.7],
  ['lome', 'Lomé', 'Togo', 'TG', 'Africa/Lome', 6.128, 1.222, 'africa', 1.8],
  ['porto-novo', 'Porto-Novo', 'Benin', 'BJ', 'Africa/Porto-Novo', 6.497, 2.604, 'africa', 0.26],
  ['abidjan', 'Abidjan', 'Côte d’Ivoire', 'CI', 'Africa/Abidjan', 5.36, -4.008, 'africa', 6.3],
  ['bamako', 'Bamako', 'Mali', 'ML', 'Africa/Bamako', 12.639, -8.003, 'africa', 2.9],
  ['ouagadougou', 'Ouagadougou', 'Burkina Faso', 'BF', 'Africa/Ouagadougou', 12.368, -1.527, 'africa', 3.1],
  ['niamey', 'Niamey', 'Niger', 'NE', 'Africa/Niamey', 13.513, 2.109, 'africa', 1.3],
  ['conakry', 'Conakry', 'Guinea', 'GN', 'Africa/Conakry', 9.642, -13.578, 'africa', 1.9],
  ['freetown', 'Freetown', 'Sierra Leone', 'SL', 'Africa/Freetown', 8.461, -13.232, 'africa', 1.2],
  ['monrovia', 'Monrovia', 'Liberia', 'LR', 'Africa/Monrovia', 6.316, -10.808, 'africa', 1.2],
  ['dakar', 'Dakar', 'Senegal', 'SN', 'Africa/Dakar', 14.716, -17.468, 'africa', 3.9],
  ['banjul', 'Banjul', 'Gambia', 'GM', 'Africa/Banjul', 13.455, -16.58, 'africa', 0.35],
  ['bissau', 'Bissau', 'Guinea-Bissau', 'GW', 'Africa/Bissau', 11.864, -15.587, 'africa', 0.4],
  ['praia', 'Praia', 'Cabo Verde', 'CV', 'Atlantic/Cape_Verde', 14.933, -23.513, 'africa', 0.15, '', 'UTC−1 out in the Atlantic'],
  ['luanda', 'Luanda', 'Angola', 'AO', 'Africa/Luanda', -8.812, 13.233, 'africa', 3.6],

  // ── Asia ─────────────────────────────────────────────────────────────────
  ['ashgabat', 'Ashgabat', 'Turkmenistan', 'TM', 'Asia/Ashgabat', 37.96, 58.326, 'asia', 0.7],
  ['bishkek', 'Bishkek', 'Kyrgyzstan', 'KG', 'Asia/Bishkek', 42.875, 74.569, 'asia', 1.1, '', 'UTC+6, a step east of Almaty'],
  ['dushanbe', 'Dushanbe', 'Tajikistan', 'TJ', 'Asia/Dushanbe', 38.574, 68.781, 'asia', 0.8],
  ['kabul', 'Kabul', 'Afghanistan', 'AF', 'Asia/Kabul', 34.555, 69.207, 'asia', 4.6, '', 'UTC+4:30 — a half-hour zone'],
  ['islamabad', 'Islamabad', 'Pakistan', 'PK', 'Asia/Karachi', 33.684, 73.048, 'asia', 1.2],
  ['karachi', 'Karachi', 'Pakistan', 'PK', 'Asia/Karachi', 24.861, 67.001, 'asia', 17.1],
  ['lahore', 'Lahore', 'Pakistan', 'PK', 'Asia/Karachi', 31.52, 74.354, 'asia', 14.0],
  ['new-delhi', 'New Delhi', 'India', 'IN', 'Asia/Kolkata', 28.614, 77.209, 'asia', 33.8, 'Delhi', 'UTC+5:30, India-wide'],
  ['mumbai', 'Mumbai', 'India', 'IN', 'Asia/Kolkata', 19.076, 72.877, 'asia', 21.7, 'Maharashtra'],
  ['kolkata', 'Kolkata', 'India', 'IN', 'Asia/Kolkata', 22.573, 88.363, 'asia', 15.3, 'West Bengal'],
  ['chennai', 'Chennai', 'India', 'IN', 'Asia/Kolkata', 13.083, 80.27, 'asia', 12.0, 'Tamil Nadu'],
  ['bengaluru', 'Bengaluru', 'India', 'IN', 'Asia/Kolkata', 12.972, 77.598, 'asia', 14.8, 'Karnataka'],
  ['hyderabad', 'Hyderabad', 'India', 'IN', 'Asia/Kolkata', 17.385, 78.487, 'asia', 10.5, 'Telangana'],
  ['ahmedabad', 'Ahmedabad', 'India', 'IN', 'Asia/Kolkata', 23.023, 72.571, 'asia', 8.8, 'Gujarat'],
  ['guwahati', 'Guwahati', 'India', 'IN', 'Asia/Kolkata', 26.144, 91.736, 'asia', 1.7, 'Assam', 'India’s east shares one clock'],
  ['thimphu', 'Thimphu', 'Bhutan', 'BT', 'Asia/Thimphu', 27.472, 89.639, 'asia', 0.12],
  ['kathmandu', 'Kathmandu', 'Nepal', 'NP', 'Asia/Kathmandu', 27.717, 85.324, 'asia', 1.4, '', 'UTC+5:45 — fifteen minutes odd'],
  ['colombo', 'Colombo', 'Sri Lanka', 'LK', 'Asia/Colombo', 6.927, 79.861, 'asia', 2.3],
  ['male', 'Malé', 'Maldives', 'MV', 'Indian/Maldives', 4.176, 73.509, 'asia', 0.21],
  ['dhaka', 'Dhaka', 'Bangladesh', 'BD', 'Asia/Dhaka', 23.81, 90.412, 'asia', 23.8],
  ['yangon', 'Yangon', 'Myanmar', 'MM', 'Asia/Yangon', 16.866, 96.205, 'asia', 5.6, '', 'UTC+6:30'],
  ['bangkok', 'Bangkok', 'Thailand', 'TH', 'Asia/Bangkok', 13.756, 100.502, 'asia', 11.1, '', 'Indochina runs on UTC+7'],
  ['chiang-mai', 'Chiang Mai', 'Thailand', 'TH', 'Asia/Bangkok', 18.788, 98.985, 'asia', 1.3],
  ['phnom-penh', 'Phnom Penh', 'Cambodia', 'KH', 'Asia/Phnom_Penh', 11.556, 104.928, 'asia', 2.3],
  ['vientiane', 'Vientiane', 'Laos', 'LA', 'Asia/Vientiane', 17.975, 102.633, 'asia', 1.0],
  ['hanoi', 'Hanoi', 'Vietnam', 'VN', 'Asia/Bangkok', 21.028, 105.854, 'asia', 8.3],
  ['ho-chi-minh-city', 'Ho Chi Minh City', 'Vietnam', 'VN', 'Asia/Ho_Chi_Minh', 10.788, 106.658, 'asia', 9.4],
  ['singapore', 'Singapore', 'Singapore', 'SG', 'Asia/Singapore', 1.352, 103.82, 'asia', 6.0, '', 'Its clock runs over an hour ahead of its longitude'],
  ['kuala-lumpur', 'Kuala Lumpur', 'Malaysia', 'MY', 'Asia/Kuala_Lumpur', 3.139, 101.687, 'asia', 8.2],
  ['penang', 'George Town', 'Malaysia', 'MY', 'Asia/Kuala_Lumpur', 5.414, 100.328, 'asia', 0.25, 'Penang'],
  ['kota-kinabalu', 'Kota Kinabalu', 'Malaysia', 'MY', 'Asia/Kuching', 5.98, 116.074, 'asia', 0.5, 'Sabah'],
  ['bandar-seri-begawan', 'Bandar Seri Begawan', 'Brunei', 'BN', 'Asia/Brunei', 4.903, 114.94, 'asia', 0.1],
  ['jakarta', 'Jakarta', 'Indonesia', 'ID', 'Asia/Jakarta', -6.2, 106.816, 'asia', 11.2, '', 'Java sits at UTC+7'],
  ['surabaya', 'Surabaya', 'Indonesia', 'ID', 'Asia/Jakarta', -7.257, 112.752, 'asia', 3.0],
  ['denpasar', 'Denpasar', 'Indonesia', 'ID', 'Asia/Makassar', -8.67, 115.213, 'asia', 0.9, 'Bali', 'An hour ahead of Java'],
  ['makassar', 'Makassar', 'Indonesia', 'ID', 'Asia/Makassar', -5.148, 119.417, 'asia', 1.9],
  ['jayapura', 'Jayapura', 'Indonesia', 'ID', 'Asia/Jayapura', -2.533, 140.717, 'asia', 0.4, '', 'UTC+9 — same clock as Tokyo'],
  ['dili', 'Dili', 'Timor-Leste', 'TL', 'Asia/Dili', -8.557, 125.573, 'asia', 0.28],
  ['manila', 'Manila', 'Philippines', 'PH', 'Asia/Manila', 14.599, 120.984, 'asia', 14.2],
  ['cebu', 'Cebu City', 'Philippines', 'PH', 'Asia/Manila', 10.315, 123.885, 'asia', 0.95],
  ['hong-kong', 'Hong Kong', 'China', 'HK', 'Asia/Hong_Kong', 22.319, 114.157, 'asia', 7.5],
  ['macau', 'Macau', 'China', 'MO', 'Asia/Macau', 22.199, 113.543, 'asia', 0.69],
  ['taipei', 'Taipei', 'Taiwan', 'TW', 'Asia/Taipei', 25.033, 121.565, 'asia', 2.9],
  ['shanghai', 'Shanghai', 'China', 'CN', 'Asia/Shanghai', 31.23, 121.474, 'asia', 29.9, '', 'One clock for 1.4 billion people'],
  ['beijing', 'Beijing', 'China', 'CN', 'Asia/Shanghai', 39.904, 116.407, 'asia', 21.9],
  ['guangzhou', 'Guangzhou', 'China', 'CN', 'Asia/Shanghai', 23.129, 113.264, 'asia', 15.3],
  ['shenzhen', 'Shenzhen', 'China', 'CN', 'Asia/Shanghai', 22.543, 114.058, 'asia', 13.0, '', 'Same clock as Shanghai, 1,200 km away'],
  ['chengdu', 'Chengdu', 'China', 'CN', 'Asia/Shanghai', 30.573, 104.067, 'asia', 21.0],
  ['xian', "Xi'an", 'China', 'CN', 'Asia/Shanghai', 34.341, 108.94, 'asia', 13.0],
  ['urumqi', 'Ürümqi', 'China', 'CN', 'Asia/Urumqi', 43.826, 87.617, 'asia', 4.4, '', 'Sunrise two hours later than Beijing, same clock'],
  ['lhasa', 'Lhasa', 'China', 'CN', 'Asia/Shanghai', 29.652, 91.117, 'asia', 0.6, 'Tibet'],
  ['seoul', 'Seoul', 'South Korea', 'KR', 'Asia/Seoul', 37.567, 126.978, 'asia', 9.5, '', 'UTC+9, no DST since 1988'],
  ['busan', 'Busan', 'South Korea', 'KR', 'Asia/Seoul', 35.18, 129.075, 'asia', 3.4],
  ['jeju', 'Jeju City', 'South Korea', 'KR', 'Asia/Seoul', 33.498, 126.531, 'asia', 0.49],
  ['pyongyang', 'Pyongyang', 'North Korea', 'KP', 'Asia/Pyongyang', 39.04, 125.76, 'asia', 3.2, '', 'Back to UTC+9 in 2018'],
  ['tokyo', 'Tokyo', 'Japan', 'JP', 'Asia/Tokyo', 35.689, 139.692, 'asia', 37.8, '', 'The largest metro on Earth'],
  ['osaka', 'Osaka', 'Japan', 'JP', 'Asia/Tokyo', 34.694, 135.502, 'asia', 19.0],
  ['sapporo', 'Sapporo', 'Japan', 'JP', 'Asia/Tokyo', 43.064, 141.347, 'asia', 2.6, 'Hokkaido'],
  ['fukuoka', 'Fukuoka', 'Japan', 'JP', 'Asia/Tokyo', 33.59, 130.402, 'asia', 2.6, 'Kyushu'],
  ['naha', 'Naha', 'Japan', 'JP', 'Asia/Tokyo', 26.212, 127.681, 'asia', 0.5, 'Okinawa'],
  ['ulaanbaatar', 'Ulaanbaatar', 'Mongolia', 'MN', 'Asia/Ulaanbaatar', 47.886, 106.905, 'asia', 1.6],
  ['almaty', 'Almaty', 'Kazakhstan', 'KZ', 'Asia/Almaty', 43.222, 76.895, 'asia', 2.1, '', 'Kazakhstan went single-zone in 2024'],
  ['astana', 'Astana', 'Kazakhstan', 'KZ', 'Asia/Almaty', 51.169, 71.449, 'asia', 1.4],
  ['aktau', 'Aktau', 'Kazakhstan', 'KZ', 'Asia/Aqtau', 43.65, 51.199, 'asia', 0.21, '', 'Same clock as Almaty since 2024'],
  ['tashkent', 'Tashkent', 'Uzbekistan', 'UZ', 'Asia/Tashkent', 41.299, 69.24, 'asia', 2.5, '', 'UTC+5 since 1992'],
  ['samarkand', 'Samarkand', 'Uzbekistan', 'UZ', 'Asia/Samarkand', 39.654, 66.959, 'asia', 0.6],

  // ── Oceania & Pacific ────────────────────────────────────────────────────
  ['sydney', 'Sydney', 'Australia', 'AU', 'Australia/Sydney', -33.865, 151.209, 'oceania', 5.4, '', 'Two hours ahead of Tokyo in its summer'],
  ['melbourne', 'Melbourne', 'Australia', 'AU', 'Australia/Melbourne', -37.814, 144.963, 'oceania', 5.3],
  ['canberra', 'Canberra', 'Australia', 'AU', 'Australia/Sydney', -35.281, 149.13, 'oceania', 0.47],
  ['brisbane', 'Brisbane', 'Australia', 'AU', 'Australia/Brisbane', -27.47, 153.026, 'oceania', 2.6, '', 'Queensland keeps UTC+10 all year'],
  ['gold-coast', 'Gold Coast', 'Australia', 'AU', 'Australia/Brisbane', -28.017, 153.4, 'oceania', 0.71],
  ['perth', 'Perth', 'Australia', 'AU', 'Australia/Perth', -31.95, 115.861, 'oceania', 2.2, '', 'Three hours from Sydney, one from Jakarta'],
  ['adelaide', 'Adelaide', 'Australia', 'AU', 'Australia/Adelaide', -34.928, 138.601, 'oceania', 1.4, '', 'UTC+9:30, +10:30 in summer'],
  ['darwin', 'Darwin', 'Australia', 'AU', 'Australia/Darwin', -12.463, 130.844, 'oceania', 0.15, 'NT', 'Tropical UTC+9:30 with no DST'],
  ['hobart', 'Hobart', 'Australia', 'AU', 'Australia/Hobart', -42.882, 147.327, 'oceania', 0.25, 'Tasmania'],
  ['broken-hill', 'Broken Hill', 'Australia', 'AU', 'Australia/Broken_Hill', -31.96, 141.454, 'oceania', 0.017, 'New South Wales', 'Its own clock, 30 min from Sydney'],
  ['eucla', 'Eucla', 'Australia', 'AU', 'Australia/Eucla', -31.427, 128.985, 'oceania', 0.001, 'Nullarbor Plain', 'UTC+8:45 — the quarter-hour zone'],
  ['lord-howe', 'Lord Howe Island', 'Australia', 'AU', 'Australia/Lord_Howe', -31.556, 159.087, 'oceania', 0.002, '', 'Shifts by half an hour, not one'],
  ['auckland', 'Auckland', 'New Zealand', 'NZ', 'Pacific/Auckland', -36.848, 174.763, 'oceania', 1.7],
  ['wellington', 'Wellington', 'New Zealand', 'NZ', 'Pacific/Auckland', -41.286, 174.775, 'oceania', 0.21, '', 'The world’s southernmost capital'],
  ['christchurch', 'Christchurch', 'New Zealand', 'NZ', 'Pacific/Auckland', -43.532, 172.636, 'oceania', 0.4],
  ['chatham-islands', 'Chatham Islands', 'New Zealand', 'NZ', 'Pacific/Chatham', -43.95, -176.567, 'oceania', 0.001, '', 'UTC+12:45, +13:45 in summer'],
  ['norfolk-island', 'Kingston', 'Norfolk Island', 'NF', 'Pacific/Norfolk', -29.04, 167.954, 'oceania', 0.02],
  ['suva', 'Suva', 'Fiji', 'FJ', 'Pacific/Fiji', -18.124, 178.45, 'oceania', 0.1],
  ['port-moresby', 'Port Moresby', 'Papua New Guinea', 'PG', 'Pacific/Port_Moresby', -9.463, 147.18, 'oceania', 0.4],
  ['noumea', 'Nouméa', 'New Caledonia', 'NC', 'Pacific/Noumea', -22.276, 166.457, 'oceania', 0.19],
  ['honiara', 'Honiara', 'Solomon Islands', 'SB', 'Pacific/Guadalcanal', -9.433, 159.95, 'oceania', 0.1],
  ['port-vila', 'Port Vila', 'Vanuatu', 'VU', 'Pacific/Efate', -17.733, 168.327, 'oceania', 0.05],
  ['hagatna', 'Hagåtña', 'Guam', 'GU', 'Pacific/Guam', 13.475, 144.749, 'oceania', 0.04, '', 'UTC+10 with no DST at all'],
  ['saipan', 'Saipan', 'N. Mariana Is.', 'MP', 'Pacific/Saipan', 15.178, 145.75, 'oceania', 0.05],
  ['wake-island', 'Wake Island', 'United States', 'UM', 'Pacific/Wake', 19.28, 166.645, 'oceania', 0.0001, '', 'UTC+12 with no residents'],
  ['tarawa', 'South Tarawa', 'Kiribati', 'KI', 'Pacific/Tarawa', 1.451, 172.98, 'oceania', 0.08],
  ['kiritimati', 'Kiritimati', 'Kiribati', 'KI', 'Pacific/Kiritimati', 1.873, -157.433, 'oceania', 0.007, 'Line Islands', 'UTC+14: first place to reach a new day'],
  ['funafuti', 'Funafuti', 'Tuvalu', 'TV', 'Pacific/Funafuti', -8.52, 179.198, 'oceania', 0.01],
  ['majuro', 'Majuro', 'Marshall Islands', 'MH', 'Pacific/Majuro', 7.09, 171.38, 'oceania', 0.03],
  ['palikir', 'Palikir', 'Micronesia', 'FM', 'Pacific/Ponape', 6.965, 158.152, 'oceania', 0.005],
  ['ngerulmud', 'Ngerulmud', 'Palau', 'PW', 'Pacific/Palau', 7.5, 134.62, 'oceania', 0.0002],
  ['yaren', 'Yaren', 'Nauru', 'NR', 'Pacific/Nauru', -0.547, 166.921, 'oceania', 0.007],
  ['apia', 'Apia', 'Samoa', 'WS', 'Pacific/Apia', -13.833, -171.75, 'oceania', 0.04, '', 'Jumped the date line in 2011'],
  ['pago-pago', 'Pago Pago', 'American Samoa', 'AS', 'Pacific/Pago_Pago', -14.276, -170.702, 'oceania', 0.05, '', 'Same clock as Apia, a day behind'],
  ['nukualofa', "Nukuʻalofa", 'Tonga', 'TO', 'Pacific/Tongatapu', -21.139, -175.208, 'oceania', 0.02],
  ['rarotonga', 'Avarua', 'Cook Islands', 'CK', 'Pacific/Rarotonga', -21.209, -159.776, 'oceania', 0.01],
  ['papeete', 'Papeete', 'French Polynesia', 'PF', 'Pacific/Tahiti', -17.544, -149.566, 'oceania', 0.14],

  // ── Antarctic ────────────────────────────────────────────────────────────
  ['mcmurdo', 'McMurdo Station', 'Antarctica', 'AQ', 'Pacific/Auckland', -77.846, 166.669, 'antarctic', 0.001, 'Ross Island', 'Keeps New Zealand time'],
  ['troll', 'Troll Station', 'Antarctica', 'AQ', 'Antarctica/Troll', -72.01, 2.53, 'antarctic', 0.0001, 'Queen Maud Land', 'UTC+0 in winter, UTC+2 in summer'],
  ['palmer', 'Palmer Station', 'Antarctica', 'AQ', 'Antarctica/Palmer', -64.774, -64.053, 'antarctic', 0.0001, 'Anvers Island', 'Follows Chilean time'],
]

export const CITIES: City[] = ROWS.map((row) => {
  const [id, name, country, cc, tz, lat, lng, region, popM, admin, note] = row
  return {
    id,
    name,
    country,
    cc,
    tz,
    lat,
    lng,
    region,
    popM,
    ...(admin ? { admin } : {}),
    ...(note ? { note } : {}),
  }
})

const byIdMap = new Map(CITIES.map((c) => [c.id, c]))

export function cityById(id: string): City | undefined {
  return byIdMap.get(id)
}

/** Cities that share a zone — used to label every zone with real places. */
export const CITIES_BY_ZONE: Record<string, City[]> = (() => {
  const map: Record<string, City[]> = {}
  for (const c of CITIES) (map[c.tz] ??= []).push(c)
  for (const list of Object.values(map)) list.sort((a, b) => b.popM - a.popM)
  return map
})()

/**
 * What a viewer most likely wants on their board on day one: a spread of the
 * planet, not eleven European capitals.
 */
export const STARTER_CITIES = [
  'new-york',
  'london',
  'tokyo',
  'sydney',
  'dubai',
  'los-angeles',
  'mumbai',
]
