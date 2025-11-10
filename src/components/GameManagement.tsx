import { useState, useEffect } from 'react';
import { Game } from '../models';
import { GameType } from '../enums';
import { Gamepad2, Plus, Trash2, Edit, Power } from 'lucide-react';
import { GameService } from '../services';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

export default function GameManagement() {
  const { isDark } = useThemeStore();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const gameService = new GameService();

  const gameCategories: Record<string, string[]> = {
    'Card Games': ['Blackjack', 'Baccarat', 'ThreeCardPoker', 'TexasHoldem', 'UltimateTexasHoldem', 'MississippiStud', 'SpanishTwentyOne'],
    'Table Games': ['Roulette', 'PaiGow'],
    'Dice Games': ['Craps'],
    'Other': ['Other']
  };

  const getGameCategory = (gameName: string): string => {
    for (const [category, gameNames] of Object.entries(gameCategories)) {
      if (gameNames.includes(gameName)) return category;
    }
    return 'Other';
  };

  const filteredGames = selectedCategory === 'All' 
    ? games 
    : games.filter(game => getGameCategory(game.name) === selectedCategory);

  useEffect(() => {
    seedGames();
  }, []);

  const seedGames = async () => {
    const gamesData = await gameService.getAllGames();
    if (gamesData.length === 0) {
      const gameDescriptions: Record<string, string> = {
        Blackjack: 'Classic card game where players aim to beat the dealer by getting 21',
        Roulette: 'Spinning wheel game with betting on numbers and colors',
        Craps: 'Dice game with various betting options on the outcome of rolls',
        PaiGow: 'Chinese domino game adapted with poker hand rankings',
        Baccarat: 'Card comparing game between player and banker hands',
        ThreeCardPoker: 'Poker variant played with three cards against the dealer',
        TexasHoldem: 'Popular poker variant with community cards',
        UltimateTexasHoldem: 'Casino version of Texas Holdem against the house',
        MississippiStud: 'Poker-based game with progressive betting rounds',
        SpanishTwentyOne: 'Blackjack variant with Spanish deck and bonus payouts',
        Other: 'Custom or specialty casino games'
      };
      
      for (const gameType of Object.values(GameType)) {
        await gameService.createGame(gameType, gameDescriptions[gameType] || 'Casino game');
      }
    }
    loadGames();
  };

  const loadGames = async () => {
    try {
      const gamesData = await gameService.getAllGames();
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        await gameService.updateGame(editingGame.id, name, description);
        setSuccessMessage('Game Updated Successfully!');
      } else {
        await gameService.createGame(name, description);
        setSuccessMessage('Game Created Successfully!');
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowModal(false);
        setEditingGame(null);
        setName('');
        setDescription('');
      }, 1500);
      await loadGames();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setName(game.name);
    setDescription(game.description);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!gameToDelete) return;
    try {
      await gameService.deleteGame(gameToDelete.id);
      setShowDeleteModal(false);
      setGameToDelete(null);
      setSuccessMessage('Game Deleted Successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
      await loadGames();
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const game = games.find(g => g.id === id);
      await gameService.toggleGameStatus(id);
      await loadGames();
      setSuccessMessage(`${game?.name} ${game?.isActive ? 'Deactivated' : 'Activated'} Successfully!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (error) {
      console.error('Error toggling game status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading games...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className={`p-2 ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                <Gamepad2 className={isDark ? 'text-purple-400' : 'text-purple-600'} size={28} />
              </div>
              Manage Games
            </h2>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Add and manage casino games</p>
          </div>
          <button
            onClick={() => {
              setEditingGame(null);
              setName('');
              setDescription('');
              setShowModal(true);
            }}
            className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Add Game
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['All', ...Object.keys(gameCategories)].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-[#FA812F] text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredGames.map((game) => (
            <GlassCard key={game.id} className="p-4 relative overflow-hidden group" hover={false}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${game.isActive ? 'from-green-500/10 to-blue-500/10' : 'from-gray-500/10 to-slate-500/10'} -mr-12 -mt-12 blur-xl`}></div>
              
              <div className="relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{game.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleToggleStatus(game.id)}
                      className={`p-1.5 transition-all ${game.isActive ? 'hover:bg-green-500/20' : 'hover:bg-gray-500/20'}`}
                      title={game.isActive ? 'Active' : 'Inactive'}
                    >
                      <Power size={14} className={game.isActive ? 'text-green-400' : 'text-gray-400'} />
                    </button>
                    <button
                      onClick={() => handleEdit(game)}
                      className="p-1.5 hover:bg-blue-500/20 transition-all"
                      title="Edit"
                    >
                      <Edit size={14} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        setGameToDelete(game);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{game.description}</p>

                <div className={`px-2 py-1 text-xs font-semibold inline-block ${game.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                  {game.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredGames.length === 0 && games.length > 0 && (
          <GlassCard className="text-center py-16" hover={false}>
            <div className={`p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Gamepad2 className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No games in this category</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Try selecting a different category</p>
          </GlassCard>
        )}

        {games.length === 0 && (
          <GlassCard className="text-center py-16" hover={false}>
            <div className={`p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Gamepad2 className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No games configured</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Get started by adding your first game</p>
          </GlassCard>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md p-6" hover={false}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingGame ? 'Edit Game' : 'Add New Game'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Game Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Blackjack, Roulette"
                    className={`w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50 ${isDark ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'} border`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter game description and rules"
                    className={`w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50 ${isDark ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'} border`}
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGame(null);
                      setName('');
                      setDescription('');
                    }}
                    className={`flex-1 px-4 py-2 transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all"
                  >
                    {editingGame ? 'Update Game' : 'Create Game'}
                  </button>
                </div>
              </form>


            </GlassCard>
          </div>
        )}

        {showDeleteModal && gameToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md p-6" hover={false}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Game</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Are you sure you want to delete <span className="font-semibold">{gameToDelete.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGameToDelete(null);
                  }}
                  className={`flex-1 px-4 py-2 transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white transition-all"
                >
                  Delete
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {showSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">{successMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
