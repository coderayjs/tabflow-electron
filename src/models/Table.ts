import { GameType, TableStatus, CrapsRole } from '../enums';
import { Assignment } from './Assignment';

export interface Table {
  id: number;
  tableNumber: string;
  gameType: GameType;
  status: TableStatus;
  minBet: number;
  maxBet: number;
  isHighLimit: boolean;
  pit: string;
  requiredDealerCount: number;
  requiredCrapsRoles: CrapsRole[];
  pushIntervalMinutes: number;
  currentAssignments: Assignment[];
  nextAssignments: Assignment[];
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  tableImage?: string;
}

