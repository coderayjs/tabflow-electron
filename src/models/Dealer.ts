import { DealerStatus } from '../enums';
import { DealerCertification } from './DealerCertification';
import { Assignment } from './Assignment';
import { Employee } from './Employee';

export interface Dealer {
  id: number;
  employeeId: number;
  employee?: Employee;
  status: DealerStatus;
  seniorityLevel: number;
  contractType?: string;
  shiftStart: string; // TimeSpan as string "HH:mm:ss"
  shiftEnd: string;
  lastBreakTime: Date | null;
  lastMealTime: Date | null;
  preferredPit: string | null;
  profileImage?: string;
  certifications: DealerCertification[];
  assignmentHistory: Assignment[];
  createdAt: Date;
  updatedAt: Date;
}

