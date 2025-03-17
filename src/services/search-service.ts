interface SearchResult {
  date: string;
  value: number;
}

export async function searchByDate(startDate: string, endDate: string): Promise<SearchResult[]> {
  // Validar formato de fecha
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date format');
  }

  // Convertir strings a objetos Date
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validar rango de fechas
  if (start > end) {
    return [];
  }

  // Simulación de resultados para prueba
  return [
    { date: '2024-01-15', value: 100 },
    { date: '2024-01-16', value: 102 }
  ];
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
