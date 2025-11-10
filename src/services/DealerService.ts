import { getDatabase, saveDatabase } from '../utils/database';
import { Dealer, Employee } from '../models';
import { DealerStatus } from '../enums';

export class DealerService {
  async getAllDealers() {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const employees = db.tables.get('Employees') || [];
    
    return dealers.map((dealer: any) => ({
      ...dealer,
      employee: employees.find((emp: any) => emp.id === dealer.employeeId)
    }));
  }

  async createDealer(employeeId: number, seniorityLevel: number, shiftStart: string, shiftEnd: string) {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    
    const newDealer: Dealer = {
      id: Math.max(0, ...dealers.map((d: any) => d.id)) + 1,
      employeeId,
      status: DealerStatus.Available,
      seniorityLevel,
      shiftStart,
      shiftEnd,
      lastBreakTime: null,
      lastMealTime: null,
      preferredPit: null,
      certifications: [],
      assignmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    dealers.push(newDealer);
    saveDatabase();
    return newDealer;
  }

  async updateDealer(id: number, updates: Partial<Dealer>) {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const index = dealers.findIndex((d: any) => d.id === id);
    
    if (index !== -1) {
      dealers[index] = { ...dealers[index], ...updates, updatedAt: new Date() };
      saveDatabase();
      return dealers[index];
    }
    return null;
  }

  async deleteDealer(id: number) {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const filtered = dealers.filter((d: any) => d.id !== id);
    db.tables.set('Dealers', filtered);
    saveDatabase();
  }

  async updateStatus(id: number, status: DealerStatus) {
    return this.updateDealer(id, { status });
  }
}
