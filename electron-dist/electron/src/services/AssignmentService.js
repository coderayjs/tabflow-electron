import { getDatabase, saveDatabase } from '../utils/database';
export class AssignmentService {
    async getAllAssignments() {
        const db = await getDatabase();
        const assignments = db.tables.get('Assignments') || [];
        const dealers = db.tables.get('Dealers') || [];
        const tables = db.tables.get('Tables') || [];
        const employees = db.tables.get('Employees') || [];
        return assignments.map((assignment) => ({
            ...assignment,
            dealer: dealers.find((d) => d.id === assignment.dealerId),
            table: tables.find((t) => t.id === assignment.tableId),
            employee: employees.find((e) => e.id === dealers.find((d) => d.id === assignment.dealerId)?.employeeId)
        }));
    }
    async createAssignment(dealerId, tableId, position) {
        const db = await getDatabase();
        const assignments = db.tables.get('Assignments') || [];
        const newAssignment = {
            id: Math.max(0, ...assignments.map((a) => a.id)) + 1,
            dealerId,
            tableId,
            position: position || 'Dealer',
            startTime: new Date(),
            endTime: null,
            crapsRole: 0,
            isCurrent: true,
            isAIGenerated: false,
            createdAt: new Date()
        };
        assignments.push(newAssignment);
        saveDatabase();
        return newAssignment;
    }
    async endAssignment(id) {
        const db = await getDatabase();
        const assignments = db.tables.get('Assignments') || [];
        const index = assignments.findIndex((a) => a.id === id);
        if (index !== -1) {
            assignments[index].endTime = new Date();
            assignments[index].isActive = false;
            saveDatabase();
            return assignments[index];
        }
        return null;
    }
    async deleteAssignment(id) {
        const db = await getDatabase();
        const assignments = db.tables.get('Assignments') || [];
        const filtered = assignments.filter((a) => a.id !== id);
        db.tables.set('Assignments', filtered);
        saveDatabase();
    }
}
