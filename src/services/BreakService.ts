import { getDatabase, saveDatabase } from '../utils/database';
import { BreakRecord } from '../models';

export class BreakService {
  async getAllBreaks() {
    const db = await getDatabase();
    const breaks = db.tables.get('BreakRecords') || [];
    const dealers = db.tables.get('Dealers') || [];
    const employees = db.tables.get('Employees') || [];
    
    return breaks.map((breakRecord: any) => {
      const dealer = dealers.find((d: any) => d.id === breakRecord.dealerId);
      return {
        ...breakRecord,
        dealer,
        employee: employees.find((e: any) => e.id === dealer?.employeeId)
      };
    });
  }

  async startBreak(dealerId: number, breakType: 'Break' | 'Meal') {
    const db = await getDatabase();
    const breaks = db.tables.get('BreakRecords') || [];
    
    const newBreak: BreakRecord = {
      id: Math.max(0, ...breaks.map((b: any) => b.id)) + 1,
      dealerId,
      breakType,
      startTime: new Date(),
      endTime: null,
      expectedDurationMinutes: breakType === 'Meal' ? 30 : 15,
      isCompliant: true,
      duration: 0,
      createdAt: new Date()
    };

    breaks.push(newBreak);
    saveDatabase();
    return newBreak;
  }

  async endBreak(id: number) {
    const db = await getDatabase();
    const breaks = db.tables.get('BreakRecords') || [];
    const index = breaks.findIndex((b: any) => b.id === id);
    
    if (index !== -1) {
      const endTime = new Date();
      const startTime = new Date(breaks[index].startTime);
      breaks[index].endTime = endTime;
      breaks[index].duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      saveDatabase();
      return breaks[index];
    }
    return null;
  }

  async getActiveBreaks() {
    const db = await getDatabase();
    const breaks = db.tables.get('BreakRecords') || [];
    return breaks.filter((b: any) => !b.endTime);
  }
}
