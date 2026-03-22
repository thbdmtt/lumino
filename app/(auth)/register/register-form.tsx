"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { z } from "zod";
import { Badge, Button, Input, Spinner, Toast } from "@/components/ui";

const registerFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "L'adresse email est requise.")
      .email("Entre une adresse email valide."),
    password: z
      .string()
      .min(1, "Le mot de passe est requis.")
      .min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
    confirmPassword: z
      .string()
      .min(1, "Confirme ton mot de passe.")
      .min(8, "La confirmation doit contenir au moins 8 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe doivent etre identiques.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

type RegisterFieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

interface ToastState {
  description?: string;
  title: string;
}

const DEFAULT_VALUES: RegisterFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

function getFieldErrors(
  error: z.ZodError<RegisterFormValues>,
): RegisterFieldErrors {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
  };
}

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = registerFormSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      setFormError("Corrige les champs signales avant de continuer.");
      setToastState({
        description:
          "L'email doit etre valide et les deux mots de passe doivent correspondre.",
        title: "Validation incomplete",
      });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        const message = payload.error ?? "Impossible de creer le compte pour le moment.";
        setFormError(message);
        setToastState({
          description: "Essaie une autre adresse email ou reessaie dans un instant.",
          title: message,
        });
        return;
      }

      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } catch {
      setFormError("Une erreur reseau est survenue.");
      setToastState({
        description:
          "La requete n'a pas pu aboutir. Verifie ta connexion puis reessaie.",
        title: "Inscription indisponible",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting;

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-lg"
        initial={{ opacity: 1, y: 8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="space-y-md">
          <Badge variant="accent">Inscription</Badge>

          <div className="space-y-sm">
            <h1 className="text-3xl tracking-title text-ink-primary sm:text-4xl">
              Cree un compte Lumino et lance ton premier cycle de revision.
            </h1>
            <p className="max-w-xl text-base text-ink-secondary">
              Demarre avec une adresse email, choisis un mot de passe robuste,
              puis rejoins directement le dashboard apres l&apos;inscription.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-outline-subtle bg-surface-elevated p-md shadow-sm">
          <p className="text-sm text-ink-secondary">Acces</p>
          <p className="mt-xs text-sm text-ink-primary">
            L&apos;inscription utilise Better Auth cote serveur puis ouvre
            immediatement la session de l&apos;utilisateur.
          </p>
        </div>

        <form className="space-y-md" noValidate onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            error={fieldErrors.email}
            hint="Cette adresse servira aussi d'identifiant de connexion."
            label="Adresse email"
            name="email"
            onChange={(event) => {
              const nextEmail = event.target.value;
              setValues((currentValues) => ({ ...currentValues, email: nextEmail }));

              if (fieldErrors.email || formError) {
                setFieldErrors((currentErrors) => ({
                  ...currentErrors,
                  email: undefined,
                }));
                setFormError(null);
              }
            }}
            placeholder="toi@example.com"
            type="email"
            value={values.email}
          />

          <Input
            autoComplete="new-password"
            error={fieldErrors.password}
            hint="Minimum 8 caracteres."
            label="Mot de passe"
            name="password"
            onChange={(event) => {
              const nextPassword = event.target.value;
              setValues((currentValues) => ({
                ...currentValues,
                password: nextPassword,
              }));

              if (fieldErrors.password || formError) {
                setFieldErrors((currentErrors) => ({
                  ...currentErrors,
                  password: undefined,
                }));
                setFormError(null);
              }
            }}
            placeholder="Au moins 8 caracteres"
            type="password"
            value={values.password}
          />

          <Input
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            label="Confirmer le mot de passe"
            name="confirmPassword"
            onChange={(event) => {
              const nextConfirmPassword = event.target.value;
              setValues((currentValues) => ({
                ...currentValues,
                confirmPassword: nextConfirmPassword,
              }));

              if (fieldErrors.confirmPassword || formError) {
                setFieldErrors((currentErrors) => ({
                  ...currentErrors,
                  confirmPassword: undefined,
                }));
                setFormError(null);
              }
            }}
            placeholder="Retape ton mot de passe"
            type="password"
            value={values.confirmPassword}
          />

          <AnimatePresence initial={false}>
            {formError ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-danger-ring bg-danger-dim px-md py-sm"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-sm text-danger">{formError}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="space-y-sm pt-sm">
            <Button className="w-full" disabled={isBusy} type="submit">
              {isBusy ? (
                <>
                  <Spinner
                    className="text-ink-inverse"
                    label="Inscription en cours"
                    size="sm"
                  />
                  Creation du compte...
                </>
              ) : (
                "Creer un compte"
              )}
            </Button>

            <p className="text-center text-sm text-ink-secondary">
              Deja inscrit ?{" "}
              <Link
                className="font-medium text-accent transition-colors duration-fast ease-smooth hover:text-ink-primary"
                href="/login"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </motion.div>

      <Toast
        description={toastState?.description}
        onClose={() => {
          setToastState(null);
        }}
        open={Boolean(toastState)}
        title={toastState?.title ?? ""}
        variant="danger"
      />
    </>
  );
}
