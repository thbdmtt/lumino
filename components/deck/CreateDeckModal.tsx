"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, SwatchBook } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { deckColorValues, type DeckWithStats } from "@/types";
import { getDeckColorButtonClassName } from "./deck-theme";

const createDeckFormSchema = z.object({
  color: z.enum(deckColorValues),
  description: z
    .string()
    .trim()
    .max(500, "La description doit rester sous 500 caracteres.")
    .transform((value: string) => value),
  name: z
    .string()
    .trim()
    .min(1, "Le nom du deck est requis.")
    .max(80, "Le nom du deck doit rester sous 80 caracteres."),
});

const createDeckResponseSchema = z.object({
  deck: z.object({
    cardCount: z.number().int().nonnegative(),
    color: z.string(),
    createdAt: z.number().int().nonnegative(),
    description: z.string().nullable(),
    dueTodayCount: z.number().int().nonnegative(),
    id: z.string().uuid(),
    name: z.string(),
    updatedAt: z.number().int().nonnegative(),
    userId: z.string().uuid(),
  }),
});

type CreateDeckFormValues = z.infer<typeof createDeckFormSchema>;

type CreateDeckFieldErrors = Partial<Record<keyof CreateDeckFormValues, string>>;

export interface CreateDeckModalProps {
  onClose: () => void;
  onCreated: (deck: DeckWithStats) => void;
  open: boolean;
}

const DEFAULT_FORM_VALUES: CreateDeckFormValues = {
  color: deckColorValues[0],
  description: "",
  name: "",
};

function getFieldErrors(
  error: z.ZodError<CreateDeckFormValues>,
): CreateDeckFieldErrors {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    color: fieldErrors.color?.[0],
    description: fieldErrors.description?.[0],
    name: fieldErrors.name?.[0],
  };
}

interface TextareaFieldProps {
  error?: string;
  hint?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function TextareaField({
  error,
  hint,
  label,
  name,
  onChange,
  placeholder,
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
          "min-h-[132px] w-full resize-none rounded-md border border-outline-subtle bg-surface-overlay px-md py-[12px] text-base text-ink-primary shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-normal ease-smooth placeholder:text-ink-tertiary focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-dim)]",
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

export function CreateDeckModal({
  onClose,
  onCreated,
  open,
}: CreateDeckModalProps): JSX.Element {
  const [values, setValues] = useState<CreateDeckFormValues>(DEFAULT_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<CreateDeckFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm(): void {
    setValues(DEFAULT_FORM_VALUES);
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(false);
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = createDeckFormSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      setFormError("Corrige les champs signales avant de creer le deck.");
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          color: parsed.data.color,
          description: parsed.data.description,
          name: parsed.data.name,
        }),
      });

      const payload = createDeckResponseSchema.safeParse(await response.json());

      if (!response.ok) {
        setFormError("Impossible de creer le deck pour le moment.");
        return;
      }

      if (!payload.success) {
        setFormError("La reponse du serveur est invalide.");
        return;
      }

      onCreated(payload.data.deck);
      resetForm();
      onClose();
    } catch {
      setFormError("Une erreur reseau est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      description="Donne une identite claire au deck pour organiser tes futures cartes."
      onClose={handleClose}
      open={open}
      title="Nouveau deck"
    >
      <form className="space-y-lg" noValidate onSubmit={handleSubmit}>
        <Input
          autoComplete="off"
          error={fieldErrors.name}
          label="Nom du deck"
          maxLength={80}
          name="name"
          onChange={(event) => {
            setValues((currentValues) => ({
              ...currentValues,
              name: event.target.value,
            }));

            if (fieldErrors.name || formError) {
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                name: undefined,
              }));
              setFormError(null);
            }
          }}
          placeholder="Ex: Espagnol voyage"
          value={values.name}
        />

        <TextareaField
          error={fieldErrors.description}
          hint="Optionnel. Une bonne description aide a distinguer les collections voisines."
          label="Description"
          name="description"
          onChange={(value: string) => {
            setValues((currentValues) => ({
              ...currentValues,
              description: value,
            }));

            if (fieldErrors.description || formError) {
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                description: undefined,
              }));
              setFormError(null);
            }
          }}
          placeholder="Mots et tournures a revoir avant le depart."
          value={values.description}
        />

        <div className="space-y-sm">
          <div className="flex items-center gap-sm">
            <SwatchBook className="h-4 w-4 text-ink-secondary" />
            <p className="text-sm font-medium text-ink-primary">Couleur</p>
          </div>

          <div className="grid grid-cols-4 gap-sm sm:grid-cols-8">
            {deckColorValues.map((color) => {
              const isSelected = values.color === color;

              return (
                <button
                  aria-label={`Selectionner la couleur ${color}`}
                  className={getDeckColorButtonClassName(color, isSelected)}
                  key={color}
                  onClick={() => {
                    setValues((currentValues) => ({
                      ...currentValues,
                      color,
                    }));

                    if (fieldErrors.color || formError) {
                      setFieldErrors((currentErrors) => ({
                        ...currentErrors,
                        color: undefined,
                      }));
                      setFormError(null);
                    }
                  }}
                  type="button"
                >
                  {isSelected ? <Check className="h-4 w-4 text-white" /> : null}
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {fieldErrors.color ? (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-danger"
                exit={{ opacity: 0, y: -2 }}
                initial={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                {fieldErrors.color}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

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
          <Button disabled={isSubmitting} onClick={handleClose} variant="ghost">
            Annuler
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? <Spinner label="Creation du deck" size="sm" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? "Creation..." : "Creer le deck"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
