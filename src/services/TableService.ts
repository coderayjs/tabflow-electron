import { getDatabase, saveDatabase } from '../utils/database';
import { Table } from '../models';
import { GameType, TableStatus } from '../enums';

export class TableService {
  async getAllTables() {
    const db = await getDatabase();
    return db.tables.get('Tables') || [];
  }

  async createTable(data: {
    tableNumber: string;
    gameType: GameType;
    minBet: number;
    maxBet: number;
    pit: string;
    requiredDealerCount: number;
    pushIntervalMinutes: number;
    tableImage?: string;
  }) {
    const db = await getDatabase();
    const tables = db.tables.get('Tables') || [];
    
    const newTable: Table = {
      id: Math.max(0, ...tables.map((t: any) => t.id)) + 1,
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

  async updateTable(id: number, updates: Partial<Table>) {
    const db = await getDatabase();
    const tables = db.tables.get('Tables') || [];
    const index = tables.findIndex((t: any) => t.id === id);
    
    if (index !== -1) {
      tables[index] = { ...tables[index], ...updates, updatedAt: new Date() };
      saveDatabase();
      return tables[index];
    }
    return null;
  }

  async deleteTable(id: number) {
    const db = await getDatabase();
    const tables = db.tables.get('Tables') || [];
    const filtered = tables.filter((t: any) => t.id !== id);
    db.tables.set('Tables', filtered);
    saveDatabase();
  }

  async updateStatus(id: number, status: TableStatus) {
    return this.updateTable(id, { status });
  }
}
