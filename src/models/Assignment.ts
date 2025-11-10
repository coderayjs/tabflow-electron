import { CrapsRole } from '../enums';
import { Dealer } from './Dealer';
import { Table } from './Table';

export interface Assignment {
  id: number;
  dealerId: number;
  dealer?: Dealer;
  tableId: number;
  table?: Table;
  startTime: Date;
  endTime: Date | null;
  crapsRole: CrapsRole;
  isCurrent: boolean;
  isAIGenerated: boolean;
  createdAt: Date;
  position?: string;
}

