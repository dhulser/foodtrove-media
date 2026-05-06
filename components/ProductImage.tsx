/**
 * ProductImage — renders product imagery with a graceful styled fallback.
 *
 * Real product images don't exist yet. This component generates a visually
 * distinct, color-coded placeholder per product using a deterministic color
 * derived from the product ID. Each fallback shows:
 *   - Department-specific background gradient
 *   - Department emoji (large, subtle)
 *   - First letter of the product name (identity anchor)
 *   - Brand name
 *
 * When real images land, swap the fallback for a Next.js <Image /> component
 * inside the same interface — no page layout changes needed.
 */

interface ProductImageProps {
  productId: string;
  productName: string;
  brandName: string;
  departmentIcon: string;
  departmentColor: string; // Tailwind gradient class base, e.g. "emerald"
  size?: "card" | "detail";
  className?: string;
}

// Deterministic hue offset from product ID for visual variety
function productHue(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function ProductImage({
  productId,
  productName,
  brandName,
  departmentIcon,
  departmentColor,
  size = "card",
  className = "",
}: ProductImageProps) {
  const hue = productHue(productId);
  // Soft pastel background — unique per product, consistent across renders
  const bgStyle = {
    background: `hsl(${hue}, 30%, 94%)`,
  };
  const accentStyle = {
    color: `hsl(${hue}, 50%, 45%)`,
  };

  const isDetail = size === "detail";

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={bgStyle}
      aria-label={`${productName} — product image placeholder`}
    >
      {/* Subtle circle decoration */}
      <div
        className="absolute -bottom-4 -right-4 rounded-full opacity-20"
        style={{
          width: isDetail ? 160 : 80,
          height: isDetail ? 160 : 80,
          background: `hsl(${hue}, 60%, 70%)`,
        }}
      />
      <div
        className="absolute -top-2 -left-2 rounded-full opacity-10"
        style={{
          width: isDetail ? 80 : 40,
          height: isDetail ? 80 : 40,
          background: `hsl(${hue}, 60%, 50%)`,
        }}
      />

      {/* Department icon — large, faint */}
      <span
        className={`absolute select-none pointer-events-none ${isDetail ? "text-8xl" : "text-5xl"} opacity-15`}
        aria-hidden="true"
      >
        {departmentIcon}
      </span>

      {/* Product initial — identity anchor */}
      <div className={`relative z-10 flex flex-col items-center gap-1 ${isDetail ? "mt-2" : ""}`}>
        <span
          className={`font-black leading-none ${isDetail ? "text-5xl" : "text-2xl"}`}
          style={accentStyle}
        >
          {productName.charAt(0).toUpperCase()}
        </span>
        {isDetail && (
          <span className="text-xs font-medium text-stone-400 mt-1 text-center px-4 leading-snug max-w-[200px]">
            {brandName}
          </span>
        )}
      </div>
    </div>
  );
}
