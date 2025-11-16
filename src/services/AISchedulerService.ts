import { getDatabase, saveDatabase } from '../utils/database';
import { DealerStatus, TableStatus, GameType } from '../enums';
import { AutoRotationService } from './AutoRotationService';
import { ParsedCommand } from './TextPromptService';

export class AISchedulerService {
  private autoRotationService: AutoRotationService;

  constructor() {
    this.autoRotationService = new AutoRotationService();
  }

  async generateOptimalSchedule() {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];

    // Find open tables without current assignments (excluding craps and locked tables)
    const emptyTables = tables.filter((table: any) => {
      const hasCurrentAssignment = assignments.some(
        (a: any) => a.tableId === table.id && a.isCurrent && !a.endTime
      );
      return (
        table.status === TableStatus.Open &&
        !hasCurrentAssignment &&
        !table.isLocked &&
        table.gameType !== GameType.Craps
      );
    });

    if (emptyTables.length === 0) {
      return {
        assignmentsCreated: 0,
        dealersAssigned: 0,
        tablesStaffed: 0
      };
    }

    const newAssignments = [];
    const assignedDealerIds = new Set<number>();

    // Process each empty table and find the best qualified dealer
    for (const table of emptyTables) {
      try {
        // Create requirements based on table properties
        const requirements: ParsedCommand = {
          tableNumber: table.tableNumber,
          gameType: table.gameType,
          isHighLimit: table.isHighLimit,
          pit: table.pit
        };

        // Find qualified dealers for this table using scoring system
        const qualified = await this.autoRotationService.findQualifiedDealers(requirements);

        if (qualified.length === 0) {
          continue; // Skip if no qualified dealers
        }

        // Find the best dealer that hasn't been assigned yet in this batch
        let bestDealer = null;
        for (const qualifiedDealer of qualified) {
          if (!assignedDealerIds.has(qualifiedDealer.dealer.id)) {
            bestDealer = qualifiedDealer.dealer;
            break;
          }
        }

        // If all qualified dealers are already assigned, use the best one anyway (they can be rotated)
        if (!bestDealer && qualified.length > 0) {
          bestDealer = qualified[0].dealer;
        }

        if (!bestDealer) {
          continue;
        }

        // Check if dealer is currently assigned to another table
        const currentAssignment = assignments.find(
          (a: any) => a.dealerId === bestDealer.id && a.isCurrent && !a.endTime
        );

        if (currentAssignment) {
          // End current assignment (rotate dealer)
          currentAssignment.endTime = new Date();
          currentAssignment.isCurrent = false;

          // Update dealer status
          const dealerIndex = dealers.findIndex((d: any) => d.id === bestDealer.id);
          if (dealerIndex !== -1) {
            dealers[dealerIndex].status = DealerStatus.Available;
          }
        }

        // Create new assignment
        const assignment = {
          id: Math.max(0, ...assignments.map((a: any) => a.id || 0)) + newAssignments.length + 1,
          dealerId: bestDealer.id,
          tableId: table.id,
          position: 'Dealer',
          startTime: new Date(),
          endTime: null,
          crapsRole: 0 as any,
          isCurrent: true,
          isAIGenerated: true,
          createdAt: new Date()
        };

        newAssignments.push(assignment);
        assignedDealerIds.add(bestDealer.id);

        // Update dealer status to Dealing
        const dealerIndex = dealers.findIndex((d: any) => d.id === bestDealer.id);
        if (dealerIndex !== -1) {
          dealers[dealerIndex].status = DealerStatus.Dealing;
        }
      } catch (error: any) {
        console.error(`Failed to assign dealer to ${table.tableNumber}:`, error.message);
        continue;
      }
    }

    // Save all new assignments
    if (newAssignments.length > 0) {
      assignments.push(...newAssignments);
      saveDatabase();
    }
    
    return {
      assignmentsCreated: newAssignments.length,
      dealersAssigned: assignedDealerIds.size,
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
