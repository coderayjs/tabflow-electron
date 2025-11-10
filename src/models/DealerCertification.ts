import { GameType, ProficiencyLevel, CrapsRole } from '../enums';

export interface DealerCertification {
  id: number;
  dealerId: number;
  gameType: GameType;
  proficiencyLevel: ProficiencyLevel;
  crapsRole: CrapsRole;
  certifiedDate: Date;
  expirationDate: Date | null;
  isActive: boolean;
}

