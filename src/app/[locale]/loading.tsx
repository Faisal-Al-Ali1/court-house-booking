export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto max-w-2xl px-4 py-8 sm:px-6"
    >
      <div aria-hidden="true" className="space-y-4">
        <div className="h-12 w-1/3 rounded-md bg-ground-raised" />
        <div className="h-8 w-2/3 rounded-md bg-ground-raised" />
        <div className="h-64 rounded-lg border border-rule bg-ground-raised" />
      </div>
    </main>
  );
}
