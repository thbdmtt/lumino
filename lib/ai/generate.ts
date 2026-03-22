import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

export const aiSourceTypeValues = ["text", "pdf"] as const;
export const aiLanguageValues = ["fr", "en"] as const;

export type AiSourceType = (typeof aiSourceTypeValues)[number];
export type AiLanguage = (typeof aiLanguageValues)[number];

const GENERATED_CARD_MODEL = "claude-sonnet-4-5";
const GENERATED_CARD_TEMPERATURE = 0.7;
const GENERATED_CARD_MAX_TOKENS = 8192;

const generatedCardSchema = z.object({
  back: z.string().trim().min(1).max(4000),
  context: z.string().trim().min(1).max(500),
  front: z.string().trim().min(1).max(240),
});

const generatedCardResponseSchema = z.object({
  cards: z.array(generatedCardSchema).min(1).max(50),
});

const anthropicRuntimeSchema = z.object({
  apiKey: z.string().trim().min(1),
});

export type GeneratedCard = z.infer<typeof generatedCardSchema>;

export class GenerateRouteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "GenerateRouteError";
    this.status = status;
  }
}

function getAnthropicClient(): Anthropic {
  const runtime = anthropicRuntimeSchema.safeParse({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  if (!runtime.success) {
    throw new GenerateRouteError("ANTHROPIC_API_KEY is not configured.", 500);
  }

  return new Anthropic({
    apiKey: runtime.data.apiKey,
  });
}

function getAnthropicClientForApiKey(apiKey: string): Anthropic {
  const runtime = anthropicRuntimeSchema.safeParse({
    apiKey,
  });

  if (!runtime.success) {
    throw new GenerateRouteError("The Anthropic API key is invalid.", 400);
  }

  return new Anthropic({
    apiKey: runtime.data.apiKey,
  });
}

function getLanguageLabel(language: AiLanguage): string {
  return language === "fr" ? "francais" : "anglais";
}

function normalizeSourceText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripBase64Prefix(value: string): string {
  const trimmed = value.trim();
  const parts = trimmed.split(",", 2);

  return parts.length === 2 ? parts[1] : trimmed;
}

function buildSystemPrompt(cardCount: number, language: AiLanguage): string {
  return [
    "Tu es un expert en pedagogie et en creation de flashcards.",
    `Genere ${cardCount} flashcards en ${getLanguageLabel(language)} depuis le texte fourni.`,
    'Reponds UNIQUEMENT en JSON valide avec ce format : { "cards": [{ "front": "...", "back": "...", "context": "..." }] }',
    "",
    "Regles :",
    "- Front : question precise et claire",
    "- Back : reponse concise (max 3 phrases)",
    "- Context : phrase du texte source dont la carte est tiree",
    "- Eviter la redondance entre les cartes",
    "- Couvrir les concepts les plus importants",
  ].join("\n");
}

function buildUserPrompt(sourceText: string, cardCount: number, language: AiLanguage): string {
  return [
    `Langue cible : ${getLanguageLabel(language)}.`,
    `Nombre de cartes attendu : ${cardCount}.`,
    "Texte source :",
    "<source>",
    sourceText,
    "</source>",
  ].join("\n");
}

export async function extractTextFromPdfBase64(pdfBase64: string): Promise<string> {
  const encodedPdf = stripBase64Prefix(pdfBase64);
  const parser = new PDFParse({
    data: Buffer.from(encodedPdf, "base64"),
  });

  try {
    const result = await parser.getText();
    const sourceText = normalizeSourceText(result.text);

    if (sourceText.length === 0) {
      throw new GenerateRouteError("The PDF could not be parsed into usable text.", 400);
    }

    return sourceText;
  } catch (error) {
    if (error instanceof GenerateRouteError) {
      throw error;
    }

    throw new GenerateRouteError("The PDF could not be parsed.", 400);
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export async function generateCardsFromSource(params: {
  apiKey?: string | null;
  cardCount: number;
  language: AiLanguage;
  sourceText: string;
}): Promise<GeneratedCard[]> {
  const client = params.apiKey ? getAnthropicClientForApiKey(params.apiKey) : getAnthropicClient();
  const sourceText = normalizeSourceText(params.sourceText);

  if (sourceText.length === 0) {
    throw new GenerateRouteError("Source text is empty.", 400);
  }

  const message = await client.messages.parse({
    model: GENERATED_CARD_MODEL,
    max_tokens: GENERATED_CARD_MAX_TOKENS,
    temperature: GENERATED_CARD_TEMPERATURE,
    system: buildSystemPrompt(params.cardCount, params.language),
    messages: [
      {
        role: "user",
        content: buildUserPrompt(sourceText, params.cardCount, params.language),
      },
    ],
    output_config: {
      format: zodOutputFormat(generatedCardResponseSchema),
    },
  });

  const parsedOutput = message.parsed_output;

  if (!parsedOutput || parsedOutput.cards.length === 0) {
    throw new GenerateRouteError("Anthropic returned no cards.", 502);
  }

  if (parsedOutput.cards.length > params.cardCount) {
    throw new GenerateRouteError("Anthropic returned more cards than requested.", 502);
  }

  return parsedOutput.cards;
}
