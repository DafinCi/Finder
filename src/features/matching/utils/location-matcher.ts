export interface LocationCompatibilityResult {
  isCompatible: boolean;
  score: number;
  isWorldwide: boolean;
  restrictionDetected: string | null;
}

const WORLDWIDE_KEYWORDS = [
  "worldwide",
  "anywhere",
  "remote",
  "global",
  "work from anywhere",
  "wfa",
  "any",
  "all",
  "distributed",
];

interface RegionDefinition {
  identifiers: string[];
  candidateKeywords: string[];
}

const REGION_DEFINITIONS: Record<string, RegionDefinition> = {
  usa: {
    identifiers: [
      "usa only",
      "us only",
      "united states only",
      "u.s. only",
      "us/canada only",
      "north america only",
    ],
    candidateKeywords: [
      "usa",
      "us",
      "united states",
      "america",
      "u.s.",
      "u.s.a.",
      "california",
      "san francisco",
      "new york",
      "texas",
      "washington",
      "seattle",
      "chicago",
      "austin",
      "boston",
      "los angeles",
    ],
  },
  europe: {
    identifiers: [
      "europe only",
      "eu only",
      "emea only",
      "uk only",
      "united kingdom only",
    ],
    candidateKeywords: [
      "europe",
      "eu",
      "emea",
      "uk",
      "united kingdom",
      "great britain",
      "england",
      "london",
      "germany",
      "berlin",
      "munich",
      "france",
      "paris",
      "netherlands",
      "amsterdam",
      "spain",
      "madrid",
      "barcelona",
      "poland",
      "sweden",
      "switzerland",
      "ireland",
      "dublin",
    ],
  },
  apac: {
    identifiers: [
      "apac only",
      "asia only",
      "asia-pacific only",
      "sea only",
      "southeast asia only",
    ],
    candidateKeywords: [
      "apac",
      "asia",
      "asia-pacific",
      "southeast asia",
      "sea",
      "indonesia",
      "jakarta",
      "bali",
      "bandung",
      "surabaya",
      "singapore",
      "malaysia",
      "kuala lumpur",
      "thailand",
      "bangkok",
      "vietnam",
      "philippines",
      "manila",
      "japan",
      "tokyo",
      "korea",
      "seoul",
      "india",
      "bangalore",
      "australia",
      "sydney",
      "melbourne",
      "new zealand",
    ],
  },
  latam: {
    identifiers: ["latam only", "latin america only", "south america only"],
    candidateKeywords: [
      "latam",
      "latin america",
      "south america",
      "brazil",
      "sao paulo",
      "argentina",
      "buenos aires",
      "mexico",
      "mexico city",
      "colombia",
      "bogota",
      "chile",
      "santiago",
    ],
  },
};

function matchesCandidateLocation(
  targetText: string,
  candidateLocations: string[],
): boolean {
  const normalizedTarget = targetText.toLowerCase();
  return candidateLocations.some((loc) => {
    const norm = loc.toLowerCase().trim();
    if (!norm) return false;
    return normalizedTarget.includes(norm) || norm.includes(normalizedTarget);
  });
}

export function evaluateLocationCompatibility(
  jobLocation: string,
  isRemote: boolean,
  candidateLocations: string[] = [],
): LocationCompatibilityResult {
  const normJobLoc = (jobLocation || "").trim().toLowerCase();

  // If candidate has not declared preferred locations, default to compatible
  if (!candidateLocations || candidateLocations.length === 0) {
    return {
      isCompatible: true,
      score: 100,
      isWorldwide: WORLDWIDE_KEYWORDS.includes(normJobLoc) || !normJobLoc,
      restrictionDetected: null,
    };
  }

  // Handle Onsite or Hybrid work modes
  if (!isRemote) {
    const isDirectMatch = matchesCandidateLocation(
      normJobLoc,
      candidateLocations,
    );
    return {
      isCompatible: isDirectMatch,
      score: isDirectMatch ? 100 : 20,
      isWorldwide: false,
      restrictionDetected: null,
    };
  }

  // Handle Worldwide or unrestricted remote jobs
  if (!normJobLoc || WORLDWIDE_KEYWORDS.includes(normJobLoc)) {
    return {
      isCompatible: true,
      score: 100,
      isWorldwide: true,
      restrictionDetected: null,
    };
  }

  // Detect explicit geographic restrictions for remote roles
  for (const [, region] of Object.entries(REGION_DEFINITIONS)) {
    const matchedIdentifier = region.identifiers.find((id) =>
      normJobLoc.includes(id),
    );

    if (matchedIdentifier) {
      const candidateMatchesRegion = candidateLocations.some((loc) => {
        const normLoc = loc.toLowerCase().trim();
        return region.candidateKeywords.some(
          (kw) => normLoc.includes(kw) || kw.includes(normLoc),
        );
      });

      return {
        isCompatible: candidateMatchesRegion,
        score: candidateMatchesRegion ? 100 : 25,
        isWorldwide: false,
        restrictionDetected: matchedIdentifier,
      };
    }
  }

  // Generic "only" restriction marker fallback (e.g., "US Only", "Canada Only")
  if (normJobLoc.includes("only")) {
    const directMatch = matchesCandidateLocation(
      normJobLoc,
      candidateLocations,
    );
    return {
      isCompatible: directMatch,
      score: directMatch ? 100 : 25,
      isWorldwide: false,
      restrictionDetected: normJobLoc,
    };
  }

  // For remote jobs without explicit restriction (e.g. company HQ "London, UK"),
  // treat as compatible with neutral score if not directly matching candidate
  const isDirectMatch = matchesCandidateLocation(
    normJobLoc,
    candidateLocations,
  );
  return {
    isCompatible: true,
    score: isDirectMatch ? 100 : 70,
    isWorldwide: false,
    restrictionDetected: null,
  };
}
