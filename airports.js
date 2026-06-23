"use strict";

/*
 * Local airport dataset, keyed by IATA code.
 *   name    : human-readable airport name
 *   city    : city / metro served (used for city-name lookup)
 *   primary : true marks the "prime" airport when a city has several
 *             (the one chosen when the user types just the city name)
 *   icao    : 4-letter ICAO location indicator (current / "modern" code)
 *   tz      : IANA timezone (for zone-based local time)
 *   lon     : longitude in decimal degrees, East positive / West negative
 *             (used to compute Local Mean Time — LMT)
 *
 * Bundled locally on purpose: the app makes no network calls (strict CSP,
 * no third-party data sources), so airport data ships as a static asset.
 * Curated set of major international airports — not exhaustive. Longitudes are
 * airport-/city-level, which is ample for LMT (1° ~= 4 minutes of time).
 */

const AIRPORTS = Object.freeze({
  // North America — USA
  ATL: { name: "Atlanta", city: "Atlanta", icao: "KATL", tz: "America/New_York", lon: -84.43 },
  JFK: { name: "New York – John F. Kennedy", city: "New York", primary: true, icao: "KJFK", tz: "America/New_York", lon: -73.78 },
  EWR: { name: "Newark Liberty", city: "New York", icao: "KEWR", tz: "America/New_York", lon: -74.17 },
  LGA: { name: "New York – LaGuardia", city: "New York", icao: "KLGA", tz: "America/New_York", lon: -73.87 },
  BOS: { name: "Boston Logan", city: "Boston", icao: "KBOS", tz: "America/New_York", lon: -71.01 },
  PHL: { name: "Philadelphia", city: "Philadelphia", icao: "KPHL", tz: "America/New_York", lon: -75.24 },
  DCA: { name: "Washington Reagan", city: "Washington", icao: "KDCA", tz: "America/New_York", lon: -77.04 },
  IAD: { name: "Washington Dulles", city: "Washington", primary: true, icao: "KIAD", tz: "America/New_York", lon: -77.46 },
  MIA: { name: "Miami", city: "Miami", icao: "KMIA", tz: "America/New_York", lon: -80.29 },
  MCO: { name: "Orlando", city: "Orlando", icao: "KMCO", tz: "America/New_York", lon: -81.31 },
  CLT: { name: "Charlotte", city: "Charlotte", icao: "KCLT", tz: "America/New_York", lon: -80.94 },
  DTW: { name: "Detroit", city: "Detroit", icao: "KDTW", tz: "America/Detroit", lon: -83.35 },
  ORD: { name: "Chicago O'Hare", city: "Chicago", primary: true, icao: "KORD", tz: "America/Chicago", lon: -87.90 },
  MDW: { name: "Chicago Midway", city: "Chicago", icao: "KMDW", tz: "America/Chicago", lon: -87.75 },
  DFW: { name: "Dallas/Fort Worth", city: "Dallas", icao: "KDFW", tz: "America/Chicago", lon: -97.04 },
  IAH: { name: "Houston Intercontinental", city: "Houston", icao: "KIAH", tz: "America/Chicago", lon: -95.34 },
  MSP: { name: "Minneapolis/St. Paul", city: "Minneapolis", icao: "KMSP", tz: "America/Chicago", lon: -93.22 },
  DEN: { name: "Denver", city: "Denver", icao: "KDEN", tz: "America/Denver", lon: -104.67 },
  SLC: { name: "Salt Lake City", city: "Salt Lake City", icao: "KSLC", tz: "America/Denver", lon: -111.98 },
  PHX: { name: "Phoenix Sky Harbor", city: "Phoenix", icao: "KPHX", tz: "America/Phoenix", lon: -112.01 },
  LAX: { name: "Los Angeles", city: "Los Angeles", icao: "KLAX", tz: "America/Los_Angeles", lon: -118.41 },
  SFO: { name: "San Francisco", city: "San Francisco", icao: "KSFO", tz: "America/Los_Angeles", lon: -122.38 },
  SAN: { name: "San Diego", city: "San Diego", icao: "KSAN", tz: "America/Los_Angeles", lon: -117.19 },
  SEA: { name: "Seattle–Tacoma", city: "Seattle", icao: "KSEA", tz: "America/Los_Angeles", lon: -122.31 },
  LAS: { name: "Las Vegas Harry Reid", city: "Las Vegas", icao: "KLAS", tz: "America/Los_Angeles", lon: -115.15 },
  PDX: { name: "Portland", city: "Portland", icao: "KPDX", tz: "America/Los_Angeles", lon: -122.60 },
  HNL: { name: "Honolulu", city: "Honolulu", icao: "PHNL", tz: "Pacific/Honolulu", lon: -157.92 },
  ANC: { name: "Anchorage", city: "Anchorage", icao: "PANC", tz: "America/Anchorage", lon: -149.99 },

  // North America — Canada / Mexico / Central America
  YYZ: { name: "Toronto Pearson", city: "Toronto", icao: "CYYZ", tz: "America/Toronto", lon: -79.63 },
  YUL: { name: "Montréal–Trudeau", city: "Montreal", icao: "CYUL", tz: "America/Toronto", lon: -73.74 },
  YOW: { name: "Ottawa", city: "Ottawa", icao: "CYOW", tz: "America/Toronto", lon: -75.67 },
  YVR: { name: "Vancouver", city: "Vancouver", icao: "CYVR", tz: "America/Vancouver", lon: -123.18 },
  YYC: { name: "Calgary", city: "Calgary", icao: "CYYC", tz: "America/Edmonton", lon: -114.02 },
  YEG: { name: "Edmonton", city: "Edmonton", icao: "CYEG", tz: "America/Edmonton", lon: -113.58 },
  MEX: { name: "Mexico City", city: "Mexico City", icao: "MMMX", tz: "America/Mexico_City", lon: -99.07 },
  CUN: { name: "Cancún", city: "Cancun", icao: "MMUN", tz: "America/Cancun", lon: -86.87 },
  GDL: { name: "Guadalajara", city: "Guadalajara", icao: "MMGL", tz: "America/Mexico_City", lon: -103.31 },
  PTY: { name: "Panama City Tocumen", city: "Panama City", icao: "MPTO", tz: "America/Panama", lon: -79.38 },
  SJO: { name: "San José (Costa Rica)", city: "San Jose", icao: "MROC", tz: "America/Costa_Rica", lon: -84.20 },

  // South America
  GRU: { name: "São Paulo Guarulhos", city: "Sao Paulo", icao: "SBGR", tz: "America/Sao_Paulo", lon: -46.47 },
  GIG: { name: "Rio de Janeiro Galeão", city: "Rio de Janeiro", icao: "SBGL", tz: "America/Sao_Paulo", lon: -43.25 },
  BSB: { name: "Brasília", city: "Brasilia", icao: "SBBR", tz: "America/Sao_Paulo", lon: -47.92 },
  EZE: { name: "Buenos Aires Ezeiza", city: "Buenos Aires", icao: "SAEZ", tz: "America/Argentina/Buenos_Aires", lon: -58.54 },
  SCL: { name: "Santiago", city: "Santiago", icao: "SCEL", tz: "America/Santiago", lon: -70.79 },
  BOG: { name: "Bogotá", city: "Bogota", icao: "SKBO", tz: "America/Bogota", lon: -74.15 },
  LIM: { name: "Lima", city: "Lima", icao: "SPJC", tz: "America/Lima", lon: -77.11 },
  UIO: { name: "Quito", city: "Quito", icao: "SEQM", tz: "America/Guayaquil", lon: -78.36 },

  // Europe — UK / Ireland
  LHR: { name: "London Heathrow", city: "London", primary: true, icao: "EGLL", tz: "Europe/London", lon: -0.46 },
  LGW: { name: "London Gatwick", city: "London", icao: "EGKK", tz: "Europe/London", lon: -0.18 },
  STN: { name: "London Stansted", city: "London", icao: "EGSS", tz: "Europe/London", lon: 0.24 },
  LTN: { name: "London Luton", city: "London", icao: "EGGW", tz: "Europe/London", lon: -0.37 },
  MAN: { name: "Manchester", city: "Manchester", icao: "EGCC", tz: "Europe/London", lon: -2.27 },
  EDI: { name: "Edinburgh", city: "Edinburgh", icao: "EGPH", tz: "Europe/London", lon: -3.37 },
  DUB: { name: "Dublin", city: "Dublin", icao: "EIDW", tz: "Europe/Dublin", lon: -6.27 },

  // Europe — Western / Central
  CDG: { name: "Paris Charles de Gaulle", city: "Paris", primary: true, icao: "LFPG", tz: "Europe/Paris", lon: 2.55 },
  ORY: { name: "Paris Orly", city: "Paris", icao: "LFPO", tz: "Europe/Paris", lon: 2.36 },
  AMS: { name: "Amsterdam Schiphol", city: "Amsterdam", icao: "EHAM", tz: "Europe/Amsterdam", lon: 4.76 },
  BRU: { name: "Brussels", city: "Brussels", icao: "EBBR", tz: "Europe/Brussels", lon: 4.48 },
  FRA: { name: "Frankfurt", city: "Frankfurt", icao: "EDDF", tz: "Europe/Berlin", lon: 8.57 },
  MUC: { name: "Munich", city: "Munich", icao: "EDDM", tz: "Europe/Berlin", lon: 11.79 },
  BER: { name: "Berlin Brandenburg", city: "Berlin", icao: "EDDB", tz: "Europe/Berlin", lon: 13.50 },
  DUS: { name: "Düsseldorf", city: "Dusseldorf", icao: "EDDL", tz: "Europe/Berlin", lon: 6.77 },
  HAM: { name: "Hamburg", city: "Hamburg", icao: "EDDH", tz: "Europe/Berlin", lon: 10.00 },
  ZRH: { name: "Zürich", city: "Zurich", icao: "LSZH", tz: "Europe/Zurich", lon: 8.55 },
  GVA: { name: "Geneva", city: "Geneva", icao: "LSGG", tz: "Europe/Zurich", lon: 6.11 },
  VIE: { name: "Vienna", city: "Vienna", icao: "LOWW", tz: "Europe/Vienna", lon: 16.57 },
  LUX: { name: "Luxembourg", city: "Luxembourg", icao: "ELLX", tz: "Europe/Luxembourg", lon: 6.20 },

  // Europe — Southern
  MAD: { name: "Madrid Barajas", city: "Madrid", icao: "LEMD", tz: "Europe/Madrid", lon: -3.57 },
  BCN: { name: "Barcelona", city: "Barcelona", icao: "LEBL", tz: "Europe/Madrid", lon: 2.08 },
  LIS: { name: "Lisbon", city: "Lisbon", icao: "LPPT", tz: "Europe/Lisbon", lon: -9.14 },
  OPO: { name: "Porto", city: "Porto", icao: "LPPR", tz: "Europe/Lisbon", lon: -8.68 },
  FCO: { name: "Rome Fiumicino", city: "Rome", icao: "LIRF", tz: "Europe/Rome", lon: 12.25 },
  MXP: { name: "Milan Malpensa", city: "Milan", icao: "LIMC", tz: "Europe/Rome", lon: 8.72 },
  VCE: { name: "Venice", city: "Venice", icao: "LIPZ", tz: "Europe/Rome", lon: 12.35 },
  NAP: { name: "Naples", city: "Naples", icao: "LIRN", tz: "Europe/Rome", lon: 14.29 },
  ATH: { name: "Athens", city: "Athens", icao: "LGAV", tz: "Europe/Athens", lon: 23.95 },

  // Europe — Nordic / Eastern
  CPH: { name: "Copenhagen", city: "Copenhagen", icao: "EKCH", tz: "Europe/Copenhagen", lon: 12.65 },
  ARN: { name: "Stockholm Arlanda", city: "Stockholm", icao: "ESSA", tz: "Europe/Stockholm", lon: 17.92 },
  OSL: { name: "Oslo", city: "Oslo", icao: "ENGM", tz: "Europe/Oslo", lon: 11.10 },
  HEL: { name: "Helsinki", city: "Helsinki", icao: "EFHK", tz: "Europe/Helsinki", lon: 24.96 },
  KEF: { name: "Reykjavík Keflavík", city: "Reykjavik", icao: "BIKF", tz: "Atlantic/Reykjavik", lon: -22.61 },
  WAW: { name: "Warsaw Chopin", city: "Warsaw", icao: "EPWA", tz: "Europe/Warsaw", lon: 20.97 },
  PRG: { name: "Prague", city: "Prague", icao: "LKPR", tz: "Europe/Prague", lon: 14.26 },
  BUD: { name: "Budapest", city: "Budapest", icao: "LHBP", tz: "Europe/Budapest", lon: 19.26 },
  IST: { name: "Istanbul", city: "Istanbul", primary: true, icao: "LTFM", tz: "Europe/Istanbul", lon: 28.74 },
  SAW: { name: "Istanbul Sabiha Gökçen", city: "Istanbul", icao: "LTFJ", tz: "Europe/Istanbul", lon: 29.31 },
  SVO: { name: "Moscow Sheremetyevo", city: "Moscow", primary: true, icao: "UUEE", tz: "Europe/Moscow", lon: 37.41 },
  DME: { name: "Moscow Domodedovo", city: "Moscow", icao: "UUDD", tz: "Europe/Moscow", lon: 37.91 },
  LED: { name: "St. Petersburg Pulkovo", city: "St. Petersburg", icao: "ULLI", tz: "Europe/Moscow", lon: 30.26 },

  // Middle East
  DXB: { name: "Dubai", city: "Dubai", icao: "OMDB", tz: "Asia/Dubai", lon: 55.36 },
  AUH: { name: "Abu Dhabi", city: "Abu Dhabi", icao: "OMAA", tz: "Asia/Dubai", lon: 54.65 },
  DOH: { name: "Doha Hamad", city: "Doha", icao: "OTHH", tz: "Asia/Qatar", lon: 51.61 },
  RUH: { name: "Riyadh", city: "Riyadh", icao: "OERK", tz: "Asia/Riyadh", lon: 46.70 },
  JED: { name: "Jeddah", city: "Jeddah", icao: "OEJN", tz: "Asia/Riyadh", lon: 39.16 },
  KWI: { name: "Kuwait", city: "Kuwait City", icao: "OKKK", tz: "Asia/Kuwait", lon: 47.97 },
  BAH: { name: "Bahrain", city: "Manama", icao: "OBBI", tz: "Asia/Bahrain", lon: 50.63 },
  MCT: { name: "Muscat", city: "Muscat", icao: "OOMS", tz: "Asia/Muscat", lon: 58.28 },
  TLV: { name: "Tel Aviv Ben Gurion", city: "Tel Aviv", icao: "LLBG", tz: "Asia/Jerusalem", lon: 34.89 },
  AMM: { name: "Amman", city: "Amman", icao: "OJAI", tz: "Asia/Amman", lon: 35.99 },

  // Africa
  CAI: { name: "Cairo", city: "Cairo", icao: "HECA", tz: "Africa/Cairo", lon: 31.41 },
  CMN: { name: "Casablanca", city: "Casablanca", icao: "GMMN", tz: "Africa/Casablanca", lon: -7.59 },
  JNB: { name: "Johannesburg", city: "Johannesburg", icao: "FAOR", tz: "Africa/Johannesburg", lon: 28.25 },
  CPT: { name: "Cape Town", city: "Cape Town", icao: "FACT", tz: "Africa/Johannesburg", lon: 18.60 },
  NBO: { name: "Nairobi", city: "Nairobi", icao: "HKJK", tz: "Africa/Nairobi", lon: 36.93 },
  ADD: { name: "Addis Ababa", city: "Addis Ababa", icao: "HAAB", tz: "Africa/Addis_Ababa", lon: 38.80 },
  LOS: { name: "Lagos", city: "Lagos", icao: "DNMM", tz: "Africa/Lagos", lon: 3.32 },
  ACC: { name: "Accra", city: "Accra", icao: "DGAA", tz: "Africa/Accra", lon: -0.17 },

  // South Asia
  DEL: { name: "Delhi Indira Gandhi", city: "Delhi", icao: "VIDP", tz: "Asia/Kolkata", lon: 77.10 },
  BOM: { name: "Mumbai", city: "Mumbai", icao: "VABB", tz: "Asia/Kolkata", lon: 72.87 },
  BLR: { name: "Bengaluru", city: "Bengaluru", icao: "VOBL", tz: "Asia/Kolkata", lon: 77.71 },
  MAA: { name: "Chennai", city: "Chennai", icao: "VOMM", tz: "Asia/Kolkata", lon: 80.17 },
  HYD: { name: "Hyderabad", city: "Hyderabad", icao: "VOHS", tz: "Asia/Kolkata", lon: 78.43 },
  CCU: { name: "Kolkata", city: "Kolkata", icao: "VECC", tz: "Asia/Kolkata", lon: 88.45 },
  COK: { name: "Kochi", city: "Kochi", icao: "VOCI", tz: "Asia/Kolkata", lon: 76.40 },
  GOI: { name: "Goa Dabolim", city: "Goa", icao: "VOGO", tz: "Asia/Kolkata", lon: 73.83 },
  KHI: { name: "Karachi", city: "Karachi", icao: "OPKC", tz: "Asia/Karachi", lon: 67.16 },
  ISB: { name: "Islamabad", city: "Islamabad", icao: "OPIS", tz: "Asia/Karachi", lon: 72.83 },
  LHE: { name: "Lahore", city: "Lahore", icao: "OPLA", tz: "Asia/Karachi", lon: 74.40 },
  DAC: { name: "Dhaka", city: "Dhaka", icao: "VGHS", tz: "Asia/Dhaka", lon: 90.40 },
  CMB: { name: "Colombo", city: "Colombo", icao: "VCBI", tz: "Asia/Colombo", lon: 79.88 },
  KTM: { name: "Kathmandu", city: "Kathmandu", icao: "VNKT", tz: "Asia/Kathmandu", lon: 85.36 },
  MLE: { name: "Malé", city: "Male", icao: "VRMM", tz: "Indian/Maldives", lon: 73.53 },

  // Southeast Asia
  BKK: { name: "Bangkok Suvarnabhumi", city: "Bangkok", primary: true, icao: "VTBS", tz: "Asia/Bangkok", lon: 100.75 },
  DMK: { name: "Bangkok Don Mueang", city: "Bangkok", icao: "VTBD", tz: "Asia/Bangkok", lon: 100.61 },
  SIN: { name: "Singapore Changi", city: "Singapore", icao: "WSSS", tz: "Asia/Singapore", lon: 103.99 },
  KUL: { name: "Kuala Lumpur", city: "Kuala Lumpur", icao: "WMKK", tz: "Asia/Kuala_Lumpur", lon: 101.71 },
  CGK: { name: "Jakarta Soekarno–Hatta", city: "Jakarta", icao: "WIII", tz: "Asia/Jakarta", lon: 106.66 },
  DPS: { name: "Bali Denpasar", city: "Bali", icao: "WADD", tz: "Asia/Makassar", lon: 115.17 },
  MNL: { name: "Manila", city: "Manila", icao: "RPLL", tz: "Asia/Manila", lon: 121.02 },
  CEB: { name: "Cebu", city: "Cebu", icao: "RPVM", tz: "Asia/Manila", lon: 123.98 },
  HAN: { name: "Hanoi", city: "Hanoi", icao: "VVNB", tz: "Asia/Ho_Chi_Minh", lon: 105.81 },
  SGN: { name: "Ho Chi Minh City", city: "Ho Chi Minh City", icao: "VVTS", tz: "Asia/Ho_Chi_Minh", lon: 106.66 },
  RGN: { name: "Yangon", city: "Yangon", icao: "VYYY", tz: "Asia/Yangon", lon: 96.13 },
  PNH: { name: "Phnom Penh", city: "Phnom Penh", icao: "VDPP", tz: "Asia/Phnom_Penh", lon: 104.84 },

  // East Asia
  HKG: { name: "Hong Kong", city: "Hong Kong", icao: "VHHH", tz: "Asia/Hong_Kong", lon: 113.91 },
  MFM: { name: "Macau", city: "Macau", icao: "VMMC", tz: "Asia/Macau", lon: 113.59 },
  TPE: { name: "Taipei Taoyuan", city: "Taipei", icao: "RCTP", tz: "Asia/Taipei", lon: 121.23 },
  ICN: { name: "Seoul Incheon", city: "Seoul", primary: true, icao: "RKSI", tz: "Asia/Seoul", lon: 126.45 },
  GMP: { name: "Seoul Gimpo", city: "Seoul", icao: "RKSS", tz: "Asia/Seoul", lon: 126.79 },
  NRT: { name: "Tokyo Narita", city: "Tokyo", icao: "RJAA", tz: "Asia/Tokyo", lon: 140.39 },
  HND: { name: "Tokyo Haneda", city: "Tokyo", primary: true, icao: "RJTT", tz: "Asia/Tokyo", lon: 139.78 },
  KIX: { name: "Osaka Kansai", city: "Osaka", icao: "RJBB", tz: "Asia/Tokyo", lon: 135.24 },
  NGO: { name: "Nagoya Chubu", city: "Nagoya", icao: "RJGG", tz: "Asia/Tokyo", lon: 136.81 },
  CTS: { name: "Sapporo New Chitose", city: "Sapporo", icao: "RJCC", tz: "Asia/Tokyo", lon: 141.69 },
  PEK: { name: "Beijing Capital", city: "Beijing", primary: true, icao: "ZBAA", tz: "Asia/Shanghai", lon: 116.60 },
  PKX: { name: "Beijing Daxing", city: "Beijing", icao: "ZBAD", tz: "Asia/Shanghai", lon: 116.41 },
  PVG: { name: "Shanghai Pudong", city: "Shanghai", primary: true, icao: "ZSPD", tz: "Asia/Shanghai", lon: 121.81 },
  SHA: { name: "Shanghai Hongqiao", city: "Shanghai", icao: "ZSSS", tz: "Asia/Shanghai", lon: 121.34 },
  CAN: { name: "Guangzhou Baiyun", city: "Guangzhou", icao: "ZGGG", tz: "Asia/Shanghai", lon: 113.30 },
  SZX: { name: "Shenzhen", city: "Shenzhen", icao: "ZGSZ", tz: "Asia/Shanghai", lon: 113.81 },
  CTU: { name: "Chengdu Shuangliu", city: "Chengdu", icao: "ZUUU", tz: "Asia/Shanghai", lon: 103.95 },
  XIY: { name: "Xi'an", city: "Xi'an", icao: "ZLXY", tz: "Asia/Shanghai", lon: 108.75 },

  // Oceania
  SYD: { name: "Sydney Kingsford Smith", city: "Sydney", icao: "YSSY", tz: "Australia/Sydney", lon: 151.18 },
  MEL: { name: "Melbourne", city: "Melbourne", icao: "YMML", tz: "Australia/Melbourne", lon: 144.84 },
  BNE: { name: "Brisbane", city: "Brisbane", icao: "YBBN", tz: "Australia/Brisbane", lon: 153.12 },
  PER: { name: "Perth", city: "Perth", icao: "YPPH", tz: "Australia/Perth", lon: 115.97 },
  ADL: { name: "Adelaide", city: "Adelaide", icao: "YPAD", tz: "Australia/Adelaide", lon: 138.53 },
  CBR: { name: "Canberra", city: "Canberra", icao: "YSCB", tz: "Australia/Sydney", lon: 149.20 },
  AKL: { name: "Auckland", city: "Auckland", icao: "NZAA", tz: "Pacific/Auckland", lon: 174.79 },
  CHC: { name: "Christchurch", city: "Christchurch", icao: "NZCH", tz: "Pacific/Auckland", lon: 172.53 },
  WLG: { name: "Wellington", city: "Wellington", icao: "NZWN", tz: "Pacific/Auckland", lon: 174.81 },
  NAN: { name: "Nadi", city: "Nadi", icao: "NFFN", tz: "Pacific/Fiji", lon: 177.45 },
  GUM: { name: "Guam", city: "Guam", icao: "PGUM", tz: "Pacific/Guam", lon: 144.80 }
});
