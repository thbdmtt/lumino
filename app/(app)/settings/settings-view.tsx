"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, KeyRound, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { z } from "zod";
import { Badge, Button, Card, Input, Modal, Spinner, Toast } from "@/components/ui";

const apiKeyFormSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "Entre une cle Anthropic valide.")
    .max(256, "La cle semble invalide."),
});

const changePasswordFormSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirme le nouveau mot de passe."),
    currentPassword: z.string().min(8, "Entre le mot de passe actuel."),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caracteres."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Les mots de passe doivent etre identiques.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "Choisis un mot de passe different de l'actuel.",
    path: ["newPassword"],
  });

const deleteAccountFormSchema = z.object({
  password: z.string().min(8, "Entre ton mot de passe pour confirmer."),
});

interface SettingsViewProps {
  email: string;
  hasPersonalApiKey: boolean;
  serverApiKeyConfigured: boolean;
}

interface ToastState {
  description?: string;
  title: string;
  variant: "danger" | "success" | "warning";
}

interface ChangePasswordValues {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
}

type ChangePasswordFieldErrors = Partial<Record<keyof ChangePasswordValues, string>>;

const DEFAULT_CHANGE_PASSWORD_VALUES: ChangePasswordValues = {
  confirmPassword: "",
  currentPassword: "",
  newPassword: "",
};

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

function getPasswordFieldErrors(
  error: z.ZodError<ChangePasswordValues>,
): ChangePasswordFieldErrors {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    confirmPassword: fieldErrors.confirmPassword?.[0],
    currentPassword: fieldErrors.currentPassword?.[0],
    newPassword: fieldErrors.newPassword?.[0],
  };
}

export function SettingsView({
  email,
  hasPersonalApiKey: initialHasPersonalApiKey,
  serverApiKeyConfigured,
}: SettingsViewProps): JSX.Element {
  const router = useRouter();
  const [hasPersonalApiKey, setHasPersonalApiKey] = useState(initialHasPersonalApiKey);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isRemovingApiKey, setIsRemovingApiKey] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordValues, setChangePasswordValues] = useState<ChangePasswordValues>(
    DEFAULT_CHANGE_PASSWORD_VALUES,
  );
  const [changePasswordErrors, setChangePasswordErrors] =
    useState<ChangePasswordFieldErrors>({});
  const [changePasswordFormError, setChangePasswordFormError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleteFormError, setDeleteFormError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  async function handleSaveApiKey(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = apiKeyFormSchema.safeParse({
      apiKey: apiKeyValue,
    });

    if (!parsed.success) {
      const nextError = parsed.error.flatten().fieldErrors.apiKey?.[0] ?? "Cle invalide.";
      setApiKeyError(nextError);
      return;
    }

    setApiKeyError(null);
    setIsSavingApiKey(true);

    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Impossible d'enregistrer la cle."));
      }

      setHasPersonalApiKey(true);
      setApiKeyValue("");
      setToastState({
        description:
          "Ta cle personnelle sera prioritaire pour les prochaines generations de cartes.",
        title: "Cle Anthropic enregistree",
        variant: "success",
      });
    } catch (error) {
      setToastState({
        description:
          error instanceof Error
            ? error.message
            : "La cle n'a pas pu etre enregistree.",
        title: "Enregistrement impossible",
        variant: "danger",
      });
    } finally {
      setIsSavingApiKey(false);
    }
  }

  async function handleRemoveApiKey(): Promise<void> {
    setApiKeyError(null);
    setIsRemovingApiKey(true);

    try {
      const response = await fetch("/api/settings/api-key", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Impossible de supprimer la cle."));
      }

      setHasPersonalApiKey(false);
      setApiKeyValue("");
      setToastState({
        description:
          serverApiKeyConfigured
            ? "Lumino reviendra sur la cle serveur pour les prochaines generations."
            : "Aucune cle personnelle n'est maintenant enregistree sur ton compte.",
        title: "Cle personnelle supprimee",
        variant: "success",
      });
    } catch (error) {
      setToastState({
        description:
          error instanceof Error
            ? error.message
            : "La suppression de la cle a echoue.",
        title: "Suppression impossible",
        variant: "danger",
      });
    } finally {
      setIsRemovingApiKey(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Impossible de te deconnecter."));
      }

      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch (error) {
      setToastState({
        description:
          error instanceof Error ? error.message : "La deconnexion a echoue.",
        title: "Deconnexion impossible",
        variant: "danger",
      });
      setIsSigningOut(false);
    }
  }

  function closeChangePasswordModal(): void {
    setIsChangePasswordOpen(false);
    setChangePasswordValues(DEFAULT_CHANGE_PASSWORD_VALUES);
    setChangePasswordErrors({});
    setChangePasswordFormError(null);
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = changePasswordFormSchema.safeParse(changePasswordValues);

    if (!parsed.success) {
      setChangePasswordErrors(getPasswordFieldErrors(parsed.error));
      setChangePasswordFormError("Corrige les champs signales avant de continuer.");
      return;
    }

    setChangePasswordErrors({});
    setChangePasswordFormError(null);
    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload, "Impossible de modifier le mot de passe."),
        );
      }

      closeChangePasswordModal();
      setToastState({
        description:
          "Le mot de passe a ete mis a jour et les autres sessions ont ete revoquees.",
        title: "Mot de passe modifie",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "La mise a jour a echoue.";
      setChangePasswordFormError(message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  function closeDeleteAccountModal(): void {
    setIsDeleteAccountOpen(false);
    setDeletePassword("");
    setDeletePasswordError(null);
    setDeleteFormError(null);
  }

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const parsed = deleteAccountFormSchema.safeParse({
      password: deletePassword,
    });

    if (!parsed.success) {
      setDeletePasswordError(
        parsed.error.flatten().fieldErrors.password?.[0] ??
          "Entre ton mot de passe pour confirmer.",
      );
      setDeleteFormError("La confirmation est requise.");
      return;
    }

    setDeletePasswordError(null);
    setDeleteFormError(null);
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload, "Impossible de supprimer le compte."),
        );
      }

      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "La suppression du compte a echoue.";
      setDeleteFormError(message);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <>
      <div className="grid gap-md xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-xl">
          <div className="space-y-lg">
            <div className="space-y-sm">
              <Badge variant="accent">Compte</Badge>
              <div className="space-y-xs">
                <h2 className="text-2xl tracking-title text-ink-primary">
                  Identifiants et session
                </h2>
                <p className="text-sm text-ink-secondary">
                  Consulte l&apos;email rattache au compte, change le mot de passe et
                  coupe la session courante.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-outline-subtle bg-surface-overlay p-md">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Adresse email
              </p>
              <p className="mt-sm break-all text-base font-medium text-ink-primary">{email}</p>
            </div>

            <div className="flex flex-col gap-sm sm:flex-row">
              <Button
                className="sm:flex-1"
                onClick={() => {
                  setIsChangePasswordOpen(true);
                }}
                variant="secondary"
              >
                <ShieldCheck className="h-4 w-4" />
                Changer le mot de passe
              </Button>

              <Button
                className="sm:flex-1"
                disabled={isSigningOut}
                onClick={() => {
                  void handleSignOut();
                }}
                variant="ghost"
              >
                {isSigningOut ? (
                  <>
                    <Spinner className="text-ink-primary" label="Deconnexion en cours" size="sm" />
                    Deconnexion...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Se deconnecter
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl">
          <div className="space-y-lg">
            <div className="space-y-sm">
              <div className="flex items-center justify-between gap-sm">
                <Badge variant={hasPersonalApiKey ? "success" : "warning"}>
                  {hasPersonalApiKey ? "Cle enregistree" : "Configuration requise"}
                </Badge>
                {serverApiKeyConfigured ? (
                  <p className="text-xs text-ink-secondary">Fallback serveur actif</p>
                ) : (
                  <p className="text-xs text-ink-secondary">Aucun fallback serveur</p>
                )}
              </div>

              <div className="space-y-xs">
                <h2 className="text-2xl tracking-title text-ink-primary">
                  API Key Anthropic
                </h2>
                <p className="text-sm text-ink-secondary">
                  Enregistre une cle personnelle chiffree en base pour generer des cartes
                  sans dependre de la cle globale de l&apos;application.
                </p>
              </div>
            </div>

            <form className="space-y-md" noValidate onSubmit={handleSaveApiKey}>
              <Input
                autoComplete="off"
                error={apiKeyError ?? undefined}
                hint={
                  hasPersonalApiKey
                    ? "Ta cle actuelle n'est jamais reaffichee. Entre une nouvelle valeur pour la remplacer."
                    : "Entre une cle Anthropic personnelle. Elle sera chiffree avant stockage."
                }
                label="Cle Anthropic"
                name="api-key"
                onChange={(event) => {
                  setApiKeyValue(event.target.value);
                  if (apiKeyError) {
                    setApiKeyError(null);
                  }
                }}
                placeholder="sk-ant-api03-..."
                type="password"
                value={apiKeyValue}
              />

              <div className="flex flex-col gap-sm sm:flex-row">
                <Button className="sm:flex-1" disabled={isSavingApiKey} type="submit">
                  {isSavingApiKey ? (
                    <>
                      <Spinner className="text-ink-inverse" label="Enregistrement de la cle" size="sm" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Enregistrer la cle
                    </>
                  )}
                </Button>

                <Button
                  className="sm:flex-1"
                  disabled={!hasPersonalApiKey || isRemovingApiKey}
                  onClick={() => {
                    void handleRemoveApiKey();
                  }}
                  variant="secondary"
                >
                  {isRemovingApiKey ? (
                    <>
                      <Spinner className="text-ink-primary" label="Suppression de la cle" size="sm" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer la cle"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <Card className="mt-md rounded-xl border-danger-ring bg-[rgba(36,14,14,0.88)]">
        <div className="space-y-lg">
          <div className="space-y-sm">
            <Badge variant="danger">Danger zone</Badge>
            <div className="space-y-xs">
              <h2 className="text-2xl tracking-title text-ink-primary">
                Supprimer mon compte
              </h2>
              <p className="max-w-3xl text-sm text-ink-secondary">
                Cette action est irreversible. Tous les decks, cartes, reviews et sessions
                associes a ce compte seront supprimes.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-danger-ring bg-danger-dim p-md">
            <div className="flex items-start gap-sm">
              <AlertTriangle className="mt-[2px] h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm text-danger">
                Utilise cette action uniquement si tu veux effacer completement ton espace
                Lumino.
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setIsDeleteAccountOpen(true);
            }}
            variant="danger"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer mon compte
          </Button>
        </div>
      </Card>

      <Modal
        description="Confirme ton mot de passe actuel puis definis un nouveau mot de passe."
        footer={
          <div className="flex flex-col gap-sm sm:flex-row sm:justify-end">
            <Button onClick={closeChangePasswordModal} variant="ghost">
              Annuler
            </Button>
            <Button disabled={isChangingPassword} form="change-password-form" type="submit">
              {isChangingPassword ? (
                <>
                  <Spinner className="text-ink-inverse" label="Mise a jour du mot de passe" size="sm" />
                  Mise a jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        }
        onClose={closeChangePasswordModal}
        open={isChangePasswordOpen}
        title="Changer le mot de passe"
      >
        <form className="space-y-md" id="change-password-form" noValidate onSubmit={handleChangePassword}>
          <Input
            autoComplete="current-password"
            error={changePasswordErrors.currentPassword}
            label="Mot de passe actuel"
            onChange={(event) => {
              setChangePasswordValues((currentValues) => ({
                ...currentValues,
                currentPassword: event.target.value,
              }));
              if (changePasswordErrors.currentPassword || changePasswordFormError) {
                setChangePasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  currentPassword: undefined,
                }));
                setChangePasswordFormError(null);
              }
            }}
            type="password"
            value={changePasswordValues.currentPassword}
          />

          <Input
            autoComplete="new-password"
            error={changePasswordErrors.newPassword}
            label="Nouveau mot de passe"
            onChange={(event) => {
              setChangePasswordValues((currentValues) => ({
                ...currentValues,
                newPassword: event.target.value,
              }));
              if (changePasswordErrors.newPassword || changePasswordFormError) {
                setChangePasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  newPassword: undefined,
                }));
                setChangePasswordFormError(null);
              }
            }}
            type="password"
            value={changePasswordValues.newPassword}
          />

          <Input
            autoComplete="new-password"
            error={changePasswordErrors.confirmPassword}
            label="Confirmer le nouveau mot de passe"
            onChange={(event) => {
              setChangePasswordValues((currentValues) => ({
                ...currentValues,
                confirmPassword: event.target.value,
              }));
              if (changePasswordErrors.confirmPassword || changePasswordFormError) {
                setChangePasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  confirmPassword: undefined,
                }));
                setChangePasswordFormError(null);
              }
            }}
            type="password"
            value={changePasswordValues.confirmPassword}
          />

          <AnimatePresence initial={false}>
            {changePasswordFormError ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-danger-ring bg-danger-dim px-md py-sm"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-sm text-danger">{changePasswordFormError}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </Modal>

      <Modal
        description="Entre ton mot de passe pour confirmer la suppression irreversible du compte."
        footer={
          <div className="flex flex-col gap-sm sm:flex-row sm:justify-end">
            <Button onClick={closeDeleteAccountModal} variant="ghost">
              Annuler
            </Button>
            <Button disabled={isDeletingAccount} form="delete-account-form" type="submit" variant="danger">
              {isDeletingAccount ? (
                <>
                  <Spinner className="text-danger" label="Suppression du compte" size="sm" />
                  Suppression...
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </Button>
          </div>
        }
        onClose={closeDeleteAccountModal}
        open={isDeleteAccountOpen}
        title="Supprimer le compte"
      >
        <form className="space-y-md" id="delete-account-form" noValidate onSubmit={handleDeleteAccount}>
          <div className="rounded-lg border border-danger-ring bg-danger-dim px-md py-md">
            <p className="text-sm text-danger">
              Tous les decks, toutes les cartes et tout l&apos;historique SM-2 seront
              supprimes de facon definitive.
            </p>
          </div>

          <Input
            autoComplete="current-password"
            error={deletePasswordError ?? undefined}
            label="Mot de passe"
            onChange={(event) => {
              setDeletePassword(event.target.value);
              if (deletePasswordError || deleteFormError) {
                setDeletePasswordError(null);
                setDeleteFormError(null);
              }
            }}
            type="password"
            value={deletePassword}
          />

          <AnimatePresence initial={false}>
            {deleteFormError ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-danger-ring bg-danger-dim px-md py-sm"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-sm text-danger">{deleteFormError}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </Modal>

      <Toast
        description={toastState?.description}
        onClose={() => {
          setToastState(null);
        }}
        open={Boolean(toastState)}
        title={toastState?.title ?? ""}
        variant={toastState?.variant ?? "success"}
      />
    </>
  );
}
