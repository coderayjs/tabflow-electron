import { Dealer } from './Dealer';

export interface BreakRecord {
  id: number;
  dealerId: number;
  dealer?: Dealer;
  breakType: string; // "Break" or "Meal"
  startTime: Date;
  endTime: Date | null;
  expectedDurationMinutes: number;
  isCompliant: boolean;
  createdAt: Date;
  duration?: number;
}

