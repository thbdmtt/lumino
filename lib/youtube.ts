const YOUTUBE_WATCH_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

function isValidVideoId(value: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(value: string): string | null {
  const url = parseUrl(value.trim());

  if (!url) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();

  if (YOUTUBE_SHORT_HOSTS.has(hostname)) {
    const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";

    return isValidVideoId(candidate) ? candidate : null;
  }

  if (!YOUTUBE_WATCH_HOSTS.has(hostname) && !hostname.endsWith(".youtube.com")) {
    return null;
  }

  const searchParamVideoId = url.searchParams.get("v");

  if (searchParamVideoId && isValidVideoId(searchParamVideoId)) {
    return searchParamVideoId;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const candidateFromPath =
    pathSegments[0] === "embed" || pathSegments[0] === "shorts" || pathSegments[0] === "live"
      ? pathSegments[1]
      : null;

  return candidateFromPath && isValidVideoId(candidateFromPath) ? candidateFromPath : null;
}

export function isYouTubeUrl(value: string): boolean {
  return extractYouTubeVideoId(value) !== null;
}
