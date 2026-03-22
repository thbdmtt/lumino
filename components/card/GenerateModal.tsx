"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  Languages,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Badge, Button, Card, Modal, Spinner } from "@/components/ui";
import { cardSourceTypeValues, type CardRecord } from "@/types";
import { cn } from "@/lib/utils";

const MAX_TEXT_LENGTH = 15000;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

const previewCardSchema = z.object({
  back: z.string().trim().min(1),
  context: z.string().trim().min(1),
  front: z.string().trim().min(1),
});

const generatePreviewResponseSchema = z.object({
  cards: z.array(previewCardSchema).min(1).max(50),
  count: z.number().int().min(1).max(50),
});

const importedCardSchema = z.object({
  back: z.string(),
  context: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
  deckId: z.string().uuid(),
  front: z.string(),
  id: z.string().uuid(),
  sourceType: z.enum(cardSourceTypeValues),
});

const importCardsResponseSchema = z.object({
  cards: z.array(importedCardSchema).min(1).max(50),
  count: z.number().int().min(1).max(50),
});

const stepOrder = [1, 2, 3, 4] as const;
const stepLabels: Record<(typeof stepOrder)[number], string> = {
  1: "Source",
  2: "Parametres",
  3: "Generation",
  4: "Confirmation",
};

type GenerateStep = (typeof stepOrder)[number];
type SourceType = "text" | "pdf";
type Language = "fr" | "en";
type FieldErrorKey = "content" | "pdf";

interface PreviewCard {
  back: string;
  context: string;
  front: string;
  id: string;
  selected: boolean;
}

interface GenerateModalProps {
  deckId: string;
  deckName: string;
  onClose: () => void;
  onImported: (cards: CardRecord[]) => void;
  open: boolean;
  studyHref: string;
}

interface SourceTextareaProps {
  error?: string;
  hint?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

async function readResponsePayload(response: Response): Promise<unknown | null> {
  const raw = await response.text();

  if (raw.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function formatBytes(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(size / 1024)} KB`;
}

function getPdfValidationError(file: File | null): string | null {
  if (!file) {
    return "Ajoute un PDF pour lancer la generation.";
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return "Le PDF doit rester sous 10 MB.";
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Le fichier doit etre un PDF.";
  }

  return null;
}

function buildSourceErrorMap(sourceType: SourceType, content: string, pdfFile: File | null) {
  if (sourceType === "text") {
    const parsedContent = z
      .string()
      .trim()
      .min(1, "Ajoute un texte source avant de continuer.")
      .max(MAX_TEXT_LENGTH, "Le texte doit rester sous 15 000 caracteres.")
      .safeParse(content);

    return {
      content: parsedContent.success ? undefined : parsedContent.error.issues[0]?.message,
      pdf: undefined,
    } satisfies Partial<Record<FieldErrorKey, string>>;
  }

  return {
    content: undefined,
    pdf: getPdfValidationError(pdfFile) ?? undefined,
  } satisfies Partial<Record<FieldErrorKey, string>>;
}

function getImportedSourceType(sourceType: SourceType): "ai_text" | "ai_pdf" {
  return sourceType === "pdf" ? "ai_pdf" : "ai_text";
}

function SourceTextarea({
  error,
  hint,
  label,
  maxLength,
  onChange,
  placeholder,
  rows = 8,
  value,
}: SourceTextareaProps): JSX.Element {
  const count = value.length;

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between gap-sm">
        <label className="text-sm font-medium text-ink-primary">{label}</label>
        {typeof maxLength === "number" ? (
          <span
            className={cn(
              "text-xs text-ink-secondary",
              count > maxLength * 0.9 ? "text-warning" : null,
              count >= maxLength ? "text-danger" : null,
            )}
          >
            {count} / {maxLength}
          </span>
        ) : null}
      </div>

      <textarea
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-[220px] w-full resize-none rounded-lg border border-outline-subtle bg-surface-overlay px-md py-md text-sm text-ink-primary outline-none transition-[border-color,box-shadow] duration-normal ease-smooth placeholder:text-ink-tertiary focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-dim)]",
          error
            ? "border-danger shadow-[0_0_0_3px_var(--danger-dim)] focus-visible:border-danger focus-visible:shadow-[0_0_0_3px_var(--danger-dim)]"
            : null,
        )}
        maxLength={maxLength}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />

      {hint ? <p className="text-xs text-ink-secondary">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

async function readPdfAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Le PDF n'a pas pu etre lu."));
    };

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Le PDF n'a pas pu etre encode."));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

export function GenerateModal({
  deckId,
  deckName,
  onClose,
  onImported,
  open,
  studyHref,
}: GenerateModalProps): JSX.Element {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState<GenerateStep>(1);
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [cardCount, setCardCount] = useState(20);
  const [language, setLanguage] = useState<Language>("fr");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewCards, setPreviewCards] = useState<PreviewCard[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const selectedCount = useMemo(
    () => previewCards.filter((card) => card.selected).length,
    [previewCards],
  );
  const isBusy = isGenerating || isImporting;

  function handleClose(): void {
    if (isBusy) {
      return;
    }

    onClose();
  }

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSourceType("text");
      setContent("");
      setPdfFile(null);
      setCardCount(20);
      setLanguage("fr");
      setFieldErrors({});
      setFormError(null);
      setIsDragActive(false);
      setIsGenerating(false);
      setIsImporting(false);
      setPreviewCards([]);
      setImportedCount(0);
    }
  }, [open]);

  function clearGenerationResult(): void {
    setPreviewCards([]);
    setImportedCount(0);
    setFormError(null);
  }

  function handleSourceValidation(): boolean {
    const nextErrors = buildSourceErrorMap(sourceType, content, pdfFile);
    setFieldErrors(nextErrors);

    return !nextErrors.content && !nextErrors.pdf;
  }

  function handleFileSelection(file: File | null): void {
    setPdfFile(file);
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      pdf: undefined,
    }));
    setFormError(null);
    clearGenerationResult();
  }

  async function handleGeneratePreview(): Promise<void> {
    if (!handleSourceValidation()) {
      return;
    }

    setCurrentStep(3);
    setFormError(null);
    setPreviewCards([]);
    setIsGenerating(true);

    try {
      const payload =
        sourceType === "pdf"
          ? {
              deckId,
              sourceType,
              pdfBase64: await readPdfAsDataUrl(pdfFile as File),
              cardCount,
              language,
              persist: false,
            }
          : {
              deckId,
              sourceType,
              content,
              cardCount,
              language,
              persist: false,
            };
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const responsePayload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(responsePayload, "La generation IA n'a pas abouti."),
        );
      }

      const parsed = generatePreviewResponseSchema.safeParse(responsePayload);

      if (!parsed.success) {
        throw new Error("La reponse de generation est invalide.");
      }

      setPreviewCards(
        parsed.data.cards.map((card) => ({
          ...card,
          id: crypto.randomUUID(),
          selected: true,
        })),
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue pendant la generation.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImportSelected(): Promise<void> {
    const selectedCards = previewCards.filter((card) => card.selected);

    if (selectedCards.length === 0) {
      setFormError("Selectionne au moins une carte a importer.");
      return;
    }

    setFormError(null);
    setIsImporting(true);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          deckId,
          sourceType: getImportedSourceType(sourceType),
          cards: selectedCards.map((card) => ({
            front: card.front,
            back: card.back,
            context: card.context,
          })),
        }),
      });
      const responsePayload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(responsePayload, "Les cartes n'ont pas pu etre importees."),
        );
      }

      const parsed = importCardsResponseSchema.safeParse(responsePayload);

      if (!parsed.success) {
        throw new Error("La reponse d'import est invalide.");
      }

      setImportedCount(parsed.data.count);
      onImported(parsed.data.cards);
      setCurrentStep(4);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue pendant l'import.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-sm">
        <Badge variant="neutral">
          Etape {currentStep} / {stepOrder.length}
        </Badge>
        <p className="text-sm text-ink-secondary">{stepLabels[currentStep]}</p>
      </div>

      {currentStep === 1 ? (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (handleSourceValidation()) {
                setCurrentStep(2);
                setFormError(null);
              }
            }}
            variant="primary"
          >
            Continuer
          </Button>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="flex flex-col gap-sm sm:flex-row">
          <Button
            onClick={() => {
              setCurrentStep(1);
              setFormError(null);
            }}
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Button disabled={isGenerating} onClick={() => void handleGeneratePreview()}>
            {isGenerating ? <Spinner label="Generation" size="sm" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generation..." : "Generer un apercu"}
          </Button>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="flex flex-col gap-sm sm:flex-row">
          <Button
            disabled={isGenerating || isImporting}
            onClick={() => {
              setCurrentStep(2);
              setFormError(null);
            }}
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Ajuster
          </Button>

          <Button
            disabled={isGenerating || isImporting || selectedCount === 0}
            onClick={() => void handleImportSelected()}
            variant="primary"
          >
            {isImporting ? <Spinner label="Import" size="sm" /> : <Check className="h-4 w-4" />}
            {isImporting ? "Import..." : `Importer ${selectedCount} carte${selectedCount > 1 ? "s" : ""}`}
          </Button>
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="flex flex-col gap-sm sm:flex-row">
          <Button onClick={handleClose} variant="ghost">
            Fermer
          </Button>

          <Button
            onClick={() => {
              handleClose();
              router.push(studyHref);
            }}
            variant="primary"
          >
            <BookOpen className="h-4 w-4" />
            Etudier maintenant
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <Modal
      className="max-w-4xl"
      closeOnOverlayClick={!isBusy}
      description={`Prepare une generation de flashcards IA pour le deck ${deckName}.`}
      footer={footer}
      onClose={handleClose}
      open={open}
      title="Generer des cartes"
    >
      <div className="space-y-lg">
        <div className="grid gap-sm sm:grid-cols-4">
          {stepOrder.map((step) => (
            <div
              className={cn(
                "rounded-lg border px-md py-sm transition-colors duration-fast ease-smooth",
                currentStep === step
                  ? "border-accent-dim bg-accent-dim"
                  : currentStep > step
                    ? "border-info-ring bg-info-dim"
                    : "border-outline-subtle bg-surface-overlay",
              )}
              key={step}
            >
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Etape {step}
              </p>
              <p className="mt-xs text-sm font-medium text-ink-primary">
                {stepLabels[step]}
              </p>
            </div>
          ))}
        </div>

        {currentStep === 1 ? (
          <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-md">
              <div className="inline-flex rounded-full border border-outline-subtle bg-surface-overlay p-[4px]">
                {(["text", "pdf"] as const).map((value) => {
                  const isActive = sourceType === value;

                  return (
                    <button
                      className={cn(
                        "rounded-full px-md py-sm text-sm font-medium transition-colors duration-fast ease-smooth",
                        isActive
                          ? "bg-accent text-ink-inverse"
                          : "text-ink-secondary hover:text-ink-primary",
                      )}
                      key={value}
                      onClick={() => {
                        setSourceType(value);
                        setFieldErrors({});
                        setFormError(null);
                        clearGenerationResult();
                      }}
                      type="button"
                    >
                      {value === "text" ? "Texte" : "PDF"}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {sourceType === "text" ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 8 }}
                    key="text"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <SourceTextarea
                      error={fieldErrors.content}
                      hint="Ajoute un extrait de cours, des notes ou un resume. Les passages les plus structurants donnent de meilleures cartes."
                      label="Texte source"
                      maxLength={MAX_TEXT_LENGTH}
                      onChange={(value) => {
                        setContent(value);
                        setFieldErrors((currentErrors) => ({
                          ...currentErrors,
                          content: undefined,
                        }));
                        setFormError(null);
                        clearGenerationResult();
                      }}
                      placeholder="Colle ici le texte que Lumino doit transformer en flashcards."
                      value={content}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-md"
                    initial={{ opacity: 0, y: 8 }}
                    key="pdf"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <input
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        handleFileSelection(event.target.files?.[0] ?? null);
                      }}
                      ref={inputRef}
                      type="file"
                    />

                    <button
                      className={cn(
                        "flex min-h-[220px] w-full flex-col items-center justify-center gap-md rounded-xl border border-dashed px-lg py-xl text-center transition-colors duration-fast ease-smooth",
                        isDragActive
                          ? "border-accent bg-accent-dim"
                          : "border-outline-subtle bg-surface-overlay hover:border-outline",
                        fieldErrors.pdf ? "border-danger bg-danger-dim" : null,
                      )}
                      onClick={() => {
                        inputRef.current?.click();
                      }}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsDragActive(false);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDragActive(false);
                        handleFileSelection(event.dataTransfer.files?.[0] ?? null);
                      }}
                      type="button"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-subtle bg-surface-elevated">
                        <Upload className="h-6 w-6 text-accent" />
                      </div>
                      <div className="space-y-xs">
                        <p className="text-lg font-medium text-ink-primary">
                          Glisse ton PDF ici
                        </p>
                        <p className="text-sm text-ink-secondary">
                          ou clique pour choisir un fichier jusqu&apos;a 10 MB.
                        </p>
                      </div>
                    </button>

                    {pdfFile ? (
                      <Card className="rounded-xl bg-app-canvas p-md">
                        <div className="flex items-center justify-between gap-md">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink-primary">
                              {pdfFile.name}
                            </p>
                            <p className="mt-xs text-xs text-ink-secondary">
                              {formatBytes(pdfFile.size)}
                            </p>
                          </div>
                          <Badge variant="info">PDF pret</Badge>
                        </div>
                      </Card>
                    ) : null}

                    {fieldErrors.pdf ? (
                      <p className="text-xs text-danger">{fieldErrors.pdf}</p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Card className="rounded-xl bg-app-canvas">
              <div className="space-y-md">
                <Badge variant="accent">Deck cible</Badge>
                <div>
                  <h3 className="text-xl tracking-title text-ink-primary">{deckName}</h3>
                  <p className="mt-sm text-sm text-ink-secondary">
                    Le contenu genere sera propose pour import avant d&apos;etre ajoute au deck.
                  </p>
                </div>

                <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-md">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    Source active
                  </p>
                  <p className="mt-sm text-sm text-ink-primary">
                    {sourceType === "text" ? "Texte brut" : "Document PDF"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="rounded-xl">
              <div className="space-y-lg">
                <div className="space-y-sm">
                  <div className="flex items-center gap-sm text-ink-secondary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm">Nombre de cartes</p>
                  </div>
                  <div className="flex items-center justify-between gap-md">
                    <p className="text-3xl tracking-title text-ink-primary">{cardCount}</p>
                    <Badge variant="info">Entre 5 et 50</Badge>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
                    max={50}
                    min={5}
                    onChange={(event) => {
                      setCardCount(Number(event.target.value));
                      clearGenerationResult();
                    }}
                    type="range"
                    value={cardCount}
                  />
                </div>

                <div className="space-y-sm">
                  <div className="flex items-center gap-sm text-ink-secondary">
                    <Languages className="h-4 w-4" />
                    <p className="text-sm">Langue de restitution</p>
                  </div>

                  <div className="inline-flex rounded-full border border-outline-subtle bg-surface-overlay p-[4px]">
                    {(["fr", "en"] as const).map((value) => {
                      const isActive = language === value;

                      return (
                        <button
                          className={cn(
                            "rounded-full px-md py-sm text-sm font-medium transition-colors duration-fast ease-smooth",
                            isActive
                              ? "bg-accent text-ink-inverse"
                              : "text-ink-secondary hover:text-ink-primary",
                          )}
                          key={value}
                          onClick={() => {
                            setLanguage(value);
                            clearGenerationResult();
                          }}
                          type="button"
                        >
                          {value === "fr" ? "Francais" : "English"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl bg-app-canvas">
              <div className="space-y-md">
                <Badge variant="neutral">Recap</Badge>

                <div className="space-y-sm">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    Source
                  </p>
                  <p className="text-sm text-ink-primary">
                    {sourceType === "text"
                      ? `${content.trim().length} caracteres analyses`
                      : pdfFile
                        ? `${pdfFile.name} (${formatBytes(pdfFile.size)})`
                        : "Aucun PDF"}
                  </p>
                </div>

                <div className="space-y-sm">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    Parametres
                  </p>
                  <p className="text-sm text-ink-primary">
                    {cardCount} cartes, langue {language === "fr" ? "FR" : "EN"}.
                  </p>
                </div>

                <p className="text-sm text-ink-secondary">
                  Lumino va generer un apercu, puis tu choisiras exactement quelles cartes importer.
                </p>
              </div>
            </Card>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="space-y-md">
            {isGenerating ? (
              <Card className="rounded-xl bg-app-canvas">
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-lg text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent-dim bg-accent-dim">
                    <Spinner className="text-accent" label="Generation en cours" size="lg" />
                  </div>
                  <div className="space-y-sm">
                    <h3 className="text-2xl tracking-title text-ink-primary">
                      Generation de l&apos;apercu en cours
                    </h3>
                    <p className="max-w-xl text-sm text-ink-secondary">
                      Lumino extrait les concepts les plus utiles puis structure des cartes courtes, distinctes et directement memorisables.
                    </p>
                  </div>

                  <div className="grid w-full max-w-2xl gap-sm">
                    {[0, 1, 2].map((index) => (
                      <motion.div
                        animate={{ opacity: [0.35, 0.9, 0.35] }}
                        className="h-20 rounded-xl border border-outline-subtle bg-surface-overlay"
                        initial={{ opacity: 0.35 }}
                        key={index}
                        transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity, delay: index * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-ink-secondary">Apercu genere</p>
                    <h3 className="mt-xs text-2xl tracking-title text-ink-primary">
                      Garde uniquement les cartes pertinentes avant import.
                    </h3>
                  </div>

                  {previewCards.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-sm">
                      <Badge variant="accent">
                        {selectedCount} / {previewCards.length} selectionnees
                      </Badge>
                      <Button
                        onClick={() => {
                          const shouldSelectAll = selectedCount !== previewCards.length;
                          setPreviewCards((currentCards) =>
                            currentCards.map((card) => ({
                              ...card,
                              selected: shouldSelectAll,
                            })),
                          );
                        }}
                        variant="ghost"
                      >
                        {selectedCount === previewCards.length ? "Tout decocher" : "Tout cocher"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {previewCards.length > 0 ? (
                  <div className="max-h-[420px] space-y-md overflow-y-auto pr-xs">
                    {previewCards.map((card, index) => (
                      <motion.label
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "block cursor-pointer rounded-xl border p-md transition-colors duration-fast ease-smooth",
                          card.selected
                            ? "border-accent-dim bg-accent-dim"
                            : "border-outline-subtle bg-surface-overlay hover:border-outline",
                        )}
                        initial={{ opacity: 0, y: 8 }}
                        key={card.id}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 }}
                      >
                        <div className="flex items-start gap-md">
                          <input
                            checked={card.selected}
                            className="mt-[2px] h-4 w-4 accent-[var(--accent)]"
                            onChange={() => {
                              setPreviewCards((currentCards) =>
                                currentCards.map((currentCard) =>
                                  currentCard.id === card.id
                                    ? { ...currentCard, selected: !currentCard.selected }
                                    : currentCard,
                                ),
                              );
                            }}
                            type="checkbox"
                          />

                          <div className="min-w-0 flex-1 space-y-md">
                            <div className="flex items-center justify-between gap-sm">
                              <Badge variant={card.selected ? "accent" : "neutral"}>
                                Carte {index + 1}
                              </Badge>
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                {card.selected ? "Retenue" : "Ignoree"}
                              </p>
                            </div>

                            <div className="grid gap-md xl:grid-cols-2">
                              <div className="rounded-lg border border-outline-subtle bg-surface-elevated px-md py-md">
                                <p className="text-xs uppercase tracking-label text-ink-secondary">
                                  Recto
                                </p>
                                <p className="mt-sm whitespace-pre-wrap text-sm text-ink-primary">
                                  {card.front}
                                </p>
                              </div>

                              <div className="rounded-lg border border-outline-subtle bg-surface-elevated px-md py-md">
                                <p className="text-xs uppercase tracking-label text-ink-secondary">
                                  Verso
                                </p>
                                <p className="mt-sm whitespace-pre-wrap text-sm text-ink-primary">
                                  {card.back}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-outline-subtle bg-app-canvas px-md py-sm">
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                Contexte source
                              </p>
                              <p className="mt-sm whitespace-pre-wrap text-sm italic text-ink-secondary">
                                {card.context}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                ) : (
                  <Card className="rounded-xl border-dashed border-outline">
                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm text-ink-secondary">
                        <FileText className="h-4 w-4" />
                        <p className="text-sm">Aucune carte a afficher</p>
                      </div>
                      <p className="text-sm text-ink-secondary">
                        Ajuste la source ou relance la generation si tu veux un autre apercu.
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : null}

        {currentStep === 4 ? (
          <Card className="rounded-xl bg-app-canvas" glow>
            <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-sm">
                <Badge variant="success">Import termine</Badge>
                <h3 className="text-3xl tracking-title text-ink-primary">
                  {importedCount} carte{importedCount > 1 ? "s" : ""} ajoutee
                  {importedCount > 1 ? "s" : ""} au deck {deckName}
                </h3>
                <p className="max-w-2xl text-sm text-ink-secondary">
                  Le deck est deja enrichi. Tu peux fermer ce modal, continuer a editer les cartes ou ouvrir le mode etude quand il sera disponible.
                </p>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-success-ring bg-success-dim">
                <Check className="h-8 w-8 text-success" />
              </div>
            </div>
          </Card>
        ) : null}

        <AnimatePresence initial={false}>
          {formError ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-danger-ring bg-danger-dim px-md py-sm text-sm text-danger"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {formError}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
