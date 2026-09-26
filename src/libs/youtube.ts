// src/lib/youtube.ts

const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
];

export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (!YOUTUBE_HOSTS.includes(parsed.hostname)) {
      return null;
    }

    // https://youtu.be/dQw4w9WgXcQ
    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "www.youtu.be"
    ) {
      return parsed.pathname.slice(1) || null;
    }

    // https://youtube.com/watch?v=dQw4w9WgXcQ
    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v");
    }

    // https://youtube.com/embed/dQw4w9WgXcQ
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/")[2] || null;
    }

    // https://youtube.com/shorts/dQw4w9WgXcQ
    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.split("/")[2] || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidYoutubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

export function isValidYoutubeUrl(url: string): boolean {
  const id = extractYoutubeId(url);

  return id !== null && isValidYoutubeId(id);
}
