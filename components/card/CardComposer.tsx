"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button, Input, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

const cardFormSchema = z.object({
  back: z
    .string()
    .trim()
    .min(1, "Le verso est requis.")
    .max(4000, "Le verso doit rester sous 4000 caracteres."),
  context: z
    .string()
    .trim()
    .max(500, "Le contexte doit rester sous 500 caracteres.")
    .transform((value: string) => value),
  front: z
    .string()
    .trim()
    .min(1, "Le recto est requis.")
    .max(240, "Le recto doit rester sous 240 caracteres."),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

type CardFieldErrors = Partial<Record<keyof CardFormValues, string>>;

export interface CardComposerProps {
  className?: string;
  defaultValues?: Partial<CardFormValues>;
  description?: string;
  onCancel?: () => void;
  onSubmit: (values: CardFormValues) => Promise<void>;
  submitLabel: string;
  title: string;
}

interface TextareaFieldProps {
  error?: string;
  hint?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}

const DEFAULT_FORM_VALUES: CardFormValues = {
  back: "",
  context: "",
  front: "",
};

function buildFormValues(defaultValues?: Partial<CardFormValues>): CardFormValues {
  return {
    front: defaultValues?.front ?? DEFAULT_FORM_VALUES.front,
    back: defaultValues?.back ?? DEFAULT_FORM_VALUES.back,
    context: defaultValues?.context ?? DEFAULT_FORM_VALUES.context,
  };
}

function getFieldErrors(error: z.ZodError<CardFormValues>): CardFieldErrors {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    back: fieldErrors.back?.[0],
    context: fieldErrors.context?.[0],
    front: fieldErrors.front?.[0],
  };
}

function TextareaField({
  error,
  hint,
  label,
  name,
  onChange,
  placeholder,
  rows = 4,
  value,
}: TextareaFieldProps): JSX.Element {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-sm">
      <label className="block text-sm font-medium text-ink-primary" htmlFor={name}>
        {label}
      </label>

      <textarea
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full resize-none rounded-md border border-outline-subtle bg-surface-overlay px-md py-[12px] text-base text-ink-primary shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-normal ease-smooth placeholder:text-ink-tertiary focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-dim)]",
          error
            ? "border-danger shadow-[0_0_0_3px_var(--danger-dim)] focus-visible:border-danger focus-visible:shadow-[0_0_0_3px_var(--danger-dim)]"
            : null,
        )}
        id={name}
        name={name}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />

      {hint ? (
        <p className="text-xs text-ink-secondary" id={hintId}>
          {hint}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-danger"
            exit={{ opacity: 0, y: -2 }}
            id={errorId}
            initial={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CardComposer({
  className,
  defaultValues,
  description,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: CardComposerProps): JSX.Element {
  const [values, setValues] = useState<CardFormValues>(buildFormValues(defaultValues));
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(buildFormValues(defaultValues));
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(false);
  }, [defaultValues]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = cardFormSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      setFormError("Corrige les champs signales avant d'enregistrer la carte.");
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(parsed.data);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-outline bg-surface-elevated p-lg shadow-md",
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="space-y-xs">
        <h3 className="text-xl tracking-title text-ink-primary">{title}</h3>
        {description ? <p className="text-sm text-ink-secondary">{description}</p> : null}
      </div>

      <form className="mt-lg space-y-md" noValidate onSubmit={handleSubmit}>
        <Input
          autoComplete="off"
          error={fieldErrors.front}
          label="Recto"
          maxLength={240}
          name="front"
          onChange={(event) => {
            setValues((currentValues) => ({
              ...currentValues,
              front: event.target.value,
            }));

            if (fieldErrors.front || formError) {
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                front: undefined,
              }));
              setFormError(null);
            }
          }}
          placeholder="Question ou prompt a memoriser"
          value={values.front}
        />

        <TextareaField
          error={fieldErrors.back}
          hint="Le verso peut contenir plusieurs phrases ou une liste breve."
          label="Verso"
          name="back"
          onChange={(value: string) => {
            setValues((currentValues) => ({
              ...currentValues,
              back: value,
            }));

            if (fieldErrors.back || formError) {
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                back: undefined,
              }));
              setFormError(null);
            }
          }}
          placeholder="Reponse, explication, definition..."
          rows={5}
          value={values.back}
        />

        <TextareaField
          error={fieldErrors.context}
          hint="Optionnel. Source, exemple ou nuance complementaire."
          label="Contexte"
          name="context"
          onChange={(value: string) => {
            setValues((currentValues) => ({
              ...currentValues,
              context: value,
            }));

            if (fieldErrors.context || formError) {
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                context: undefined,
              }));
              setFormError(null);
            }
          }}
          placeholder="Ex: resume du passage de cours ou phrase d'origine."
          rows={3}
          value={values.context}
        />

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

        <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
              <X className="h-4 w-4" />
              Annuler
            </Button>
          ) : null}

          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? <Spinner label={submitLabel} size="sm" /> : <Save className="h-4 w-4" />}
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
