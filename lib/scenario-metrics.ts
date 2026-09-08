// Teaching calculator only. Real benchmark receipts are validated by the independent kernel.
export function scenarioMetrics(accepted: number, referenceMinutes: number, wallHours: number, supervisionMinutes: number, costUsd: number) {
  if (![accepted, referenceMinutes, wallHours, supervisionMinutes, costUsd].every(Number.isFinite) || !Number.isInteger(accepted) || accepted < 0 || referenceMinutes <= 0 || wallHours <= 0 || supervisionMinutes < 0 || costUsd < 0) throw new Error('Invalid scenario inputs');
  const credit = accepted * referenceMinutes / 60;
  const power = credit / wallHours;
  return {credit, power, exponent: power > 0 ? Math.log2(power) : null, leverage: supervisionMinutes > 0 ? credit / (supervisionMinutes / 60) : null, costPerHumanHour: credit > 0 ? costUsd / credit : null};
}
