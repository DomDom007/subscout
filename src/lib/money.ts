export const CURRENCIES = ["TND", "EUR", "USD", "GBP", "MAD", "DZD", "CAD", "AED", "SAR", "EGP"];
export function moneyFmt(currency: string) {
  let f: Intl.NumberFormat;
  try { f = new Intl.NumberFormat(undefined, { style: "currency", currency }); } catch { f = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }); }
  return (n: number) => f.format(Math.abs(n) < 0.0005 ? 0 : n);
}
