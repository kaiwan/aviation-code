"use strict";

/*
 * Local airport dataset, keyed by IATA code.
 *   name : human-readable name
 *   icao : 4-letter ICAO location indicator (current / "modern" code)
 *   tz   : IANA timezone (for zone-based local time)
 *   lon  : longitude in decimal degrees, East positive / West negative
 *          (used to compute Local Mean Time — LMT)
 *
 * Bundled locally on purpose: the app makes no network calls (strict CSP,
 * no third-party data sources), so airport data ships as a static asset.
 * Curated set of major international airports — not exhaustive. Longitudes are
 * airport-/city-level, which is ample for LMT (1° ~= 4 minutes of time).
 */

const AIRPORTS = Object.freeze({
  // North America — USA
  ATL: { name: "Atlanta", icao: "KATL", tz: "America/New_York", lon: -84.43 },
  JFK: { name: "New York – John F. Kennedy", icao: "KJFK", tz: "America/New_York", lon: -73.78 },
  EWR: { name: "Newark Liberty", icao: "KEWR", tz: "America/New_York", lon: -74.17 },
  LGA: { name: "New York – LaGuardia", icao: "KLGA", tz: "America/New_York", lon: -73.87 },
  BOS: { name: "Boston Logan", icao: "KBOS", tz: "America/New_York", lon: -71.01 },
  PHL: { name: "Philadelphia", icao: "KPHL", tz: "America/New_York", lon: -75.24 },
  DCA: { name: "Washington Reagan", icao: "KDCA", tz: "America/New_York", lon: -77.04 },
  IAD: { name: "Washington Dulles", icao: "KIAD", tz: "America/New_York", lon: -77.46 },
  MIA: { name: "Miami", icao: "KMIA", tz: "America/New_York", lon: -80.29 },
  MCO: { name: "Orlando", icao: "KMCO", tz: "America/New_York", lon: -81.31 },
  CLT: { name: "Charlotte", icao: "KCLT", tz: "America/New_York", lon: -80.94 },
  DTW: { name: "Detroit", icao: "KDTW", tz: "America/Detroit", lon: -83.35 },
  ORD: { name: "Chicago O'Hare", icao: "KORD", tz: "America/Chicago", lon: -87.90 },
  MDW: { name: "Chicago Midway", icao: "KMDW", tz: "America/Chicago", lon: -87.75 },
  DFW: { name: "Dallas/Fort Worth", icao: "KDFW", tz: "America/Chicago", lon: -97.04 },
  IAH: { name: "Houston Intercontinental", icao: "KIAH", tz: "America/Chicago", lon: -95.34 },
  MSP: { name: "Minneapolis/St. Paul", icao: "KMSP", tz: "America/Chicago", lon: -93.22 },
  DEN: { name: "Denver", icao: "KDEN", tz: "America/Denver", lon: -104.67 },
  SLC: { name: "Salt Lake City", icao: "KSLC", tz: "America/Denver", lon: -111.98 },
  PHX: { name: "Phoenix Sky Harbor", icao: "KPHX", tz: "America/Phoenix", lon: -112.01 },
  LAX: { name: "Los Angeles", icao: "KLAX", tz: "America/Los_Angeles", lon: -118.41 },
  SFO: { name: "San Francisco", icao: "KSFO", tz: "America/Los_Angeles", lon: -122.38 },
  SAN: { name: "San Diego", icao: "KSAN", tz: "America/Los_Angeles", lon: -117.19 },
  SEA: { name: "Seattle–Tacoma", icao: "KSEA", tz: "America/Los_Angeles", lon: -122.31 },
  LAS: { name: "Las Vegas Harry Reid", icao: "KLAS", tz: "America/Los_Angeles", lon: -115.15 },
  PDX: { name: "Portland", icao: "KPDX", tz: "America/Los_Angeles", lon: -122.60 },
  HNL: { name: "Honolulu", icao: "PHNL", tz: "Pacific/Honolulu", lon: -157.92 },
  ANC: { name: "Anchorage", icao: "PANC", tz: "America/Anchorage", lon: -149.99 },

  // North America — Canada / Mexico / Central America
  YYZ: { name: "Toronto Pearson", icao: "CYYZ", tz: "America/Toronto", lon: -79.63 },
  YUL: { name: "Montréal–Trudeau", icao: "CYUL", tz: "America/Toronto", lon: -73.74 },
  YOW: { name: "Ottawa", icao: "CYOW", tz: "America/Toronto", lon: -75.67 },
  YVR: { name: "Vancouver", icao: "CYVR", tz: "America/Vancouver", lon: -123.18 },
  YYC: { name: "Calgary", icao: "CYYC", tz: "America/Edmonton", lon: -114.02 },
  YEG: { name: "Edmonton", icao: "CYEG", tz: "America/Edmonton", lon: -113.58 },
  MEX: { name: "Mexico City", icao: "MMMX", tz: "America/Mexico_City", lon: -99.07 },
  CUN: { name: "Cancún", icao: "MMUN", tz: "America/Cancun", lon: -86.87 },
  GDL: { name: "Guadalajara", icao: "MMGL", tz: "America/Mexico_City", lon: -103.31 },
  PTY: { name: "Panama City Tocumen", icao: "MPTO", tz: "America/Panama", lon: -79.38 },
  SJO: { name: "San José (Costa Rica)", icao: "MROC", tz: "America/Costa_Rica", lon: -84.20 },

  // South America
  GRU: { name: "São Paulo Guarulhos", icao: "SBGR", tz: "America/Sao_Paulo", lon: -46.47 },
  GIG: { name: "Rio de Janeiro Galeão", icao: "SBGL", tz: "America/Sao_Paulo", lon: -43.25 },
  BSB: { name: "Brasília", icao: "SBBR", tz: "America/Sao_Paulo", lon: -47.92 },
  EZE: { name: "Buenos Aires Ezeiza", icao: "SAEZ", tz: "America/Argentina/Buenos_Aires", lon: -58.54 },
  SCL: { name: "Santiago", icao: "SCEL", tz: "America/Santiago", lon: -70.79 },
  BOG: { name: "Bogotá", icao: "SKBO", tz: "America/Bogota", lon: -74.15 },
  LIM: { name: "Lima", icao: "SPJC", tz: "America/Lima", lon: -77.11 },
  UIO: { name: "Quito", icao: "SEQM", tz: "America/Guayaquil", lon: -78.36 },

  // Europe — UK / Ireland
  LHR: { name: "London Heathrow", icao: "EGLL", tz: "Europe/London", lon: -0.46 },
  LGW: { name: "London Gatwick", icao: "EGKK", tz: "Europe/London", lon: -0.18 },
  STN: { name: "London Stansted", icao: "EGSS", tz: "Europe/London", lon: 0.24 },
  LTN: { name: "London Luton", icao: "EGGW", tz: "Europe/London", lon: -0.37 },
  MAN: { name: "Manchester", icao: "EGCC", tz: "Europe/London", lon: -2.27 },
  EDI: { name: "Edinburgh", icao: "EGPH", tz: "Europe/London", lon: -3.37 },
  DUB: { name: "Dublin", icao: "EIDW", tz: "Europe/Dublin", lon: -6.27 },

  // Europe — Western / Central
  CDG: { name: "Paris Charles de Gaulle", icao: "LFPG", tz: "Europe/Paris", lon: 2.55 },
  ORY: { name: "Paris Orly", icao: "LFPO", tz: "Europe/Paris", lon: 2.36 },
  AMS: { name: "Amsterdam Schiphol", icao: "EHAM", tz: "Europe/Amsterdam", lon: 4.76 },
  BRU: { name: "Brussels", icao: "EBBR", tz: "Europe/Brussels", lon: 4.48 },
  FRA: { name: "Frankfurt", icao: "EDDF", tz: "Europe/Berlin", lon: 8.57 },
  MUC: { name: "Munich", icao: "EDDM", tz: "Europe/Berlin", lon: 11.79 },
  BER: { name: "Berlin Brandenburg", icao: "EDDB", tz: "Europe/Berlin", lon: 13.50 },
  DUS: { name: "Düsseldorf", icao: "EDDL", tz: "Europe/Berlin", lon: 6.77 },
  HAM: { name: "Hamburg", icao: "EDDH", tz: "Europe/Berlin", lon: 10.00 },
  ZRH: { name: "Zürich", icao: "LSZH", tz: "Europe/Zurich", lon: 8.55 },
  GVA: { name: "Geneva", icao: "LSGG", tz: "Europe/Zurich", lon: 6.11 },
  VIE: { name: "Vienna", icao: "LOWW", tz: "Europe/Vienna", lon: 16.57 },
  LUX: { name: "Luxembourg", icao: "ELLX", tz: "Europe/Luxembourg", lon: 6.20 },

  // Europe — Southern
  MAD: { name: "Madrid Barajas", icao: "LEMD", tz: "Europe/Madrid", lon: -3.57 },
  BCN: { name: "Barcelona", icao: "LEBL", tz: "Europe/Madrid", lon: 2.08 },
  LIS: { name: "Lisbon", icao: "LPPT", tz: "Europe/Lisbon", lon: -9.14 },
  OPO: { name: "Porto", icao: "LPPR", tz: "Europe/Lisbon", lon: -8.68 },
  FCO: { name: "Rome Fiumicino", icao: "LIRF", tz: "Europe/Rome", lon: 12.25 },
  MXP: { name: "Milan Malpensa", icao: "LIMC", tz: "Europe/Rome", lon: 8.72 },
  VCE: { name: "Venice", icao: "LIPZ", tz: "Europe/Rome", lon: 12.35 },
  NAP: { name: "Naples", icao: "LIRN", tz: "Europe/Rome", lon: 14.29 },
  ATH: { name: "Athens", icao: "LGAV", tz: "Europe/Athens", lon: 23.95 },

  // Europe — Nordic / Eastern
  CPH: { name: "Copenhagen", icao: "EKCH", tz: "Europe/Copenhagen", lon: 12.65 },
  ARN: { name: "Stockholm Arlanda", icao: "ESSA", tz: "Europe/Stockholm", lon: 17.92 },
  OSL: { name: "Oslo", icao: "ENGM", tz: "Europe/Oslo", lon: 11.10 },
  HEL: { name: "Helsinki", icao: "EFHK", tz: "Europe/Helsinki", lon: 24.96 },
  KEF: { name: "Reykjavík Keflavík", icao: "BIKF", tz: "Atlantic/Reykjavik", lon: -22.61 },
  WAW: { name: "Warsaw Chopin", icao: "EPWA", tz: "Europe/Warsaw", lon: 20.97 },
  PRG: { name: "Prague", icao: "LKPR", tz: "Europe/Prague", lon: 14.26 },
  BUD: { name: "Budapest", icao: "LHBP", tz: "Europe/Budapest", lon: 19.26 },
  IST: { name: "Istanbul", icao: "LTFM", tz: "Europe/Istanbul", lon: 28.74 },
  SAW: { name: "Istanbul Sabiha Gökçen", icao: "LTFJ", tz: "Europe/Istanbul", lon: 29.31 },
  SVO: { name: "Moscow Sheremetyevo", icao: "UUEE", tz: "Europe/Moscow", lon: 37.41 },
  DME: { name: "Moscow Domodedovo", icao: "UUDD", tz: "Europe/Moscow", lon: 37.91 },
  LED: { name: "St. Petersburg Pulkovo", icao: "ULLI", tz: "Europe/Moscow", lon: 30.26 },

  // Middle East
  DXB: { name: "Dubai", icao: "OMDB", tz: "Asia/Dubai", lon: 55.36 },
  AUH: { name: "Abu Dhabi", icao: "OMAA", tz: "Asia/Dubai", lon: 54.65 },
  DOH: { name: "Doha Hamad", icao: "OTHH", tz: "Asia/Qatar", lon: 51.61 },
  RUH: { name: "Riyadh", icao: "OERK", tz: "Asia/Riyadh", lon: 46.70 },
  JED: { name: "Jeddah", icao: "OEJN", tz: "Asia/Riyadh", lon: 39.16 },
  KWI: { name: "Kuwait", icao: "OKKK", tz: "Asia/Kuwait", lon: 47.97 },
  BAH: { name: "Bahrain", icao: "OBBI", tz: "Asia/Bahrain", lon: 50.63 },
  MCT: { name: "Muscat", icao: "OOMS", tz: "Asia/Muscat", lon: 58.28 },
  TLV: { name: "Tel Aviv Ben Gurion", icao: "LLBG", tz: "Asia/Jerusalem", lon: 34.89 },
  AMM: { name: "Amman", icao: "OJAI", tz: "Asia/Amman", lon: 35.99 },

  // Africa
  CAI: { name: "Cairo", icao: "HECA", tz: "Africa/Cairo", lon: 31.41 },
  CMN: { name: "Casablanca", icao: "GMMN", tz: "Africa/Casablanca", lon: -7.59 },
  JNB: { name: "Johannesburg", icao: "FAOR", tz: "Africa/Johannesburg", lon: 28.25 },
  CPT: { name: "Cape Town", icao: "FACT", tz: "Africa/Johannesburg", lon: 18.60 },
  NBO: { name: "Nairobi", icao: "HKJK", tz: "Africa/Nairobi", lon: 36.93 },
  ADD: { name: "Addis Ababa", icao: "HAAB", tz: "Africa/Addis_Ababa", lon: 38.80 },
  LOS: { name: "Lagos", icao: "DNMM", tz: "Africa/Lagos", lon: 3.32 },
  ACC: { name: "Accra", icao: "DGAA", tz: "Africa/Accra", lon: -0.17 },

  // South Asia
  DEL: { name: "Delhi Indira Gandhi", icao: "VIDP", tz: "Asia/Kolkata", lon: 77.10 },
  BOM: { name: "Mumbai", icao: "VABB", tz: "Asia/Kolkata", lon: 72.87 },
  BLR: { name: "Bengaluru", icao: "VOBL", tz: "Asia/Kolkata", lon: 77.71 },
  MAA: { name: "Chennai", icao: "VOMM", tz: "Asia/Kolkata", lon: 80.17 },
  HYD: { name: "Hyderabad", icao: "VOHS", tz: "Asia/Kolkata", lon: 78.43 },
  CCU: { name: "Kolkata", icao: "VECC", tz: "Asia/Kolkata", lon: 88.45 },
  COK: { name: "Kochi", icao: "VOCI", tz: "Asia/Kolkata", lon: 76.40 },
  GOI: { name: "Goa Dabolim", icao: "VOGO", tz: "Asia/Kolkata", lon: 73.83 },
  KHI: { name: "Karachi", icao: "OPKC", tz: "Asia/Karachi", lon: 67.16 },
  ISB: { name: "Islamabad", icao: "OPIS", tz: "Asia/Karachi", lon: 72.83 },
  LHE: { name: "Lahore", icao: "OPLA", tz: "Asia/Karachi", lon: 74.40 },
  DAC: { name: "Dhaka", icao: "VGHS", tz: "Asia/Dhaka", lon: 90.40 },
  CMB: { name: "Colombo", icao: "VCBI", tz: "Asia/Colombo", lon: 79.88 },
  KTM: { name: "Kathmandu", icao: "VNKT", tz: "Asia/Kathmandu", lon: 85.36 },
  MLE: { name: "Malé", icao: "VRMM", tz: "Indian/Maldives", lon: 73.53 },

  // Southeast Asia
  BKK: { name: "Bangkok Suvarnabhumi", icao: "VTBS", tz: "Asia/Bangkok", lon: 100.75 },
  DMK: { name: "Bangkok Don Mueang", icao: "VTBD", tz: "Asia/Bangkok", lon: 100.61 },
  SIN: { name: "Singapore Changi", icao: "WSSS", tz: "Asia/Singapore", lon: 103.99 },
  KUL: { name: "Kuala Lumpur", icao: "WMKK", tz: "Asia/Kuala_Lumpur", lon: 101.71 },
  CGK: { name: "Jakarta Soekarno–Hatta", icao: "WIII", tz: "Asia/Jakarta", lon: 106.66 },
  DPS: { name: "Bali Denpasar", icao: "WADD", tz: "Asia/Makassar", lon: 115.17 },
  MNL: { name: "Manila", icao: "RPLL", tz: "Asia/Manila", lon: 121.02 },
  CEB: { name: "Cebu", icao: "RPVM", tz: "Asia/Manila", lon: 123.98 },
  HAN: { name: "Hanoi", icao: "VVNB", tz: "Asia/Ho_Chi_Minh", lon: 105.81 },
  SGN: { name: "Ho Chi Minh City", icao: "VVTS", tz: "Asia/Ho_Chi_Minh", lon: 106.66 },
  RGN: { name: "Yangon", icao: "VYYY", tz: "Asia/Yangon", lon: 96.13 },
  PNH: { name: "Phnom Penh", icao: "VDPP", tz: "Asia/Phnom_Penh", lon: 104.84 },

  // East Asia
  HKG: { name: "Hong Kong", icao: "VHHH", tz: "Asia/Hong_Kong", lon: 113.91 },
  MFM: { name: "Macau", icao: "VMMC", tz: "Asia/Macau", lon: 113.59 },
  TPE: { name: "Taipei Taoyuan", icao: "RCTP", tz: "Asia/Taipei", lon: 121.23 },
  ICN: { name: "Seoul Incheon", icao: "RKSI", tz: "Asia/Seoul", lon: 126.45 },
  GMP: { name: "Seoul Gimpo", icao: "RKSS", tz: "Asia/Seoul", lon: 126.79 },
  NRT: { name: "Tokyo Narita", icao: "RJAA", tz: "Asia/Tokyo", lon: 140.39 },
  HND: { name: "Tokyo Haneda", icao: "RJTT", tz: "Asia/Tokyo", lon: 139.78 },
  KIX: { name: "Osaka Kansai", icao: "RJBB", tz: "Asia/Tokyo", lon: 135.24 },
  NGO: { name: "Nagoya Chubu", icao: "RJGG", tz: "Asia/Tokyo", lon: 136.81 },
  CTS: { name: "Sapporo New Chitose", icao: "RJCC", tz: "Asia/Tokyo", lon: 141.69 },
  PEK: { name: "Beijing Capital", icao: "ZBAA", tz: "Asia/Shanghai", lon: 116.60 },
  PKX: { name: "Beijing Daxing", icao: "ZBAD", tz: "Asia/Shanghai", lon: 116.41 },
  PVG: { name: "Shanghai Pudong", icao: "ZSPD", tz: "Asia/Shanghai", lon: 121.81 },
  SHA: { name: "Shanghai Hongqiao", icao: "ZSSS", tz: "Asia/Shanghai", lon: 121.34 },
  CAN: { name: "Guangzhou Baiyun", icao: "ZGGG", tz: "Asia/Shanghai", lon: 113.30 },
  SZX: { name: "Shenzhen", icao: "ZGSZ", tz: "Asia/Shanghai", lon: 113.81 },
  CTU: { name: "Chengdu Shuangliu", icao: "ZUUU", tz: "Asia/Shanghai", lon: 103.95 },
  XIY: { name: "Xi'an", icao: "ZLXY", tz: "Asia/Shanghai", lon: 108.75 },

  // Oceania
  SYD: { name: "Sydney Kingsford Smith", icao: "YSSY", tz: "Australia/Sydney", lon: 151.18 },
  MEL: { name: "Melbourne", icao: "YMML", tz: "Australia/Melbourne", lon: 144.84 },
  BNE: { name: "Brisbane", icao: "YBBN", tz: "Australia/Brisbane", lon: 153.12 },
  PER: { name: "Perth", icao: "YPPH", tz: "Australia/Perth", lon: 115.97 },
  ADL: { name: "Adelaide", icao: "YPAD", tz: "Australia/Adelaide", lon: 138.53 },
  CBR: { name: "Canberra", icao: "YSCB", tz: "Australia/Sydney", lon: 149.20 },
  AKL: { name: "Auckland", icao: "NZAA", tz: "Pacific/Auckland", lon: 174.79 },
  CHC: { name: "Christchurch", icao: "NZCH", tz: "Pacific/Auckland", lon: 172.53 },
  WLG: { name: "Wellington", icao: "NZWN", tz: "Pacific/Auckland", lon: 174.81 },
  NAN: { name: "Nadi", icao: "NFFN", tz: "Pacific/Fiji", lon: 177.45 },
  GUM: { name: "Guam", icao: "PGUM", tz: "Pacific/Guam", lon: 144.80 }
});
