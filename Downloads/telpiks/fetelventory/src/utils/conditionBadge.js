/**
 * conditionBadge.js
 * ------------------------------------------------------------------
 * Helper bersama untuk menampilkan kolom "Condition" dengan warna
 * yang konsisten di SEMUA halaman aset:
 *   - Very Good -> hijau tua
 *   - Good      -> hijau muda
 *   - Bad       -> oren
 *   - Very Bad  -> merah
 * ------------------------------------------------------------------
 */
export function conditionBadge(condition) {
  const normalized = (condition || "").trim().toUpperCase();
  if (normalized === "VERY GOOD") return { className: "condition-very-good", label: "Very Good" };
  if (normalized === "GOOD") return { className: "condition-good", label: "Good" };
  if (normalized === "BAD") return { className: "condition-bad", label: "Bad" };
  if (normalized === "VERY BAD") return { className: "condition-very-bad", label: "Very Bad" };
  return { className: "condition-null", label: "-" };
}
