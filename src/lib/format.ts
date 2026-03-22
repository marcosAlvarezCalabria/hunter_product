export const formatCurrency = (value: number | null): string => {
  if (typeof value !== 'number') {
    return '-';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
