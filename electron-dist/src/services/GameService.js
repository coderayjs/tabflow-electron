import { getDatabase, saveDatabase } from '../utils/database';
export class GameService {
    async getDb() {
        return await getDatabase();
    }
    async getAllGames() {
        const db = await this.getDb();
        if (!db.tables.has('Games'))
            db.tables.set('Games', []);
        return db.tables.get('Games') || [];
    }
    async createGame(name, description) {
        const db = await this.getDb();
        const games = db.tables.get('Games') || [];
        const game = {
            id: Math.max(0, ...games.map((g) => g.id)) + 1,
            name,
            description,
            isActive: true,
            createdAt: new Date(),
        };
        games.push(game);
        saveDatabase();
        return game;
    }
    async updateGame(id, name, description) {
        const db = await this.getDb();
        const games = db.tables.get('Games') || [];
        const game = games.find((g) => g.id === id);
        if (game) {
            game.name = name;
            game.description = description;
            saveDatabase();
        }
    }
    async toggleGameStatus(id) {
        const db = await this.getDb();
        const games = db.tables.get('Games') || [];
        const game = games.find((g) => g.id === id);
        if (game) {
            game.isActive = !game.isActive;
            saveDatabase();
        }
    }
    async deleteGame(id) {
        const db = await this.getDb();
        const games = db.tables.get('Games') || [];
        const index = games.findIndex((g) => g.id === id);
        if (index !== -1) {
            games.splice(index, 1);
            saveDatabase();
        }
    }
}
