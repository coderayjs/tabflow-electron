import { getDatabase, saveDatabase } from '../utils/database';
import { DealerStatus, TableStatus } from '../enums';

export class AISchedulerService {
  async generateOptimalSchedule() {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];

    const availableDealers = dealers.filter((d: any) => 
      d.status === DealerStatus.Available
    );
    
    const openTables = tables.filter((t: any) => 
      t.status === TableStatus.Open && !t.isLocked
    );

    const newAssignments = [];
    let dealerIndex = 0;

    for (const table of openTables) {
      if (dealerIndex >= availableDealers.length) break;

      const dealer = availableDealers[dealerIndex];
      const assignment = {
        id: Math.max(0, ...assignments.map((a: any) => a.id)) + newAssignments.length + 1,
        dealerId: dealer.id,
        tableId: table.id,
        startTime: new Date(),
        endTime: null,
        isCurrent: true,
        isAIGenerated: true,
        createdAt: new Date()
      };

      newAssignments.push(assignment);
      dealers[dealers.findIndex((d: any) => d.id === dealer.id)].status = DealerStatus.Dealing;
      dealerIndex++;
    }

    assignments.push(...newAssignments);
    saveDatabase();
    
    return {
      assignmentsCreated: newAssignments.length,
      dealersAssigned: dealerIndex,
      tablesStaffed: newAssignments.length
    };
  }

  async autoRotate() {
    const db = await getDatabase();
    const assignments = db.tables.get('Assignments') || [];
    const dealers = db.tables.get('Dealers') || [];

    const activeAssignments = assignments.filter((a: any) => a.isCurrent && !a.endTime);
    let rotated = 0;

    for (const assignment of activeAssignments) {
      const startTime = new Date(assignment.startTime);
      const now = new Date();
      const minutesElapsed = (now.getTime() - startTime.getTime()) / 60000;

      if (minutesElapsed >= 20) {
        assignment.endTime = now;
        assignment.isCurrent = false;
        
        const dealerIndex = dealers.findIndex((d: any) => d.id === assignment.dealerId);
        if (dealerIndex !== -1) {
          dealers[dealerIndex].status = DealerStatus.Available;
        }
        rotated++;
      }
    }

    saveDatabase();
    return { rotated };
  }
}
