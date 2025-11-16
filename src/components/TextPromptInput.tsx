import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle, Users, Mic, MicOff } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';
import { TextPromptService, ParsedCommand } from '../services/TextPromptService';
import { AutoRotationService, QualifiedDealer } from '../services/AutoRotationService';
import { AutoAssignTimer, TimerState } from '../utils/AutoAssignTimer';
import { playDealerPushSound } from '../utils/sounds';
import { SpeechToTextService } from '../services/SpeechToTextService';

interface TextPromptInputProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onDataReload?: () => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

export default function TextPromptInput({ onSuccess, onError, onDataReload, isVisible = false, onToggle }: TextPromptInputProps) {
  const { isDark } = useThemeStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [qualifiedDealers, setQualifiedDealers] = useState<QualifiedDealer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<QualifiedDealer | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({ showModal: false, countdown: 10 });
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<AutoAssignTimer | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechServiceRef = useRef<SpeechToTextService | null>(null);
  const qualifiedDealersRef = useRef<QualifiedDealer[]>([]);
  const parsedCommandRef = useRef<ParsedCommand | null>(null);
  const handleExecuteWithDealerRef = useRef<((dealerToAssign?: QualifiedDealer) => Promise<void>) | null>(null);

  const textPromptService = new TextPromptService();
  const autoRotationService = new AutoRotationService();

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Initialize speech recognition service
  useEffect(() => {
    // Try to get API key from environment, localStorage, or window config
    // Priority: localStorage > window config > env variables
    const storedApiKey = localStorage.getItem('speech_api_key');
    const storedProvider = localStorage.getItem('speech_provider') as 'webspeech' | 'google' | 'azure' | 'openai' | null;
    const storedRegion = localStorage.getItem('azure_speech_region');
    
    const apiKey = storedApiKey 
      || (window as any).SPEECH_API_KEY 
      || (typeof process !== 'undefined' && process.env?.REACT_APP_SPEECH_API_KEY);
    
    const provider = (storedProvider 
      || (window as any).SPEECH_PROVIDER 
      || (typeof process !== 'undefined' && process.env?.REACT_APP_SPEECH_PROVIDER) 
      || 'webspeech') as 'webspeech' | 'google' | 'azure' | 'openai';
    
    // Store Azure region if provided
    if (storedRegion) {
      (window as any).AZURE_SPEECH_REGION = storedRegion;
    } else if (typeof process !== 'undefined' && process.env?.AZURE_SPEECH_REGION) {
      (window as any).AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
    }
    
    // Initialize speech service
    // Prefer cloud API if key is provided, otherwise fall back to Web Speech
    speechServiceRef.current = new SpeechToTextService({
      provider: apiKey ? provider : 'webspeech',
      apiKey: apiKey || undefined,
    });

    // Create recognition handler
    const handleSpeechResult = async (result: { transcript: string; confidence?: number; error?: string }) => {
      if (result.error) {
        setResult({ success: false, message: result.error });
        setIsListening(false);
        return;
      }

      const transcript = result.transcript;
      setInput(transcript);
      setIsListening(false);
      
      // Auto-submit after a short delay
      setTimeout(async () => {
        if (transcript.trim()) {
          setIsProcessing(true);
          setResult(null);
          setQualifiedDealers([]);
          setSelectedDealer(null);
          setShowResults(false);

          try {
            // Parse the command
            const parsed = await textPromptService.parseCommand(transcript);
            const validation = textPromptService.validateCommand(parsed);

            if (!validation.valid) {
              setResult({ success: false, message: validation.error || 'Invalid command' });
              onError?.(validation.error || 'Invalid command');
              setIsProcessing(false);
              return;
            }

            setParsedCommand(parsed);

            // Find qualified dealers
            const qualified = await autoRotationService.findQualifiedDealers(parsed);
            
            if (qualified.length === 0) {
              setResult({ 
                success: false, 
                message: 'No qualified dealers found matching the requirements' 
              });
              onError?.('No qualified dealers found');
              setIsProcessing(false);
              return;
            }

            setQualifiedDealers(qualified);
            setShowResults(true);

            // Auto-select the best match if only one option
            if (qualified.length === 1) {
              setSelectedDealer(qualified[0]);
            }
          } catch (error: any) {
            setResult({ 
              success: false, 
              message: error.message || 'Failed to process command' 
            });
            onError?.(error.message || 'Failed to process command');
          } finally {
            setIsProcessing(false);
          }
        }
      }, 500);
    };

    const handleSpeechError = (error: string) => {
      setResult({ success: false, message: error });
      setIsListening(false);
    };

    const handleSpeechEnd = () => {
      setIsListening(false);
    };

    // Create recognition instance
    if (speechServiceRef.current.isAvailable()) {
      recognitionRef.current = speechServiceRef.current.startRecognition(
        handleSpeechResult,
        handleSpeechError,
        handleSpeechEnd,
        { language: 'en-US' }
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current || !speechServiceRef.current) {
      setResult({ success: false, message: 'Speech recognition is not available. Please check your browser support or API configuration.' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setResult(null);
      } catch (error: any) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        setResult({ success: false, message: error.message || 'Failed to start voice input. Please try again.' });
      }
    }
  };

  // Update refs when values change
  useEffect(() => {
    qualifiedDealersRef.current = qualifiedDealers;
  }, [qualifiedDealers]);

  useEffect(() => {
    parsedCommandRef.current = parsedCommand;
  }, [parsedCommand]);

  // Initialize timer utility - create it once
  useEffect(() => {
    timerRef.current = new AutoAssignTimer({
      onAutoAssign: async () => {
        console.log('Auto-assign triggered', {
          qualifiedDealers: qualifiedDealersRef.current.length,
          hasHandler: !!handleExecuteWithDealerRef.current,
          hasParsedCommand: !!parsedCommandRef.current
        });
        
        if (qualifiedDealersRef.current.length > 0 && handleExecuteWithDealerRef.current && parsedCommandRef.current) {
          // Get the best dealer (first in array, highest score)
          const bestDealer = qualifiedDealersRef.current[0];
          console.log('Assigning best dealer:', bestDealer.dealer.employee?.fullName);
          
          timerRef.current?.cancel();
          setSelectedDealer(bestDealer);
          
          // Call the handler directly
          await handleExecuteWithDealerRef.current(bestDealer);
        } else {
          console.error('Cannot auto-assign: missing required data', {
            qualifiedDealers: qualifiedDealersRef.current.length,
            hasHandler: !!handleExecuteWithDealerRef.current,
            hasParsedCommand: !!parsedCommandRef.current
          });
        }
      },
      onStateChange: (state) => {
        setTimerState(state);
      },
      selectionDelay: 6000,
      countdownDuration: 10
    });

    return () => {
      timerRef.current?.destroy();
      timerRef.current = null;
    };
  }, []);

  // Start timer when qualified dealers are shown
  useEffect(() => {
    if (showResults && qualifiedDealers.length > 1 && !selectedDealer) {
      timerRef.current?.start();
    } else {
      timerRef.current?.cancel();
    }
  }, [showResults, qualifiedDealers.length, selectedDealer]);

  // Mark as selected when dealer is chosen
  useEffect(() => {
    if (selectedDealer) {
      timerRef.current?.markAsSelected();
    }
  }, [selectedDealer]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setResult(null);
    setQualifiedDealers([]);
    setSelectedDealer(null);
    setShowResults(false);

    try {
      // Parse the command
      const parsed = await textPromptService.parseCommand(input);
      const validation = textPromptService.validateCommand(parsed);

      if (!validation.valid) {
        setResult({ success: false, message: validation.error || 'Invalid command' });
        onError?.(validation.error || 'Invalid command');
        setIsProcessing(false);
        return;
      }

      setParsedCommand(parsed);

      // Find qualified dealers
      const qualified = await autoRotationService.findQualifiedDealers(parsed);
      
      if (qualified.length === 0) {
        setResult({ 
          success: false, 
          message: 'No qualified dealers found matching the requirements' 
        });
        onError?.('No qualified dealers found');
        setIsProcessing(false);
        return;
      }

      setQualifiedDealers(qualified);
      setShowResults(true);

      // Auto-select the best match if only one option
      if (qualified.length === 1) {
        setSelectedDealer(qualified[0]);
      }
      // Timer will start automatically via useEffect when showResults becomes true

    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.message || 'Failed to process command' 
      });
      onError?.(error.message || 'Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoAssign = async (dealer: QualifiedDealer) => {
    timerRef.current?.cancel();
    setSelectedDealer(dealer);
    
    // Execute the assignment
    await handleExecuteWithDealer(dealer);
  };

  const handleExecuteWithDealer = useCallback(async (dealerToAssign?: QualifiedDealer) => {
    const dealer = dealerToAssign || selectedDealer;
    // Use ref to get latest parsedCommand (for timer callback)
    const command = parsedCommand || parsedCommandRef.current;
    if (!dealer || !command) {
      console.error('Cannot execute: missing dealer or parsedCommand', { dealer: !!dealer, command: !!command });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const { getDatabase } = await import('../utils/database');
      const db = await getDatabase();
      const tables = db.tables.get('Tables') || [];
      
      const targetTable = tables.find((t: any) => 
        t.tableNumber.toUpperCase() === command.tableNumber?.toUpperCase()
      );

      if (!targetTable) {
        throw new Error('Target table not found');
      }

      const rotationResult = await autoRotationService.executeAutoRotation(
        dealer.dealer.id,
        targetTable.id,
        command.time
      );

      setResult(rotationResult);
      
      if (rotationResult.success) {
        // Play dealer push sound on successful assignment
        playDealerPushSound();
        
        setInput('');
        setShowResults(false);
        setQualifiedDealers([]);
        setSelectedDealer(null);
        setParsedCommand(null);
        
        // Clear any timers
        timerRef.current?.cancel();
        
        onSuccess?.(rotationResult.message);
        onDataReload?.();
        
        // Auto-dismiss success toast after 3 seconds
        setTimeout(() => {
          setResult(null);
        }, 3000);
      } else {
        onError?.(rotationResult.message);
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.message || 'Failed to execute rotation' 
      });
      onError?.(error.message || 'Failed to execute rotation');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedDealer, parsedCommand, onSuccess, onError, onDataReload]);

  // Update ref when handleExecuteWithDealer changes
  useEffect(() => {
    handleExecuteWithDealerRef.current = handleExecuteWithDealer;
  }, [handleExecuteWithDealer]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none">
      <div className="p-2 pb-3 pl-64 pointer-events-auto">
        <div className="max-w-7xl mx-auto space-y-2">
        <GlassCard className="p-2 shadow-md" hover={false}>
          <div className="flex items-start gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#FA812F]/20 border border-[#FA812F]/30' : 'bg-[#FA812F]/10 border border-[#FA812F]/20'}`}>
              <Sparkles className={isDark ? 'text-[#FA812F]' : 'text-[#FA812F]'} size={16} />
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Auto-Rotation Command
                </label>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Example: "I need an H3 high limit dealer for R101 at 6:00"
                </p>
              </div>
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening... Speak your command" : "Type your command here... (Press Enter to submit or click mic for voice)"}
                  disabled={isProcessing || isListening}
                  rows={1}
                  className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#FA812F]/50 focus:border-[#FA812F]/50 resize-none transition-all ${
                    isListening
                      ? isDark
                        ? 'bg-[#FA812F]/20 border-[#FA812F]/50 text-white placeholder-slate-300'
                        : 'bg-[#FA812F]/10 border-[#FA812F]/30 text-gray-900 placeholder-gray-600'
                      : isDark 
                        ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                />
                <button
                  onClick={toggleVoiceInput}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 font-medium shadow-md ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-300'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff size={14} />
                  ) : (
                    <Mic size={14} />
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isProcessing || isListening}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 font-medium shadow-md ${
                    isProcessing || !input.trim() || isListening
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-[#FA812F] hover:bg-[#E6721A] hover:shadow-lg'
                  } text-white`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span className="text-sm">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

      {/* Assignment Summary */}
      {parsedCommand && (
        <GlassCard className={`p-2 shadow-md animate-in slide-in-from-top-2 duration-300`} hover={false}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse`}></div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Request</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {parsedCommand.tableNumber && (
                <div className="flex items-center gap-0.5">
                  <span className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>T:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{parsedCommand.tableNumber}</span>
                </div>
              )}
              {parsedCommand.seniorityLevel && (
                <div className="flex items-center gap-0.5">
                  <span className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>H:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{parsedCommand.seniorityLevel}</span>
                </div>
              )}
              {parsedCommand.isHighLimit && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                  HL
                </span>
              )}
              {parsedCommand.time && (
                <div className="flex items-center gap-0.5">
                  <span className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>@</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{parsedCommand.time}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Qualified Dealers Results */}
      {showResults && qualifiedDealers.length > 0 && (
        <GlassCard className="p-2 shadow-lg animate-in slide-in-from-bottom-4 duration-500" hover={false}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Users className={isDark ? 'text-blue-400' : 'text-blue-600'} size={12} />
              </div>
              <h4 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Available ({qualifiedDealers.length})
              </h4>
            </div>
            <button
              onClick={() => {
                setShowResults(false);
                setQualifiedDealers([]);
                setSelectedDealer(null);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all hover:scale-105 ${
                isDark 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {qualifiedDealers.map((qd, index) => {
              const isSelected = selectedDealer?.dealer.id === qd.dealer.id;
              const isPositive = qd.score > 0;
              
              return (
                <div
                  key={qd.dealer.id}
                  onClick={() => setSelectedDealer(qd)}
                  className={`p-2 rounded border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    isSelected
                      ? isDark 
                        ? 'border-[#FA812F] bg-[#FA812F]/10 shadow-md' 
                        : 'border-[#FA812F] bg-[#FA812F]/10 shadow-md'
                      : isDark
                        ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 bg-slate-800/30'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isPositive 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {qd.score > 0 ? '+' : ''}{qd.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-[11px] ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                          {qd.dealer.employee?.fullName || `Dealer ${qd.dealer.id}`}
                        </p>
                        <p className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          H{qd.dealer.seniorityLevel}
                        </p>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium flex-shrink-0 ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                        ⭐
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="text-[#FA812F] flex-shrink-0" size={12} />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {qd.reasons.slice(0, 1).map((reason, i) => {
                      const isNegative = reason.includes('NOT') || reason.includes('mismatch') || reason.includes('Low');
                      return (
                        <div key={i} className="flex items-center gap-1 text-[9px]">
                          <span className={isNegative ? 'text-red-500' : 'text-green-500'}>
                            {isNegative ? '✗' : '✓'}
                          </span>
                          <span className={`truncate ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{reason}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedDealer && (
            <button
              onClick={() => handleExecuteWithDealer()}
              disabled={isProcessing}
              className={`mt-2 w-full py-1.5 rounded transition-all font-semibold shadow-md ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#FA812F] hover:bg-[#E6721A] hover:shadow-lg hover:scale-[1.01] active:scale-95'
              } text-white text-xs`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="animate-spin" size={12} />
                  Assigning...
                </span>
              ) : (
                `Assign ${selectedDealer.dealer.employee?.fullName?.split(' ')[0] || 'Dealer'} → ${parsedCommand?.tableNumber}`
              )}
            </button>
          )}
        </GlassCard>
      )}

      {/* Auto-Assign Modal */}
      {timerState.showModal && qualifiedDealers.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <GlassCard className="p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300" hover={false}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full ${isDark ? 'bg-[#FA812F]/20' : 'bg-[#FA812F]/10'}`}>
                <Sparkles className="text-[#FA812F]" size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Auto-Assigning Best Match
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                No selection made. Assigning the best qualified dealer automatically.
              </p>
              
              {/* Countdown Circle */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#FA812F"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - timerState.countdown / 10)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {timerState.countdown}
                  </span>
                </div>
              </div>

              {/* Best Dealer Info */}
              {qualifiedDealers[0] && (
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                        {qualifiedDealers[0].score > 0 ? '+' : ''}{qualifiedDealers[0].score}
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {qualifiedDealers[0].dealer.employee?.fullName || `Dealer ${qualifiedDealers[0].dealer.id}`}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          H{qualifiedDealers[0].dealer.seniorityLevel} • {qualifiedDealers[0].dealer.status}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                      ⭐ Best Match
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => timerRef.current?.cancel()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all font-medium ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (qualifiedDealers[0]) {
                      timerRef.current?.assignNow();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg transition-all font-medium bg-[#FA812F] hover:bg-[#E6721A] text-white shadow-lg hover:shadow-xl"
                >
                  Assign Now
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Success Toast */}
      {result && result.success && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-500 animate-out slide-out-to-right-full fade-out duration-300">
          <div className={`p-3 rounded-lg shadow-xl border ${isDark ? 'bg-green-900/90 border-green-500/50 backdrop-blur-sm' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle2 className="text-green-500" size={16} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-xs ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  Assignment Successful
                </p>
                <p className={`text-[10px] ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {result.message}
                </p>
              </div>
              <button
                onClick={() => setResult(null)}
                className={`p-0.5 rounded transition-all ${isDark ? 'text-green-400 hover:text-green-300 hover:bg-green-800/50' : 'text-green-600 hover:text-green-800 hover:bg-green-100'}`}
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

