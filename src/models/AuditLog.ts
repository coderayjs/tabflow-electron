import { ActionType } from '../enums';
import { Employee } from './Employee';

export interface AuditLog {
  id: number;
  employeeId: number;
  employee?: Employee;
  actionType: ActionType;
  description: string;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  additionalData: string | null;
  timestamp: Date;
}

