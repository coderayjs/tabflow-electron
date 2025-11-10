import { getDatabase, saveDatabase } from '../utils/database';
import { TableStatus } from '../enums';
export class TableService {
    async getAllTables() {
        const db = await getDatabase();
        return db.tables.get('Tables') || [];
    }
    async createTable(data) {
        const db = await getDatabase();
        const tables = db.tables.get('Tables') || [];
        const newTable = {
            id: Math.max(0, ...tables.map((t) => t.id)) + 1,
            tableNumber: data.tableNumber,
            gameType: data.gameType,
            status: TableStatus.Closed,
            minBet: data.minBet,
            maxBet: data.maxBet,
            isHighLimit: data.minBet >= 100,
            pit: data.pit,
            requiredDealerCount: data.requiredDealerCount,
            requiredCrapsRoles: [],
            pushIntervalMinutes: data.pushIntervalMinutes,
            currentAssignments: [],
            nextAssignments: [],
            isLocked: false,
            tableImage: data.tableImage,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        tables.push(newTable);
        saveDatabase();
        return newTable;
    }
    async updateTable(id, updates) {
        const db = await getDatabase();
        const tables = db.tables.get('Tables') || [];
        const index = tables.findIndex((t) => t.id === id);
        if (index !== -1) {
            tables[index] = { ...tables[index], ...updates, updatedAt: new Date() };
            saveDatabase();
            return tables[index];
        }
        return null;
    }
    async deleteTable(id) {
        const db = await getDatabase();
        const tables = db.tables.get('Tables') || [];
        const filtered = tables.filter((t) => t.id !== id);
        db.tables.set('Tables', filtered);
        saveDatabase();
    }
    async updateStatus(id, status) {
        return this.updateTable(id, { status });
    }
}
