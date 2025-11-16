import { getDatabase, saveDatabase } from '../utils/database';
import { DealerStatus, GameType } from '../enums';
import { ParsedCommand } from './TextPromptService';

export interface QualifiedDealer {
  dealer: any;
  score: number;
  reasons: string[];
}

export class AutoRotationService {

  /**
   * Find qualified dealers based on requirements
   */
  async findQualifiedDealers(requirements: ParsedCommand): Promise<QualifiedDealer[]> {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const employees = db.tables.get('Employees') || [];
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];
    const certifications = db.tables.get('DealerCertifications') || [];

    // Get target table
    const targetTable = tables.find((t: any) => 
      t.tableNumber.toUpperCase() === requirements.tableNumber?.toUpperCase()
    );

    if (!targetTable) {
      throw new Error(`Table ${requirements.tableNumber} not found`);
    }

    // Exclude craps tables from auto-rotation
    if (targetTable.gameType === GameType.Craps) {
      throw new Error('Craps tables are not included in auto-rotation. Crews stay until table closes or shift ends.');
    }

    // Get dealers with employee info
    const dealersWithEmployees = dealers.map((dealer: any) => ({
      ...dealer,
      employee: employees.find((e: any) => e.id === dealer.employeeId),
      certifications: certifications.filter((c: any) => c.dealerId === dealer.id && c.isActive)
    }));

    // Filter available dealers
    let candidates = dealersWithEmployees.filter((d: any) => {
      // Must be available or dealing (we'll rotate them)
      return d.status === DealerStatus.Available || d.status === DealerStatus.Dealing;
    });

    // Score and rank dealers
    const scoredDealers: QualifiedDealer[] = candidates.map((dealer: any) => {
      let score = 0;
      const reasons: string[] = [];

      // Check if dealer is currently assigned (will need rotation)
      const currentAssignment = assignments.find((a: any) => 
        a.dealerId === dealer.id && a.isCurrent && !a.endTime
      );
      const isCurrentlyAssigned = !!currentAssignment;

      // Game type certification match
      if (requirements.gameType || targetTable.gameType) {
        const gameType = requirements.gameType || targetTable.gameType;
        const hasCertification = dealer.certifications.some((c: any) => 
          c.gameType === gameType && c.isActive
        );
        
        if (hasCertification) {
          score += 50;
          reasons.push(`Certified for ${gameType}`);
        } else {
          score -= 100; // Strong negative if not certified
          reasons.push(`NOT certified for ${gameType}`);
        }
      }

      // High limit requirement
      if (requirements.isHighLimit || targetTable.isHighLimit) {
        // Check if dealer has high limit experience (could be based on seniority or past assignments)
        if (dealer.seniorityLevel >= 5) {
          score += 30;
          reasons.push('High seniority for high limit');
        } else if (dealer.seniorityLevel >= 3) {
          score += 15;
          reasons.push('Moderate seniority');
        } else {
          score -= 20;
          reasons.push('Low seniority for high limit');
        }
      }

      // Seniority level match
      if (requirements.seniorityLevel) {
        const diff = Math.abs(dealer.seniorityLevel - requirements.seniorityLevel);
        if (diff === 0) {
          score += 40;
          reasons.push(`Exact seniority match (H${requirements.seniorityLevel})`);
        } else if (diff === 1) {
          score += 20;
          reasons.push(`Close seniority match (off by ${diff})`);
        } else {
          score -= 10 * diff;
          reasons.push(`Seniority mismatch (off by ${diff})`);
        }
      }

      // Prefer available dealers over dealing dealers (easier rotation)
      if (dealer.status === DealerStatus.Available) {
        score += 25;
        reasons.push('Currently available');
      } else if (isCurrentlyAssigned) {
        score -= 10; // Slight penalty for needing to rotate
        reasons.push('Currently assigned (will rotate)');
      }

      // Prefer dealers not on break
      if (dealer.status !== DealerStatus.OnBreak && dealer.status !== DealerStatus.OnMeal) {
        score += 10;
      }

      // Pit preference
      if (requirements.pit || targetTable.pit) {
        const preferredPit = requirements.pit || targetTable.pit;
        if (dealer.preferredPit && dealer.preferredPit.toLowerCase() === preferredPit.toLowerCase()) {
          score += 15;
          reasons.push(`Preferred pit match`);
        }
      }

      return {
        dealer,
        score,
        reasons
      };
    });

    // Sort all dealers by score (show all, even with negative scores)
    const qualified = scoredDealers
      .sort((a, b) => b.score - a.score);

    return qualified;
  }

  /**
   * Execute auto-rotation: remove dealer from current table and assign to new table
   */
  async executeAutoRotation(
    dealerId: number,
    targetTableId: number,
    scheduledTime?: string
  ): Promise<{ success: boolean; message: string; assignment?: any }> {
    const db = await getDatabase();
    const dealers = db.tables.get('Dealers') || [];
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];

    const dealer = dealers.find((d: any) => d.id === dealerId);
    const targetTable = tables.find((t: any) => t.id === targetTableId);

    if (!dealer) {
      return { success: false, message: 'Dealer not found' };
    }

    if (!targetTable) {
      return { success: false, message: 'Target table not found' };
    }

    // Exclude craps tables
    if (targetTable.gameType === GameType.Craps) {
      return { success: false, message: 'Craps tables are not included in auto-rotation' };
    }

    // Find and end current assignment if dealer is currently assigned
    const currentAssignment = assignments.find((a: any) => 
      a.dealerId === dealerId && a.isCurrent && !a.endTime
    );

    if (currentAssignment) {
      // End current assignment
      currentAssignment.endTime = new Date();
      currentAssignment.isCurrent = false;

      // Update dealer status
      const dealerIndex = dealers.findIndex((d: any) => d.id === dealerId);
      if (dealerIndex !== -1) {
        dealers[dealerIndex].status = DealerStatus.Available;
      }
    }

    // Create new assignment
    const assignmentTime = scheduledTime 
      ? this.parseScheduledTime(scheduledTime)
      : new Date();

    // Create assignment directly in database to set start time
    const newAssignment = {
      id: Math.max(0, ...assignments.map((a: any) => a.id || 0)) + 1,
      dealerId,
      tableId: targetTableId,
      position: 'Dealer',
      startTime: assignmentTime,
      endTime: null,
      crapsRole: 0 as any,
      isCurrent: true,
      isAIGenerated: false,
      createdAt: new Date()
    };

    assignments.push(newAssignment);

    // Update dealer status to Dealing
    const dealerIndex = dealers.findIndex((d: any) => d.id === dealerId);
    if (dealerIndex !== -1) {
      dealers[dealerIndex].status = DealerStatus.Dealing;
    }

    saveDatabase();

    const dealerName = dealer.employee?.fullName || `Dealer ${dealerId}`;
    const tableNumber = targetTable.tableNumber;

    return {
      success: true,
      message: `Successfully assigned ${dealerName} to ${tableNumber}${currentAssignment ? ' (rotated from previous table)' : ''}`,
      assignment: newAssignment
    };
  }

  /**
   * Parse scheduled time string (HH:mm) to Date object
   */
  private parseScheduledTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    
    // If scheduled time is in the past, schedule for tomorrow
    if (scheduled < new Date()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled;
  }

  /**
   * Auto-assign best available dealer to empty tables
   * Checks all open tables and assigns dealers to those without current assignments
   */
  async autoAssignToEmptyTables(): Promise<{
    success: boolean;
    assignmentsCreated: number;
    tablesStaffed: string[];
    errors: string[];
  }> {
    const db = await getDatabase();
    const tables = db.tables.get('Tables') || [];
    const assignments = db.tables.get('Assignments') || [];
    const dealers = db.tables.get('Dealers') || [];
    const employees = db.tables.get('Employees') || [];
    const certifications = db.tables.get('DealerCertifications') || [];

    // Find empty tables (Open status, no current assignment, not locked, not craps)
    const emptyTables = tables.filter((table: any) => {
      const hasCurrentAssignment = assignments.some(
        (a: any) => a.tableId === table.id && a.isCurrent && !a.endTime
      );
      return (
        table.status === 'Open' &&
        !hasCurrentAssignment &&
        !table.isLocked &&
        table.gameType !== GameType.Craps
      );
    });

    if (emptyTables.length === 0) {
      return {
        success: true,
        assignmentsCreated: 0,
        tablesStaffed: [],
        errors: []
      };
    }

    const assignmentsCreated: string[] = [];
    const errors: string[] = [];

    // Get dealers with employee info
    const dealersWithEmployees = dealers.map((dealer: any) => ({
      ...dealer,
      employee: employees.find((e: any) => e.id === dealer.employeeId),
      certifications: certifications.filter((c: any) => c.dealerId === dealer.id && c.isActive)
    }));

    // Process each empty table
    for (const table of emptyTables) {
      try {
        // Create requirements based on table properties
        const requirements: ParsedCommand = {
          tableNumber: table.tableNumber,
          gameType: table.gameType,
          isHighLimit: table.isHighLimit,
          pit: table.pit
        };

        // Find qualified dealers for this table
        const qualified = await this.findQualifiedDealers(requirements);

        if (qualified.length === 0) {
          errors.push(`No qualified dealers found for ${table.tableNumber}`);
          continue;
        }

        // Get the best dealer (first in sorted array)
        const bestDealer = qualified[0].dealer;

        // Check if dealer is available (not already dealing)
        if (bestDealer.status !== DealerStatus.Available) {
          // If dealer is dealing, we can still rotate them
          const currentAssignment = assignments.find(
            (a: any) => a.dealerId === bestDealer.id && a.isCurrent && !a.endTime
          );

          if (currentAssignment) {
            // End current assignment
            currentAssignment.endTime = new Date();
            currentAssignment.isCurrent = false;

            // Update dealer status
            const dealerIndex = dealers.findIndex((d: any) => d.id === bestDealer.id);
            if (dealerIndex !== -1) {
              dealers[dealerIndex].status = DealerStatus.Available;
            }
          }
        }

        // Create new assignment
        const newAssignment = {
          id: Math.max(0, ...assignments.map((a: any) => a.id || 0)) + 1,
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

        assignments.push(newAssignment);

        // Update dealer status to Dealing
        const dealerIndex = dealers.findIndex((d: any) => d.id === bestDealer.id);
        if (dealerIndex !== -1) {
          dealers[dealerIndex].status = DealerStatus.Dealing;
        }

        assignmentsCreated.push(table.tableNumber);
      } catch (error: any) {
        errors.push(`Failed to assign dealer to ${table.tableNumber}: ${error.message}`);
      }
    }

    // Save database if any assignments were created
    if (assignmentsCreated.length > 0) {
      saveDatabase();
    }

    return {
      success: errors.length === 0,
      assignmentsCreated: assignmentsCreated.length,
      tablesStaffed: assignmentsCreated,
      errors
    };
  }
}

