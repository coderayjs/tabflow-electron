import { getDatabase } from '../utils/database';
import { GameType } from '../enums';

export interface ParsedCommand {
  tableNumber?: string;
  gameType?: GameType;
  isHighLimit?: boolean;
  seniorityLevel?: number;
  proficiencyLevel?: number;
  time?: string; // Time in HH:mm format
  dealerCount?: number;
  pit?: string;
}

export class TextPromptService {
  /**
   * Parse natural language command to extract requirements
   * Examples:
   * - "I need an H1 high limit dealer for R101 at 6:00"
   * - "Assign dealer to BJ-101"
   * - "Need high limit dealer for table BAC-401"
   */
  async parseCommand(text: string): Promise<ParsedCommand> {
    const command: ParsedCommand = {};
    const lowerText = text.toLowerCase();

    // Extract table number (patterns like R101, BJ-101, BAC-401, etc.)
    const tableNumberMatch = text.match(/\b([A-Z]{1,3}-?\d{2,4}|R\d{2,4})\b/i);
    if (tableNumberMatch) {
      command.tableNumber = tableNumberMatch[1].toUpperCase();
    }

    // Extract time (patterns like "6:00", "6:00 PM", "18:00", "at 6:00")
    // If no AM/PM is specified and hours < 12, assume PM (casino hours are typically afternoon/evening)
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
      /\bat\s+(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
      /\b(\d{1,2}):(\d{2})\b/
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        let hours = parseInt(match[1] || match[4] || match[7]);
        const minutes = parseInt(match[2] || match[5] || match[8]);
        const period = (match[3] || match[6] || '').toLowerCase();
        
        // If no AM/PM specified and hours < 12, default to PM (casino hours)
        // If hours >= 12, assume it's already 24-hour format
        if (!period) {
          if (hours < 12) {
            hours += 12; // Default to PM for casino hours
          }
          // If hours >= 12, keep as is (already 24-hour format)
        } else {
          if (period === 'pm' && hours !== 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
        }
        
        command.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        break;
      }
    }

    // Extract high limit requirement
    if (lowerText.includes('high limit') || lowerText.includes('high-limit') || lowerText.includes('highlimit')) {
      command.isHighLimit = true;
    }

    // Extract seniority level (H1, H2, H3, etc. or "level 1", "seniority 2")
    const seniorityPatterns = [
      /\bH(\d+)\b/i, // H1, H2, etc.
      /\b(?:seniority|level)\s*(\d+)\b/i,
      /\bL(\d+)\b/i // L1, L2, etc.
    ];
    
    for (const pattern of seniorityPatterns) {
      const match = text.match(pattern);
      if (match) {
        command.seniorityLevel = parseInt(match[1]);
        break;
      }
    }

    // Extract game type from table number or explicit mention
    if (command.tableNumber) {
      const prefix = command.tableNumber.split('-')[0] || command.tableNumber.substring(0, 2);
      const gameTypeMap: Record<string, GameType> = {
        'BJ': GameType.Blackjack,
        'R': GameType.Roulette,
        'CR': GameType.Craps,
        'BAC': GameType.Baccarat,
        'PG': GameType.PaiGow,
        'TCP': GameType.ThreeCardPoker,
        'TH': GameType.TexasHoldem,
        'UTH': GameType.UltimateTexasHoldem,
        'MS': GameType.MississippiStud,
        'ST': GameType.SpanishTwentyOne
      };
      
      if (gameTypeMap[prefix]) {
        command.gameType = gameTypeMap[prefix];
      }
    }

    // Extract explicit game type mentions
    const gameTypeKeywords: Record<string, GameType> = {
      'blackjack': GameType.Blackjack,
      'roulette': GameType.Roulette,
      'craps': GameType.Craps,
      'baccarat': GameType.Baccarat,
      'paigow': GameType.PaiGow,
      'pai gow': GameType.PaiGow,
      'three card poker': GameType.ThreeCardPoker,
      'texas holdem': GameType.TexasHoldem,
      'ultimate texas holdem': GameType.UltimateTexasHoldem,
      'mississippi stud': GameType.MississippiStud,
      'spanish twenty one': GameType.SpanishTwentyOne
    };

    for (const [keyword, gameType] of Object.entries(gameTypeKeywords)) {
      if (lowerText.includes(keyword)) {
        command.gameType = gameType;
        break;
      }
    }

    // Extract pit name
    const pitKeywords = ['main floor', 'high limit', 'center pit', 'asian games', 'vip'];
    for (const pit of pitKeywords) {
      if (lowerText.includes(pit)) {
        command.pit = pit;
        break;
      }
    }

    // Extract dealer count
    const countMatch = text.match(/\b(\d+)\s*(?:dealer|dealers)\b/i);
    if (countMatch) {
      command.dealerCount = parseInt(countMatch[1]);
    }

    return command;
  }

  /**
   * Validate that a parsed command has minimum required information
   */
  validateCommand(command: ParsedCommand): { valid: boolean; error?: string } {
    if (!command.tableNumber) {
      return { valid: false, error: 'Table number is required' };
    }
    return { valid: true };
  }
}

