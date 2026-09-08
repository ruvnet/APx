/** Browser-safe arithmetic only. Does not validate evidence, task sets, or eligibility. */
export function powerMetrics(creditedHumanHours, wallHours) {
  if (!Number.isFinite(creditedHumanHours) || creditedHumanHours < 0 || !Number.isFinite(wallHours) || wallHours <= 0) throw new Error('Finite nonnegative work and positive wall time required');
  const AP = creditedHumanHours / wallHours;
  if (!Number.isFinite(AP)) throw new Error('Power overflow');
  return { AP, APx: AP > 0 ? Math.log2(AP) : null };
}
export function exponentToPower(exponent) {
  if (!Number.isFinite(exponent)) throw new Error('Finite exponent required');
  const AP = 2 ** exponent;
  if (!Number.isFinite(AP) || AP === 0) throw new Error('Exponent outside representable range');
  return AP;
}
