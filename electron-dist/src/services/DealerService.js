import { getDatabase, saveDatabase } from '../utils/database';
import { DealerStatus } from '../enums';
export class DealerService {
    async getAllDealers() {
        const db = await getDatabase();
        const dealers = db.tables.get('Dealers') || [];
        const employees = db.tables.get('Employees') || [];
        return dealers.map((dealer) => ({
            ...dealer,
            employee: employees.find((emp) => emp.id === dealer.employeeId)
        }));
    }
    async createDealer(employeeId, seniorityLevel, shiftStart, shiftEnd) {
        const db = await getDatabase();
        const dealers = db.tables.get('Dealers') || [];
        const newDealer = {
            id: Math.max(0, ...dealers.map((d) => d.id)) + 1,
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
    async updateDealer(id, updates) {
        const db = await getDatabase();
        const dealers = db.tables.get('Dealers') || [];
        const index = dealers.findIndex((d) => d.id === id);
        if (index !== -1) {
            dealers[index] = { ...dealers[index], ...updates, updatedAt: new Date() };
            saveDatabase();
            return dealers[index];
        }
        return null;
    }
    async deleteDealer(id) {
        const db = await getDatabase();
        const dealers = db.tables.get('Dealers') || [];
        const filtered = dealers.filter((d) => d.id !== id);
        db.tables.set('Dealers', filtered);
        saveDatabase();
    }
    async updateStatus(id, status) {
        return this.updateDealer(id, { status });
    }
}
