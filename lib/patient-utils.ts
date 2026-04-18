export type CenterOption = {
  id: number;
  name: string;
  address?: string | null;
  city?: {
    name: string;
  } | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function getCenterSearchText(center: CenterOption) {
  return normalize(
    [center.name, center.address ?? "", center.city?.name ?? ""].join(" ")
  );
}

function scoreCenter(center: CenterOption, query: string) {
  if (!query) {
    return 0;
  }

  const centerText = getCenterSearchText(center);
  const tokens = query.split(/\s+/).filter(Boolean);

  let score = 0;

  if (center.city?.name && normalize(center.city.name) === query) {
    score += 120;
  }

  if (centerText.includes(query)) {
    score += 80;
  }

  for (const token of tokens) {
    if (token.length < 3) {
      continue;
    }

    if (centerText.includes(token)) {
      score += 16;
    }
  }

  return score;
}

export function rankCentersByLocation(
  centers: CenterOption[],
  location: string
) {
  const query = normalize(location);

  return [...centers]
    .map((center) => ({
      center,
      score: scoreCenter(center, query),
    }))
    .sort((left, right) => right.score - left.score);
}

export function getRecommendedCenter(
  centers: CenterOption[],
  location: string
) {
  const [bestMatch] = rankCentersByLocation(centers, location);
  return bestMatch && bestMatch.score > 0 ? bestMatch.center : null;
}

export function getCenterLabel(center: CenterOption | null | undefined) {
  if (!center) {
    return "";
  }

  return center.city?.name ? `${center.name}, ${center.city.name}` : center.name;
}

export function formatPatientId(
  patientId: number,
  centerCode?: string | null,
  createdAt?: Date | string | null
) {
  const code =
    centerCode?.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) ?? "PT";
  const createdYear = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();

  return `NC-${code}-${createdYear}-${String(patientId).padStart(4, "0")}`;
}
