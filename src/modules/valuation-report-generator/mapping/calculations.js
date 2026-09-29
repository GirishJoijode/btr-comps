/**
 * Central derived figures. Every function here is a calculation on values
 * already read from the workbook — never a number copied from the prototype PDF.
 */

/** Mean of finite numbers. Blank cells are left out; they are never moved into another series. */
export function mean(values) {
  const nums = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (!nums.length) return null
  return nums.reduce((sum, n) => sum + n, 0) / nums.length
}

/**
 * Pound gross reversion = gross ERV − current passing total income.
 * The reversion percentage is read from the workbook and is not recalculated here.
 */
export function grossReversionAmount(grossErv, passingTotal) {
  if (typeof grossErv !== 'number' || typeof passingTotal !== 'number') return null
  if (!Number.isFinite(grossErv) || !Number.isFinite(passingTotal)) return null
  return grossErv - passingTotal
}
