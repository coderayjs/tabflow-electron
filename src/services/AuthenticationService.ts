import { getDatabase, saveDatabase } from '../utils/database.js';
import { Employee } from '../models/index.js';
import CryptoJS from 'crypto-js';

export class AuthenticationService {
  private async getDb() {
    return await getDatabase();
  }

  async authenticate(employeeNumber: string, password: string): Promise<Employee | null> {
    const db = await this.getDb();
    const employees = db.tables.get('Employees') || [];

    const employee = employees.find((emp: any) =>
      emp.employeeNumber === employeeNumber && emp.isActive
    );

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

  async registerEmployee(
    employeeNumber: string,
    firstName: string,
    lastName: string,
    password: string,
    role: string
  ): Promise<Employee> {
    const db = await this.getDb();
    const employees = db.tables.get('Employees') || [];

    const now = new Date().toISOString();
    const hashedPassword = this.hashPassword(password);

    const employee: Employee = {
      id: Math.max(0, ...employees.map((e: any) => e.id)) + 1,
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

  async changePassword(employeeId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const db = await this.getDb();
    const employees = db.tables.get('Employees') || [];

    const employee = employees.find((emp: any) => emp.id === employeeId);

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

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  verifyPassword(password: string, passwordHash: string): boolean {
    return this.hashPassword(password) === passwordHash;
  }

  async getEmployeeById(id: number): Promise<Employee | null> {
    const db = await this.getDb();
    const employees = db.tables.get('Employees') || [];

    return employees.find((emp: any) => emp.id === id) || null;
  }
}
