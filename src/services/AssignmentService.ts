import { getDatabase, saveDatabase } from '../utils/database';
import { Assignment } from '../models';

export class AssignmentService {
  async getAllAssignments() {
    const db = await getDatabase();
    const assignments = db.tables.get('Assignments') || [];
    const dealers = db.tables.get('Dealers') || [];
    const tables = db.tables.get('Tables') || [];
    const employees = db.tables.get('Employees') || [];
    
    return assignments.map((assignment: any) => ({
      ...assignment,
      dealer: dealers.find((d: any) => d.id === assignment.dealerId),
      table: tables.find((t: any) => t.id === assignment.tableId),
      employee: employees.find((e: any) => e.id === dealers.find((d: any) => d.id === assignment.dealerId)?.employeeId)
    }));
  }

  async createAssignment(dealerId: number, tableId: number, position?: string) {
    const db = await getDatabase();
    const assignments = db.tables.get('Assignments') || [];
    
    const newAssignment: Assignment = {
      id: Math.max(0, ...assignments.map((a: any) => a.id)) + 1,
      dealerId,
      tableId,
      position: position || 'Dealer',
      startTime: new Date(),
      endTime: null,
      crapsRole: 0 as any,
      isCurrent: true,
      isAIGenerated: false,
      createdAt: new Date()
    };

    assignments.push(newAssignment);
    saveDatabase();
    return newAssignment;
  }

  async endAssignment(id: number) {
    const db = await getDatabase();
    const assignments = db.tables.get('Assignments') || [];
    const index = assignments.findIndex((a: any) => a.id === id);
    
    if (index !== -1) {
      assignments[index].endTime = new Date();
      assignments[index].isActive = false;
      saveDatabase();
      return assignments[index];
    }
    return null;
  }

  async deleteAssignment(id: number) {
    const db = await getDatabase();
    const assignments = db.tables.get('Assignments') || [];
    const filtered = assignments.filter((a: any) => a.id !== id);
    db.tables.set('Assignments', filtered);
    saveDatabase();
  }
}
