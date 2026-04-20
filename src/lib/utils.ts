export function calculateExpirationDate(expiration: string): string {
  const date = new Date();
  if (expiration.includes('1 hora')) {
    date.setHours(date.getHours() + 1);
  } else if (expiration.includes('24 horas')) {
    date.setHours(date.getHours() + 24);
  } else if (expiration.includes('7 dias')) {
    date.setDate(date.getDate() + 7);
  }
  return date.toISOString();
}

export function cn(...classes: (string | undefined | boolean | null)[]) {
  return classes.filter(Boolean).join(' ');
}
