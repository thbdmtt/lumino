"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { z } from "zod";
import { Badge, Button, Input, Spinner, Toast } from "@/components/ui";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est requise.")
    .email("Entre une adresse email valide."),
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;

interface ToastState {
  description?: string;
  title: string;
}

const DEFAULT_VALUES: LoginFormValues = {
  email: "",
  password: "",
};

function getFieldErrors(error: z.ZodError<LoginFormValues>): LoginFieldErrors {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
}

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = loginFormSchema.safeParse({
      email: values.email,
      password: values.password,
    });

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      setFormError("Corrige les champs signales avant de continuer.");
      setToastState({
        description: "L'email et le mot de passe doivent respecter le format attendu.",
        title: "Validation incomplete",
      });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        const message = payload.error ?? "Impossible de se connecter pour le moment.";
        setFormError(message);
        setToastState({
          description: "Verifie tes identifiants ou reessaie dans un instant.",
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
        description: "La requete n'a pas pu aboutir. Verifie ta connexion puis reessaie.",
        title: "Connexion indisponible",
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
          <Badge variant="accent">Connexion</Badge>

          <div className="space-y-sm">
            <h1 className="text-3xl tracking-title text-ink-primary sm:text-4xl">
              Reprends ta pile de revision exactement la ou tu l&apos;as laissee.
            </h1>
            <p className="max-w-xl text-base text-ink-secondary">
              Connecte-toi a Lumino pour retrouver tes decks, tes cartes dues et
              les prochains cycles SM-2.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-outline-subtle bg-surface-elevated p-md shadow-sm">
          <p className="text-sm text-ink-secondary">Acces</p>
          <p className="mt-xs text-sm text-ink-primary">
            Email + mot de passe uniquement pour la v1. L&apos;authentification reste
            entierement geree cote serveur via Better Auth.
          </p>
        </div>

        <form className="space-y-md" noValidate onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            error={fieldErrors.email}
            hint="Utilise l'adresse email associee a ton compte."
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
            autoComplete="current-password"
            error={fieldErrors.password}
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
                  <Spinner className="text-ink-inverse" label="Connexion en cours" size="sm" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>

            <p className="text-center text-sm text-ink-secondary">
              Pas encore de compte ?{" "}
              <Link
                className="font-medium text-accent transition-colors duration-fast ease-smooth hover:text-ink-primary"
                href="/register"
              >
                Creer un compte
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
