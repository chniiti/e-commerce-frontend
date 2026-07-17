# TrendDrop — Landing Page Integration: Cursor Prompt

**How to use this:** Attach `trenddrop-landing-mockup-v2.html` (the reference file) to your Cursor chat alongside this prompt, in your Next.js frontend project.

---

## PROMPT

I have a finished, working HTML/CSS/JS reference for the product landing page design — `trenddrop-landing-mockup-v2.html`, attached. Every interaction in it is final and approved: the iris reveal animation on load, the auto-rotating product stage with drag-to-rotate, click-to-cycle-color, the dedicated zoom-icon popup with pinch/scroll zoom and pan, the light/dark theme toggle (light is default), the countdown timer, the stock urgency bar, the sticky buy bar that appears once the main button scrolls out of view, and the toast confirmation on purchase actions.

Rebuild this as the real Next.js product landing page: `app/(public)/product/[slug]/page.tsx` plus supporting components under `components/public/`. Match the reference file's visual design, animations, and interaction behavior exactly — same colors, same timing, same structure — but implement it properly as:

### 1. Design tokens
Extract the CSS custom properties from the reference file (`--molten`, `--cyan`, `--bg`, `--surface`, etc., for both `light` and `dark` themes) into the Tailwind config (`tailwind.config.ts` `theme.extend.colors`) and a `ThemeProvider` context, rather than leaving them as inline `<style>` custom properties. Default theme = `light`, matching the reference.

### 2. Component breakdown
- `ProductStage.tsx` — the rotating/tiltable product display, auto-rotation, drag interaction, click-to-cycle-color. Accepts `variants: { name: string; imageUrl: string }[]` as a prop.
- `ZoomModal.tsx` — the popup with pinch/scroll zoom, pan-when-zoomed, color swatches inside, and its own Buy Now button.
- `VariantSelector.tsx` — the color swatch row beneath the price.
- `CountdownTimer.tsx` — accepts a target `Date`, ticks down, matches the reference's tabular-numeral styling.
- `StockBar.tsx` — accepts current/total stock, renders the animated urgency bar + label.
- `BuyNowDialog.tsx` — triggered by any "Buy now" button (main, sticky, or inside the zoom modal); this is where the real reservation form goes (first name, last name, phone, email, delivery location, payment method) — replacing the reference's placeholder toast.
- `StickyBuyBar.tsx` — uses `IntersectionObserver` (same pattern as the reference) on the main buy button to show/hide.
- `ThemeToggle.tsx` — the sun/moon morphing knob.

### 3. Critical data model change this requires
**Products need per-color images, not one image per product.** The reference file crossfades between `.product-photo` divs — in the real component, each `variant` needs its own `imageUrl` (or, for the full 360-spin version described in code comments in the reference file, a `spinFrames: string[]` array of 24-36 images per color). Confirm the backend's `product_variants` table and the product creation wizard's media upload step support this before wiring up the frontend — if they currently only support one image per product, that needs to be fixed first, on the backend and in the Trends Responsible product wizard's Media step.

### 4. Real photos vs. the reference's placeholder gradients
The reference uses CSS gradients standing in for real product photography (there are no real product photos yet). Replace every `.product-photo` div's gradient-based `.body`/`.flap`/`.strap` markup with a plain `<Image>` (Next.js `next/image`) pointing to the variant's real photo URL. The crossfade mechanics (opacity + scale transition on `.active`) stay identical — only the content changes from CSS shapes to real images.

### 5. Performance — this page carries paid ad traffic, non-negotiable
- Use ISR (`export const revalidate = 60`) on the page.
- The iris reveal animation and ambient particles should be pure CSS, not JS-driven, exactly as in the reference.
- The drag-rotate/tilt interaction and zoom modal should be dynamically imported (`next/dynamic`, `ssr: false`) so they don't block initial page load — they're interaction-only, not needed for first paint.
- Respect `prefers-reduced-motion`: disable the iris reveal, auto-rotation, and particle drift, falling back to a static instant-appear state, exactly as flagged in the reference file's CSS.
- Run Lighthouse on this page once built — target 90+ mobile performance. If the 3D/animation work drags the score down, simplify before it spreads to other pages.

### 6. Apply the same design tokens elsewhere
Once this page is done, apply the same color tokens, fonts (Space Grotesk / Inter / JetBrains Mono), and glass-panel treatment to: the login page, the admin/trends dashboard shells, and the `NotificationBell` — but do NOT copy the iris-reveal/rotate/zoom interactions onto those pages. Per the earlier design brief: one bold orchestrated moment belongs to the landing page; dashboards get the quieter "control room" treatment (glass panels, mono numerals, cyan pulse for live status).

Confirm your component plan back to me before writing code.