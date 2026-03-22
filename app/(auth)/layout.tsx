import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <main className="min-h-screen bg-app-canvas px-md py-xl text-ink-primary sm:px-lg sm:py-2xl">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-lg lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
          <section className="hidden rounded-xl border border-outline bg-surface-glass p-xl shadow-lg backdrop-blur-glass lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-label text-accent">
                Lumino
              </p>
              <h1 className="mt-md max-w-lg text-4xl tracking-title text-ink-primary">
                Revision, generation et repetition espacee dans une interface sobre.
              </h1>
              <p className="mt-md max-w-xl text-base text-ink-secondary">
                Connecte-toi ou cree un compte pour retrouver tes decks, lancer une
                session d&apos;etude et gerer tes cartes depuis le meme environnement.
              </p>
            </div>

            <div className="rounded-lg border border-outline-subtle bg-surface-elevated p-lg">
              <p className="text-sm text-ink-secondary">Acces</p>
              <p className="mt-sm text-sm text-ink-primary">
                Authentification email + mot de passe, parcours centre, contrastes
                retenus et lecture stable sur mobile comme sur desktop.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-outline bg-surface-glass p-lg shadow-lg backdrop-blur-glass sm:p-xl">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
