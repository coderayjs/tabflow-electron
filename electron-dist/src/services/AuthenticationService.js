import { getDatabase, saveDatabase } from '../utils/database.js';
import CryptoJS from 'crypto-js';
export class AuthenticationService {
    async getDb() {
        return await getDatabase();
    }
    async authenticate(employeeNumber, password) {
        const db = await this.getDb();
        const employees = db.tables.get('Employees') || [];
        const employee = employees.find((emp) => emp.employeeNumber === employeeNumber && emp.isActive);
        if (!employee) {
            return null;
        }
        if (!this.verifyPassword(password, employee.passwordHash)) {
            return null;
        }
        // Update last login
        employee.lastLoginAt = new Date().toISOString();
        saveDatabase();
        return employee;
    }
    async registerEmployee(employeeNumber, firstName, lastName, password, role) {
        const db = await this.getDb();
        const employees = db.tables.get('Employees') || [];
        const now = new Date().toISOString();
        const hashedPassword = this.hashPassword(password);
        const employee = {
            id: Math.max(0, ...employees.map((e) => e.id)) + 1,
            employeeNumber,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            passwordHash: hashedPassword,
            role,
            isActive: true,
            hireDate: new Date(now),
            createdAt: new Date(now),
            lastLoginAt: null,
        };
        employees.push(employee);
        saveDatabase();
        return employee;
    }
    async changePassword(employeeId, oldPassword, newPassword) {
        const db = await this.getDb();
        const employees = db.tables.get('Employees') || [];
        const employee = employees.find((emp) => emp.id === employeeId);
        if (!employee) {
            return false;
        }
        if (!this.verifyPassword(oldPassword, employee.passwordHash)) {
            return false;
        }
        employee.passwordHash = this.hashPassword(newPassword);
        saveDatabase();
        return true;
    }
    hashPassword(password) {
        return CryptoJS.SHA256(password).toString();
    }
    verifyPassword(password, passwordHash) {
        return this.hashPassword(password) === passwordHash;
    }
    async getEmployeeById(id) {
        const db = await this.getDb();
        const employees = db.tables.get('Employees') || [];
        return employees.find((emp) => emp.id === id) || null;
    }
}
