import { getDatabase, saveDatabase } from '../utils/database';
import { Game } from '../models';

export class GameService {
  private async getDb() {
    return await getDatabase();
  }

  async getAllGames(): Promise<Game[]> {
    const db = await this.getDb();
    if (!db.tables.has('Games')) db.tables.set('Games', []);
    return db.tables.get('Games') || [];
  }

  async createGame(name: string, description: string): Promise<Game> {
    const db = await this.getDb();
    const games = db.tables.get('Games') || [];

    const game: Game = {
      id: Math.max(0, ...games.map((g: any) => g.id)) + 1,
      name,
      description,
      isActive: true,
      createdAt: new Date(),
    };

    games.push(game);
    saveDatabase();
    return game;
  }

  async updateGame(id: number, name: string, description: string): Promise<void> {
    const db = await this.getDb();
    const games = db.tables.get('Games') || [];
    const game = games.find((g: any) => g.id === id);

    if (game) {
      game.name = name;
      game.description = description;
      saveDatabase();
    }
  }

  async toggleGameStatus(id: number): Promise<void> {
    const db = await this.getDb();
    const games = db.tables.get('Games') || [];
    const game = games.find((g: any) => g.id === id);

    if (game) {
      game.isActive = !game.isActive;
      saveDatabase();
    }
  }

  async deleteGame(id: number): Promise<void> {
    const db = await this.getDb();
    const games = db.tables.get('Games') || [];
    const index = games.findIndex((g: any) => g.id === id);

    if (index !== -1) {
      games.splice(index, 1);
      saveDatabase();
    }
  }
}
