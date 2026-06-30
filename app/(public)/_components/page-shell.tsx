export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cloud-page px-4 py-8 text-cloud-text sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {children}
      </div>
    </main>
  );
}
