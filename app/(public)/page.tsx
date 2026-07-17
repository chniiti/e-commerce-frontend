import { ProductExperience } from "@/components/public/ProductExperience";
import { getCurrentDrop } from "@/lib/api/products";

export const revalidate = 60;

export default async function HomePage() {
  let drop = null;

  try {
    drop = await getCurrentDrop();
  } catch {
    drop = null;
  }

  if (!drop) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--text)]">
        <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[var(--cyan)] uppercase">
          TRNDQ · Qatar
        </p>
        <h1 className="font-display mb-3 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
          The next drop is coming
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
          One trend at a time. When a drop goes live, this page becomes the
          reservation stage — not a catalog.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <ProductExperience product={drop} />
    </div>
  );
}
