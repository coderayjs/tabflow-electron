import { getDatabase, saveDatabase } from '../utils/database';
export class BreakService {
    async getAllBreaks() {
        const db = await getDatabase();
        const breaks = db.tables.get('BreakRecords') || [];
        const dealers = db.tables.get('Dealers') || [];
        const employees = db.tables.get('Employees') || [];
        return breaks.map((breakRecord) => {
            const dealer = dealers.find((d) => d.id === breakRecord.dealerId);
            return {
                ...breakRecord,
                dealer,
                employee: employees.find((e) => e.id === dealer?.employeeId)
            };
        });
    }
    async startBreak(dealerId, breakType) {
        const db = await getDatabase();
        const breaks = db.tables.get('BreakRecords') || [];
        const newBreak = {
            id: Math.max(0, ...breaks.map((b) => b.id)) + 1,
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
    async endBreak(id) {
        const db = await getDatabase();
        const breaks = db.tables.get('BreakRecords') || [];
        const index = breaks.findIndex((b) => b.id === id);
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
        return breaks.filter((b) => !b.endTime);
    }
}
