declare module "youtube-transcript/dist/youtube-transcript.esm.js" {
  export class YoutubeTranscriptError extends Error {
    constructor(message: unknown);
  }

  export class YoutubeTranscriptTooManyRequestError extends YoutubeTranscriptError {
    constructor();
  }

  export class YoutubeTranscriptVideoUnavailableError extends YoutubeTranscriptError {
    constructor(videoId: string);
  }

  export class YoutubeTranscriptDisabledError extends YoutubeTranscriptError {
    constructor(videoId: string);
  }

  export class YoutubeTranscriptNotAvailableError extends YoutubeTranscriptError {
    constructor(videoId: string);
  }

  export class YoutubeTranscriptNotAvailableLanguageError extends YoutubeTranscriptError {
    constructor(lang: string, availableLangs: string[], videoId: string);
  }

  export interface TranscriptConfig {
    fetch?: typeof globalThis.fetch;
    lang?: string;
  }

  export interface TranscriptResponse {
    duration: number;
    lang?: string;
    offset: number;
    text: string;
  }

  export class YoutubeTranscript {
    static fetchTranscript(
      videoId: string,
      config?: TranscriptConfig,
    ): Promise<TranscriptResponse[]>;
  }

  export function fetchTranscript(
    videoId: string,
    config?: TranscriptConfig,
  ): Promise<TranscriptResponse[]>;
}
