/**
 * Country name to ISO code mapping (African countries + common ones)
 */
const countryMapping = {
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
  "south africa": "ZA",
  angola: "AO",
  benin: "BJ",
  togo: "TG",
  congo: "CG",
  "democratic republic of congo": "CD",
  ethiopia: "ET",
  morocco: "MA",
  egypt: "EG",
  algeria: "DZ",
  sudan: "SD",
  uganda: "UG",
  tanzania: "TZ",
  rwanda: "RW",
  zambia: "ZM",
  zimbabwe: "ZW",
  mozambique: "MZ",
  cameroon: "CM",
  "ivory coast": "CI",
  senegal: "SN",
  mali: "ML",
  "burkina faso": "BF",
  malawi: "MW",
  chad: "TD",
  somalia: "SO",
  eritrea: "ER",
  libya: "LY",
  tunisia: "TN",
  mauritania: "MR",
  botswana: "BW",
  namibia: "NA",
  gabon: "GA",
  lesotho: "LS",
  guinea: "GN",
  liberia: "LR",
};

const escapeForRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsWord = (text, word) => {
  const re = new RegExp(`\\b${escapeForRegex(word)}\\b`, "i");
  return re.test(text);
};

/**
 * Parse natural language query and return filter object
 * @param {string} query - parseNaturalLanguageNatural language query string
 * @returns {Object|null} - Filter object or null if cannot interpret
 */
const parseNaturalLanguage = (query) => {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return null;
  }

  const lowerQuery = query.toLowerCase().trim();
  const filters = {};

  // Track detected gender keywords
  let detectedMale = false;
  let detectedFemale = false;

  // === GENDER DETECTION ===
  const maleKeywords = [
    "male",
    "males",
    "man",
    "men",
    "boy",
    "boys",
    "gentlemen",
  ];
  const femaleKeywords = [
    "female",
    "females",
    "woman",
    "women",
    "girl",
    "girls",
    "ladies",
  ];

  for (const keyword of maleKeywords) {
    if (containsWord(lowerQuery, keyword)) {
      detectedMale = true;
      break;
    }
  }

  for (const keyword of femaleKeywords) {
    if (containsWord(lowerQuery, keyword)) {
      detectedFemale = true;
      break;
    }
  }

  if (detectedMale && detectedFemale) {
    filters.gender = { $in: ["male", "female"] };
  } else if (detectedMale) {
    filters.gender = "male";
  } else if (detectedFemale) {
    filters.gender = "female";
  }

  // === AGE GROUP DETECTION ===
  if (
    containsWord(lowerQuery, "teenager") ||
    containsWord(lowerQuery, "teenagers") ||
    containsWord(lowerQuery, "teen") ||
    containsWord(lowerQuery, "teens")
  ) {
    filters.age_group = "teenager";
  }
  if (containsWord(lowerQuery, "adult") || containsWord(lowerQuery, "adults")) {
    filters.age_group = "adult";
  }
  if (
    containsWord(lowerQuery, "senior") ||
    containsWord(lowerQuery, "seniors") ||
    containsWord(lowerQuery, "elderly")
  ) {
    filters.age_group = "senior";
  }
  if (
    containsWord(lowerQuery, "child") ||
    containsWord(lowerQuery, "children") ||
    containsWord(lowerQuery, "kid") ||
    containsWord(lowerQuery, "kids")
  ) {
    filters.age_group = "child";
  }

  // === "YOUNG" HANDLING (ages 16-24) ===
  if (containsWord(lowerQuery, "young")) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // === NUMERIC AGE RULES ===
  // Match patterns: "above 30", "older than 30", "greater than 30", "over 30", "> 30"
  const aboveRegex = /(?:above|older than|greater than|over|>)\s*(\d+)/i;
  const aboveMatch = lowerQuery.match(aboveRegex);
  if (aboveMatch && !filters.min_age) {
    filters.min_age = parseInt(aboveMatch[1], 10) + 1;
  }

  // Match patterns: "below 20", "younger than 20", "under 20", "less than 20", "< 20"
  const belowRegex = /(?:below|younger than|under|less than|<)\s*(\d+)/i;
  const belowMatch = lowerQuery.match(belowRegex);
  if (belowMatch && !filters.max_age) {
    filters.max_age = parseInt(belowMatch[1], 10) - 1;
  }

  // Match "between X and Y"
  const betweenRegex = /between\s+(\d+)\s+and\s+(\d+)/i;
  const betweenMatch = lowerQuery.match(betweenRegex);
  if (betweenMatch) {
    filters.min_age = parseInt(betweenMatch[1]);
    filters.max_age = parseInt(betweenMatch[2]);
  }

  // === COUNTRY DETECTION ===
  // Look for "from X" or "in X" or "of X"
  let countryDetected = null;

  // Try "from X" pattern
  const fromRegex =
    /from\s+([a-z\s]+?)(?:\s+and|\s+above|\s+below|\s+young|\s+old|\s+that|\s+who|$)/i;
  const fromMatch = lowerQuery.match(fromRegex);
  if (fromMatch) {
    const possibleCountry = fromMatch[1].trim();
    for (const [countryName, code] of Object.entries(countryMapping)) {
      if (
        possibleCountry.includes(countryName) ||
        countryName.includes(possibleCountry)
      ) {
        countryDetected = code;
        break;
      }
    }
  }

  // If no "from X", try direct country name in query
  if (!countryDetected) {
    for (const [countryName, code] of Object.entries(countryMapping)) {
      if (lowerQuery.includes(countryName)) {
        countryDetected = code;
        break;
      }
    }
  }

  if (countryDetected) {
    filters.country_id = countryDetected;
  }

  // === SPECIAL HANDLING FOR "young males from nigeria" ===
  // Already covered by gender + young + country detection

  // === VALIDATION: At least one meaningful filter ===
  const hasFilter =
    filters.gender ||
    filters.age_group ||
    filters.min_age !== undefined ||
    filters.max_age !== undefined ||
    filters.country_id;

  if (!hasFilter) {
    return null;
  }

  // Clean up: remove undefined values
  Object.keys(filters).forEach((key) => {
    if (filters[key] === undefined) delete filters[key];
  });

  return filters;
};

export default parseNaturalLanguage;
