import { NextResponse } from "next/server";
import { z } from "zod";
import {
  type TranscriptResponse,
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript/dist/youtube-transcript.esm.js";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { extractYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";

export const runtime = "nodejs";

const NO_TRANSCRIPT_ERROR_MESSAGE = "Aucun sous-titre disponible pour cette vidéo";

const requestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Ajoute une URL YouTube.")
    .refine((value: string) => isYouTubeUrl(value), "Ajoute une URL YouTube valide."),
});

const oEmbedResponseSchema = z.object({
  title: z.string().trim().min(1),
});

function buildTranscriptText(transcript: TranscriptResponse[]): string {
  return transcript
    .map((item) => item.text.trim())
    .filter((item) => item.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getYoutubeTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return `Video YouTube (${videoId})`;
    }

    const payload = oEmbedResponseSchema.safeParse(await response.json());

    return payload.success ? payload.data.title : `Video YouTube (${videoId})`;
  } catch {
    return `Video YouTube (${videoId})`;
  }
}

function createYoutubeErrorResponse(error: unknown): NextResponse | null {
  if (
    error instanceof YoutubeTranscriptDisabledError ||
    error instanceof YoutubeTranscriptNotAvailableError
  ) {
    return NextResponse.json({ error: NO_TRANSCRIPT_ERROR_MESSAGE }, { status: 422 });
  }

  if (error instanceof YoutubeTranscriptVideoUnavailableError) {
    return NextResponse.json({ error: "Cette vidéo YouTube est indisponible." }, { status: 404 });
  }

  if (error instanceof YoutubeTranscriptTooManyRequestError) {
    return NextResponse.json(
      { error: "YouTube limite temporairement les extractions. Réessaie dans quelques minutes." },
      { status: 429 },
    );
  }

  if (error instanceof YoutubeTranscriptError) {
    return NextResponse.json({ error: NO_TRANSCRIPT_ERROR_MESSAGE }, { status: 422 });
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const bodyResult = requestSchema.safeParse(await request.json());

    if (!bodyResult.success) {
      return NextResponse.json(
        { error: bodyResult.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const videoId = extractYouTubeVideoId(bodyResult.data.url);

    if (!videoId) {
      return NextResponse.json({ error: "Ajoute une URL YouTube valide." }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = buildTranscriptText(transcript);

    if (text.length === 0) {
      return NextResponse.json({ error: NO_TRANSCRIPT_ERROR_MESSAGE }, { status: 422 });
    }

    const language =
      transcript.find((item) => typeof item.lang === "string" && item.lang.trim().length > 0)
        ?.lang ?? "unknown";
    const title = await getYoutubeTitle(videoId);

    return NextResponse.json({
      text,
      title,
      language,
    });
  } catch (error) {
    const youtubeErrorResponse = createYoutubeErrorResponse(error);

    if (youtubeErrorResponse) {
      return youtubeErrorResponse;
    }

    return createRouteErrorResponse(error);
  }
}
