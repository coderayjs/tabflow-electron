export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  hireDate: Date;
  createdAt: Date;
  lastLoginAt: Date | null;
  profileImage?: string;
}

