import { expect } from 'chai';
import { searchByDate } from '../src/services/search-service';

interface TestResult {
  date: string;
  value: number;
}

describe('Date Search Tests', () => {
  it('should return results for valid date range', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const results = await searchByDate(startDate, endDate);
    
    expect(results).to.be.an('array');
    expect(results.length).to.be.greaterThan(0);
    
    // Verificar que todas las fechas están dentro del rango
    results.forEach((item: TestResult) => {
      const itemDate = new Date(item.date);
      expect(itemDate).to.be.within(new Date(startDate), new Date(endDate));
    });
  });

  it('should return empty array for invalid date range', async () => {
    const startDate = '2024-01-31';
    const endDate = '2024-01-01';
    const results = await searchByDate(startDate, endDate);
    
    expect(results).to.be.an('array');
    expect(results).to.have.lengthOf(0);
  });

  it('should handle invalid date formats', async () => {
    const startDate = 'invalid-date';
    const endDate = '2024-01-31';
    
    try {
      await searchByDate(startDate, endDate);
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error).to.be.an('error');
      expect(error.message).to.include('Invalid date format');
    }
  });
});
