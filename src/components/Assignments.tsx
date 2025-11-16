import { useState, useEffect, useRef } from 'react';
import { Shuffle, Sparkles, RotateCcw, Users, Table2, Play, Coffee, ArrowRight, Award, Clock, Gamepad2, Bell, AlertTriangle, Plus, MoreVertical, Download, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddDealerModal from './AddDealerModal';
import TextPromptInput from './TextPromptInput';
import { getDatabase, saveDatabase } from '../utils/database';
import { DealerStatus, TableStatus, ActionType } from '../enums';
import { AISchedulerService } from '../services/AISchedulerService';
import { AutoRotationService } from '../services/AutoRotationService';
import Breadcrumb from './Breadcrumb';
import { useThemeStore } from '../stores/themeStore';
import GlassCard from './GlassCard';

export default function Assignments() {
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedDealerToAssign, setSelectedDealerToAssign] = useState<any>(null);
  const [selectedDealer1, setSelectedDealer1] = useState<any>(null);
  const [selectedDealer2, setSelectedDealer2] = useState<any>(null);
  const [expiredRotations, setExpiredRotations] = useState<any[]>([]);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showAddDealerModal, setShowAddDealerModal] = useState(false);
  const [showTablesMenu, setShowTablesMenu] = useState(false);
  const [showDealersMenu, setShowDealersMenu] = useState(false);
  const [showBreakMenu, setShowBreakMenu] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [autoRotateCountdown, setAutoRotateCountdown] = useState(0);
  const [showTextPrompt, setShowTextPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedExpiries = useRef<Set<number>>(new Set());
  const processedBreakEnds = useRef<Set<number>>(new Set());
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiScheduler = new AISchedulerService();

  useEffect(() => {
    loadData();
    audioRef.current = new Audio();
    
    // Auto-assign to empty tables on initial load (after a short delay to ensure data is loaded)
    setTimeout(() => {
      handleAutoAssignToEmptyTables();
    }, 2000);
    
    // Set up interval for auto-assignment (every 30 seconds)
    const autoAssignInterval = setInterval(() => {
      handleAutoAssignToEmptyTables();
    }, 30000);
    
    const interval = setInterval(() => {
      checkExpiredRotations();
      checkExpiredBreaks();
      setTables(prev => [...prev]);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(autoAssignInterval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setShowTablesMenu(false);
        setShowDealersMenu(false);
        setShowBreakMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (tables.length > 0 || dealers.length > 0) {
      generateAIInsights();
    }
  }, [tables, dealers]);

  const generateAIInsights = () => {
    const insights: string[] = [];
    
    if (openTables.length === 0) {
      insights.push('No open tables - Open tables to start assignments');
      setAiInsights(insights);
      return;
    }
    
    tables.forEach(table => {
      if (!table.currentDealer || !table.currentAssignment) return;
      
      const elapsed = Math.floor((new Date().getTime() - new Date(table.currentAssignment.startTime).getTime()) / 60000);
      
      if (elapsed >= 18 && elapsed < 20) {
        insights.push(`${table.currentDealer.employee?.fullName} at ${table.tableNumber} approaching rotation limit (${elapsed} min)`);
      } else if (elapsed >= 20) {
        insights.push(`⚠️ ${table.currentDealer.employee?.fullName} at ${table.tableNumber} EXCEEDED rotation (${elapsed} min)`);
      } else if (elapsed >= 15) {
        insights.push(`${table.currentDealer.employee?.fullName} at ${table.tableNumber} in yellow zone (${elapsed} min)`);
      }
    });
    
    if (availableDealers.length === 0 && activeDealers.length > 0) {
      insights.push('⚠️ No available dealers - consider ending breaks');
    }
    
    if (availableDealers.length > 3) {
      insights.push(`${availableDealers.length} dealers available for assignment`);
    }
    
    if (onBreak.length > 5) {
      insights.push(`${onBreak.length} dealers on break - high break count`);
    }
    
    const highWorkload = activeDealers.filter(d => {
      const stats = getDealerStats(d.id);
      return parseInt(stats.timeWorked) > 4;
    });
    
    if (highWorkload.length > 0) {
      insights.push(`${highWorkload.length} dealer(s) worked 4+ hours today`);
    }
    
    const emptyTables = openTables.filter(t => !t.currentDealer).length;
    if (emptyTables > 0 && availableDealers.length > 0) {
      insights.push(`${emptyTables} empty table(s) - ${availableDealers.length} dealer(s) ready to assign`);
    }
    
    if (insights.length === 0) {
      insights.push('All systems optimal - Floor operations running smoothly');
    }
    
    setAiInsights(insights);
  };

  const checkExpiredRotations = () => {
    const expired = tables.filter(table => {
      if (!table.currentAssignment || !table.currentDealer) return false;
      const elapsed = Math.floor((new Date().getTime() - new Date(table.currentAssignment.startTime).getTime()) / 60000);
      return elapsed >= 20 && !processedExpiries.current.has(table.currentAssignment.id);
    });

    if (expired.length > 0) {
      expired.forEach(table => processedExpiries.current.add(table.currentAssignment.id));
      setExpiredRotations(expired);
      setShowExpiryModal(true);
      setAutoRotateCountdown(15);
      playAlertSound();
      
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setAutoRotateCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            handleAutoRotate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  const playBreakEndSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, idx * 150);
      });
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  const checkExpiredBreaks = async () => {
    try {
      const db = await getDatabase();
      const breaksData = db.tables.get('BreakRecords') || [];
      const dealersData = db.tables.get('Dealers') || [];
      const auditLogs = db.tables.get('AuditLogs') || [];
      
      const expiredBreaks = breaksData.filter((breakRecord: any) => {
        if (breakRecord.endTime || processedBreakEnds.current.has(breakRecord.id)) return false;
        const elapsed = Math.floor((new Date().getTime() - new Date(breakRecord.startTime).getTime()) / 60000);
        return elapsed >= breakRecord.expectedDurationMinutes;
      });

      if (expiredBreaks.length > 0) {
        for (const breakRecord of expiredBreaks) {
          processedBreakEnds.current.add(breakRecord.id);
          
          breakRecord.endTime = new Date();
          
          const dealerIndex = dealersData.findIndex((d: any) => d.id === breakRecord.dealerId);
          if (dealerIndex !== -1) {
            dealersData[dealerIndex].status = DealerStatus.Available;
            
            auditLogs.push({
              id: Math.max(0, ...auditLogs.map((a: any) => a.id)) + 1,
              employeeId: 1,
              actionType: ActionType.BreakEnded,
              description: `Break completed - dealer now available`,
              relatedEntityId: breakRecord.dealerId,
              relatedEntityType: 'Dealer',
              additionalData: null,
              timestamp: new Date()
            });
          }
        }
        
        db.tables.set('BreakRecords', breaksData);
        db.tables.set('Dealers', dealersData);
        db.tables.set('AuditLogs', auditLogs);
        saveDatabase();
        await loadData();
        
        playBreakEndSound();
      }
    } catch (error) {
      console.error('Error checking expired breaks:', error);
    }
  };

  const handleAutoRotate = async () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    for (const table of expiredRotations) {
      await handlePushTable(table.id);
      await handleSendToBreak(table.currentDealer.id);
    }
    setShowExpiryModal(false);
    setExpiredRotations([]);
    setAutoRotateCountdown(0);
  };

  const handleDismissExpiry = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setShowExpiryModal(false);
    setExpiredRotations([]);
    setAutoRotateCountdown(0);
  };

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const tablesData = db.tables.get('Tables') || [];
      const dealersData = db.tables.get('Dealers') || [];
      const assignmentsData = db.tables.get('Assignments') || [];
      const employeesData = db.tables.get('Employees') || [];

      const dealersWithEmployees = dealersData.map((dealer: any) => ({
        ...dealer,
        employee: employeesData.find((emp: any) => emp.id === dealer.employeeId)
      }));

      const tablesWithAssignments = tablesData.map((table: any) => {
        const currentAssignment = assignmentsData.find((a: any) =>
          a.tableId === table.id && a.isCurrent && !a.endTime
        );
        const currentDealer = currentAssignment
          ? dealersWithEmployees.find((d: any) => d.id === currentAssignment.dealerId)
          : null;

        return { ...table, currentDealer, currentAssignment };
      });

      setTables(tablesWithAssignments);
      setDealers(dealersWithEmployees);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-assign dealers to empty tables
  const handleAutoAssignToEmptyTables = async () => {
    try {
      const autoRotationService = new AutoRotationService();
      const result = await autoRotationService.autoAssignToEmptyTables();
      
      if (result.assignmentsCreated > 0) {
        // Play sound for each assignment
        for (let i = 0; i < result.assignmentsCreated; i++) {
          setTimeout(() => {
            playAlertSound();
          }, i * 300); // Stagger sounds if multiple assignments
        }
        
        // Reload data to reflect new assignments
        await loadData();
        
        // Show success notification if assignments were created
        console.log(`Auto-assigned ${result.assignmentsCreated} dealer(s) to table(s): ${result.tablesStaffed.join(', ')}`);
      }
      
      if (result.errors.length > 0) {
        console.warn('Auto-assignment errors:', result.errors);
      }
    } catch (error) {
      console.error('Error auto-assigning to empty tables:', error);
    }
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      const result = await aiScheduler.generateOptimalSchedule();
      await loadData();
      setAssignmentCount(result.assignmentsCreated);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePushTable = async (tableId: number) => {
    try {
      const db = await getDatabase();
      const assignmentsData = db.tables.get('Assignments') || [];
      const dealersData = db.tables.get('Dealers') || [];
      const auditLogs = db.tables.get('AuditLogs') || [];
      const tablesData = db.tables.get('Tables') || [];

      const currentAssignment = assignmentsData.find((a: any) =>
        a.tableId === tableId && a.isCurrent && !a.endTime
      );

      if (currentAssignment) {
        const table = tablesData.find((t: any) => t.id === tableId);
        const dealer = dealersData.find((d: any) => d.id === currentAssignment.dealerId);
        
        currentAssignment.endTime = new Date();
        currentAssignment.isCurrent = false;

        const dealerIndex = dealersData.findIndex((d: any) => d.id === currentAssignment.dealerId);
        if (dealerIndex !== -1) {
          dealersData[dealerIndex].status = DealerStatus.Available;
        }

        const newLog = {
          id: Math.max(0, ...auditLogs.map((a: any) => a.id)) + 1,
          employeeId: 1,
          actionType: 'DealerPushed',
          description: `Pushed dealer from ${table?.tableNumber || 'table'}`,
          relatedEntityId: currentAssignment.dealerId,
          relatedEntityType: 'Dealer',
          additionalData: null,
          timestamp: new Date().toISOString()
        };
        auditLogs.push(newLog);
        console.log('Created audit log:', newLog);

        db.tables.set('Assignments', assignmentsData);
        db.tables.set('Dealers', dealersData);
        db.tables.set('AuditLogs', auditLogs);
        saveDatabase();
        console.log('Total audit logs:', auditLogs.length);
        await loadData();
      }
    } catch (error) {
      console.error('Error pushing table:', error);
    }
  };

  const handlePushAll = async () => {
    const openTables = tables.filter(t => t.status === TableStatus.Open && t.currentDealer);
    for (const table of openTables) {
      await handlePushTable(table.id);
    }
  };

  const handleSendToBreak = async (dealerId: number) => {
    try {
      const db = await getDatabase();
      const dealersData = db.tables.get('Dealers') || [];
      const breaksData = db.tables.get('BreakRecords') || [];
      const assignmentsData = db.tables.get('Assignments') || [];
      const auditLogs = db.tables.get('AuditLogs') || [];

      const currentAssignment = assignmentsData.find((a: any) => a.dealerId === dealerId && a.isCurrent);
      if (currentAssignment) {
        currentAssignment.endTime = new Date();
        currentAssignment.isCurrent = false;
      }

      const dealerIndex = dealersData.findIndex((d: any) => d.id === dealerId);
      if (dealerIndex !== -1) {
        dealersData[dealerIndex].status = DealerStatus.OnBreak;

        breaksData.push({
          id: Math.max(0, ...breaksData.map((b: any) => b.id)) + 1,
          dealerId,
          breakType: 'Break',
          startTime: new Date(),
          endTime: null,
          expectedDurationMinutes: 15,
          isCompliant: true,
          createdAt: new Date()
        });

        auditLogs.push({
          id: Math.max(0, ...auditLogs.map((a: any) => a.id)) + 1,
          employeeId: 1,
          actionType: ActionType.BreakStarted,
          description: `Sent dealer on break`,
          relatedEntityId: dealerId,
          relatedEntityType: 'Dealer',
          additionalData: null,
          timestamp: new Date()
        });

        db.tables.set('AuditLogs', auditLogs);
        saveDatabase();
        await loadData();
      }
    } catch (error) {
      console.error('Error sending to break:', error);
    }
  };

  const handleSendHome = async (dealerId: number) => {
    try {
      const db = await getDatabase();
      const dealersData = db.tables.get('Dealers') || [];
      const assignmentsData = db.tables.get('Assignments') || [];
      const auditLogs = db.tables.get('AuditLogs') || [];

      const currentAssignment = assignmentsData.find((a: any) => a.dealerId === dealerId && a.isCurrent);
      if (currentAssignment) {
        currentAssignment.endTime = new Date();
        currentAssignment.isCurrent = false;
      }

      const dealerIndex = dealersData.findIndex((d: any) => d.id === dealerId);
      if (dealerIndex !== -1) {
        dealersData[dealerIndex].status = DealerStatus.SentHome;
        
        auditLogs.push({
          id: Math.max(0, ...auditLogs.map((a: any) => a.id)) + 1,
          employeeId: 1,
          actionType: ActionType.DealerStatusChanged,
          description: `Sent dealer home`,
          relatedEntityId: dealerId,
          relatedEntityType: 'Dealer',
          additionalData: null,
          timestamp: new Date()
        });
        
        db.tables.set('AuditLogs', auditLogs);
        saveDatabase();
        await loadData();
      }
    } catch (error) {
      console.error('Error sending home:', error);
    }
  };

  const handleAssignDealer = async () => {
    if (!selectedTable || !selectedDealerToAssign) return;

    try {
      const db = await getDatabase();
      const assignmentsData = db.tables.get('Assignments') || [];
      const dealersData = db.tables.get('Dealers') || [];
      const auditLogs = db.tables.get('AuditLogs') || [];

      const newAssignment = {
        id: Math.max(0, ...assignmentsData.map((a: any) => a.id)) + 1,
        dealerId: selectedDealerToAssign.id,
        tableId: selectedTable.id,
        startTime: new Date(),
        endTime: null,
        isCurrent: true,
        createdAt: new Date()
      };

      assignmentsData.push(newAssignment);

      const dealerIndex = dealersData.findIndex((d: any) => d.id === selectedDealerToAssign.id);
      if (dealerIndex !== -1) {
        dealersData[dealerIndex].status = DealerStatus.Dealing;
      }

      auditLogs.push({
        id: Math.max(0, ...auditLogs.map((a: any) => a.id)) + 1,
        employeeId: 1,
        actionType: ActionType.DealerAssigned,
        description: `Assigned dealer to ${selectedTable.tableNumber}`,
        relatedEntityId: selectedDealerToAssign.id,
        relatedEntityType: 'Dealer',
        additionalData: null,
        timestamp: new Date()
      });

      db.tables.set('Assignments', assignmentsData);
      db.tables.set('Dealers', dealersData);
      db.tables.set('AuditLogs', auditLogs);
      saveDatabase();

      // Play dealer push sound on successful assignment
      playAlertSound();

      setShowAssignModal(false);
      setSelectedTable(null);
      setSelectedDealerToAssign(null);
      await loadData();
    } catch (error) {
      console.error('Error assigning dealer:', error);
    }
  };

  const handleSwapDealers = async () => {
    if (!selectedDealer1 || !selectedDealer2) return;

    try {
      const db = await getDatabase();
      const assignmentsData = db.tables.get('Assignments') || [];

      const assignment1 = assignmentsData.find((a: any) => a.dealerId === selectedDealer1.id && a.isCurrent);
      const assignment2 = assignmentsData.find((a: any) => a.dealerId === selectedDealer2.id && a.isCurrent);

      if (assignment1 && assignment2) {
        const temp = assignment1.tableId;
        assignment1.tableId = assignment2.tableId;
        assignment2.tableId = temp;
        saveDatabase();
        await loadData();
      }

      setShowSwapModal(false);
      setSelectedDealer1(null);
      setSelectedDealer2(null);
    } catch (error) {
      console.error('Error swapping dealers:', error);
    }
  };

  const calculateTimeInGame = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
    return `${elapsed}m`;
  };

  const getCountdownTime = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
    const remaining = Math.max(0, (20 * 60) - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedMinutes = (startTime: Date) => {
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  const getTimeColor = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
    if (elapsed >= 20) return 'text-red-500';
    if (elapsed >= 15) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressWidth = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
    return Math.min((elapsed / 20) * 100, 100);
  };

  const getProgressColor = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
    if (elapsed >= 20) return 'bg-red-500';
    if (elapsed >= 15) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDealerStats = (dealerId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dealerAssignments = assignments.filter((a: any) => {
      const assignmentDate = new Date(a.startTime);
      assignmentDate.setHours(0, 0, 0, 0);
      return a.dealerId === dealerId && assignmentDate.getTime() === today.getTime();
    });
    
    const gamesCount = dealerAssignments.length;
    
    const totalMinutes = dealerAssignments.reduce((total: number, a: any) => {
      const start = new Date(a.startTime).getTime();
      const end = a.endTime ? new Date(a.endTime).getTime() : new Date().getTime();
      return total + Math.floor((end - start) / 60000);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeWorked = `${hours}h${mins}m`;
    
    const skillRating = (85 + (dealerId % 15)).toFixed(0);
    
    return { skillRating, timeWorked, gamesCount };
  };

  const openTables = tables.filter(t => t.status === TableStatus.Open);
  const availableDealers = dealers.filter(d => d.status === DealerStatus.Available);
  const activeDealers = dealers.filter(d => d.status === DealerStatus.Dealing);
  const onBreak = dealers.filter(d => d.status === DealerStatus.OnBreak || d.status === DealerStatus.OnMeal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-4 pb-32`}>
      <div className="max-w-7xl mx-auto space-y-3">
        <Breadcrumb />
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Shuffle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
              </div>
              Dealer Assignments
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage dealer rotations and table assignments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles size={16} />
              {aiGenerating ? 'Generating...' : 'AI Schedule'}
            </button>
            <button
              onClick={handlePushAll}
              className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white text-sm flex items-center gap-2 transition-all"
            >
              <RotateCcw size={16} />
              Push All
            </button>
            <button
              onClick={() => setShowSwapModal(true)}
              className={`px-4 py-2 text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-white hover:bg-gray-50 text-gray-900' : 'bg-black hover:bg-gray-900 text-white'}`}
            >
              <ArrowRight size={16} />
              Swap Dealers
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <GlassCard className="p-4 relative" hover={false}>
            <div className="absolute top-4 right-4 dropdown-menu">
              <button
                onClick={() => setShowTablesMenu(!showTablesMenu)}
                className={`p-1 rounded transition-all ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <MoreVertical size={16} />
              </button>
              {showTablesMenu && (
                <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg z-10 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowTablesMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <BarChart3 size={14} />
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      const csv = 'Table Number,Game Type,Status\n' + openTables.map(t => `${t.tableNumber},${t.gameType},${t.status}`).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'tables.csv';
                      a.click();
                      setShowTablesMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              )}
            </div>
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Table2 className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Open Tables</p>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1`}>
                <span className={isDark ? 'text-green-400' : 'text-green-600'}>{openTables.filter(t => t.currentDealer).length}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{openTables.length}</span>
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center -space-x-2">
                {openTables.slice(0, 3).map((table) => (
                  <img
                    key={table.id}
                    src={table.tableImage || '/images/casinotable.jpeg'}
                    alt={table.tableNumber}
                    className={`w-8 h-8 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                    title={table.tableNumber}
                  />
                ))}
                {openTables.length > 3 && (
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                    +{openTables.length - 3}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {openTables.slice(0, 4).map((table) => (
                  <span key={table.id} className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                    {table.tableNumber}
                  </span>
                ))}
                {openTables.length > 4 && (
                  <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                    +{openTables.length - 4}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative" hover={false}>
            <div className="absolute top-3 right-3 dropdown-menu">
              <button
                onClick={() => setShowDealersMenu(!showDealersMenu)}
                className={`p-1 rounded transition-all ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <MoreVertical size={16} />
              </button>
              {showDealersMenu && (
                <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg z-10 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowDealersMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <BarChart3 size={14} />
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      const csv = 'Name,Level,Status\n' + activeDealers.map(d => `${d.employee?.fullName},${d.seniorityLevel},${d.status}`).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'active-dealers.csv';
                      a.click();
                      setShowDealersMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              )}
            </div>
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Dealers</p>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1`}>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{activeDealers.length}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{dealers.length}</span>
              </p>
            </div>
            <div className="flex items-center -space-x-2">
              {activeDealers.slice(0, 3).map((dealer) => (
                <img
                  key={dealer.id}
                  src={dealer.profileImage || '/images/dealer.png'}
                  alt={dealer.employee?.fullName}
                  className={`w-8 h-8 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={dealer.employee?.fullName}
                />
              ))}
              {activeDealers.length > 3 && (
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{activeDealers.length - 3}
                </div>
              )}
              <button
                onClick={() => setShowAddDealerModal(true)}
                className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all hover:scale-110 ${isDark ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300' : 'border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'}`}
                title="Add new dealer"
              >
                <Plus size={16} />
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-4 relative" hover={false}>
            <div className="absolute top-3 right-3 dropdown-menu">
              <button
                onClick={() => setShowBreakMenu(!showBreakMenu)}
                className={`p-1 rounded transition-all ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <MoreVertical size={16} />
              </button>
              {showBreakMenu && (
                <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg z-10 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowBreakMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <BarChart3 size={14} />
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      const csv = 'Name,Level,Status\n' + onBreak.map(d => `${d.employee?.fullName},${d.seniorityLevel},${d.status}`).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'dealers-on-break.csv';
                      a.click();
                      setShowBreakMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              )}
            </div>
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Coffee className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>On Break</p>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1`}>
                <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{onBreak.length}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{dealers.length}</span>
              </p>
            </div>
            <div className="flex items-center -space-x-2">
              {onBreak.slice(0, 3).map((dealer) => (
                <img
                  key={dealer.id}
                  src={dealer.profileImage || '/images/dealer.png'}
                  alt={dealer.employee?.fullName}
                  className={`w-8 h-8 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={dealer.employee?.fullName}
                />
              ))}
              {onBreak.length > 3 && (
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{onBreak.length - 3}
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4" hover={false}>
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Play className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Available</p>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-1`}>
                <span className={isDark ? 'text-green-400' : 'text-green-600'}>{availableDealers.length}</span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>/</span>
                <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{dealers.length}</span>
              </p>
            </div>
            <div className="flex items-center -space-x-2">
              {availableDealers.slice(0, 3).map((dealer) => (
                <img
                  key={dealer.id}
                  src={dealer.profileImage || '/images/dealer.png'}
                  alt={dealer.employee?.fullName}
                  className={`w-8 h-8 rounded-full border-2 object-cover ${isDark ? 'border-slate-900' : 'border-white'}`}
                  title={dealer.employee?.fullName}
                />
              ))}
              {availableDealers.length > 3 && (
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300 border-slate-900' : 'bg-gray-200 text-gray-700 border-white'}`}>
                  +{availableDealers.length - 3}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Current Assignments */}
        <GlassCard className="p-4" hover={false}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Assignments</h3>
            {aiInsights.length > 0 && (
              <>
                <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                <div className="flex-1 overflow-hidden">
                  <div className="animate-marquee whitespace-nowrap">
                    <span className={`inline-flex items-center gap-2 font-semibold text-sm ${aiInsights.some(i => i.includes('⚠️')) ? 'text-red-500' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      <Sparkles size={16} className="animate-pulse" />
                      {aiInsights.map((insight, idx) => (
                        <span key={idx}>
                          {insight}
                          {idx < aiInsights.length - 1 && ' • '}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {openTables.map((table) => (
              <div 
                key={table.id} 
                className={`relative overflow-hidden p-4 transition-all duration-300 shadow-sm ${table.currentDealer ? 'animate-pulse-slow' : ''} ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-md'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const dealerId = parseInt(e.dataTransfer.getData('dealerId'));
                  if (!dealerId || table.currentDealer) return;
                  
                  const dealer = availableDealers.find(d => d.id === dealerId);
                  if (!dealer) return;
                  
                  setSelectedTable(table);
                  setSelectedDealerToAssign(dealer);
                  await handleAssignDealer();
                }}
              >
                {table.currentDealer && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 -mr-16 -mt-16 blur-2xl animate-pulse"></div>
                )}
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <img 
                        src={table.tableImage || '/images/casinotable.jpeg'} 
                        alt={table.tableNumber}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.tableNumber}</h4>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{table.gameType} • {table.pit}</p>
                      </div>
                    </div>
                    {table.currentDealer ? (
                      <button
                        onClick={() => handlePushTable(table.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all"
                      >
                        Push
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm transition-all"
                      >
                        Assign
                      </button>
                    )}
                  </div>

                  {table.currentDealer ? (
                    <div className="space-y-2.5 animate-fade-in">
                      <div className={`flex items-center gap-2.5 p-2.5 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border-l-3 border-green-500`}>
                        <img 
                          src={table.currentDealer.profileImage || '/images/dealer.png'} 
                          alt={table.currentDealer.employee?.fullName}
                          className="w-10 h-10 rounded-full object-cover animate-slide-in"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'} truncate mb-1`}>{table.currentDealer.employee?.fullName}</p>
                          <div className={`flex items-center gap-2 px-2 py-0.5 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'} w-fit`}>
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>LVL</span>
                              <span className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.currentDealer.seniorityLevel}</span>
                            </div>
                            <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                            <div className="flex items-center gap-1">
                              <Award size={9} className="text-yellow-500" />
                              <span className={`text-[10px] font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{getDealerStats(table.currentDealer.id).skillRating}%</span>
                            </div>
                            <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                            <div className="flex items-center gap-1">
                              <Clock size={9} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                              <span className={`text-[10px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{getDealerStats(table.currentDealer.id).timeWorked}</span>
                            </div>
                            <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
                            <div className="flex items-center gap-1">
                              <Gamepad2 size={9} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                              <span className={`text-[10px] font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{getDealerStats(table.currentDealer.id).gamesCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-2.5">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Rotation Countdown</span>
                          <div className="flex items-center gap-2">
                            <span className={getTimeColor(table.currentAssignment.startTime)}>{getCountdownTime(table.currentAssignment.startTime)}</span>
                            <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>•</span>
                            <span className={getTimeColor(table.currentAssignment.startTime)}>{getElapsedMinutes(table.currentAssignment.startTime)}/20 min</span>
                          </div>
                        </div>
                        <div className={`w-full h-1.5 ${isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-1.5 transition-all duration-1000 ${getProgressColor(table.currentAssignment.startTime)}`}
                            style={{ width: `${getProgressWidth(table.currentAssignment.startTime)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSendToBreak(table.currentDealer.id)}
                          className="flex-1 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Coffee size={14} />
                          Break
                        </button>
                        <button
                          onClick={() => handleSendHome(table.currentDealer.id)}
                          className="flex-1 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          Home
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-6 border-2 border-dashed ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Drag dealer here or click Assign</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {openTables.length === 0 && (
            <div className="text-center py-12">
              <div className={`p-4  w-20 h-20 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Table2 className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No open tables</h3>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Open some tables to manage assignments</p>
            </div>
          )}
        </GlassCard>

        {/* Available Dealers */}
        <GlassCard className="p-4" hover={false}>
          <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Available Dealers <span className={`text-sm font-normal ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>(Drag to assign)</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableDealers.map((dealer) => {
              const stats = getDealerStats(dealer.id);
              const hireDate = dealer.employee?.hireDate ? new Date(dealer.employee.hireDate) : null;
              const daysWorked = hireDate ? Math.floor((new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div 
                  key={dealer.id} 
                  className={` p-4 shadow-sm cursor-move ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-md'}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('dealerId', dealer.id.toString());
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={dealer.profileImage || '/images/dealer.png'} 
                      alt={dealer.employee?.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.employee?.fullName}</p>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Lvl {dealer.seniorityLevel}</span>
                        <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>•</span>
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{dealer.contractType || 'Full-Time'}</span>
                        <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>•</span>
                        <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{daysWorked}d</span>
                        <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>•</span>
                        <span className={isDark ? 'text-green-400' : 'text-green-600'}>{stats.skillRating}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {availableDealers.length === 0 && (
            <div className="text-center py-8">
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>All dealers are currently assigned or on break</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Rotation Expiry Modal */}
      {showExpiryModal && expiredRotations.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <GlassCard className="p-6 max-w-lg w-full mx-4" hover={false}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 mx-auto mb-4 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Rotation Time Expired</h3>
              <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {expiredRotations.length} dealer{expiredRotations.length !== 1 ? 's have' : ' has'} exceeded the 20-minute rotation limit
              </p>
              <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'} text-center`}>
                <p className={`text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'} mb-1`}>Auto-rotating in</p>
                <p className={`text-4xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{autoRotateCountdown}s</p>
              </div>
              <div className={`mb-6 p-4 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} text-left max-h-48 overflow-y-auto`}>
                {expiredRotations.map((table, idx) => (
                  <div key={idx} className={`flex items-center justify-between py-2 ${idx > 0 ? 'border-t' : ''} ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <img 
                        src={table.currentDealer.profileImage || '/images/dealer.png'} 
                        alt={table.currentDealer.employee?.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{table.currentDealer.employee?.fullName}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{table.tableNumber}</p>
                      </div>
                    </div>
                    <span className="text-red-500 font-semibold text-sm">{getElapsedMinutes(table.currentAssignment.startTime)} min</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDismissExpiry}
                  className={`flex-1 px-6 py-2.5 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition-all`}
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAutoRotate}
                  className="flex-1 px-6 py-2.5 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all flex items-center justify-center gap-2"
                >
                  <Bell size={18} />
                  Auto-Rotate & Break
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md w-full mx-4" hover={false}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Schedule Generated!</h3>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                AI successfully created {assignmentCount} optimal assignment{assignmentCount !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all"
              >
                Got it
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Assign Dealer Modal */}
      {showAssignModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md w-full mx-4" hover={false}>
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Assign Dealer to {selectedTable.tableNumber}</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Select Available Dealer</label>
                <select
                  value={selectedDealerToAssign?.id || ''}
                  onChange={(e) => setSelectedDealerToAssign(availableDealers.find(d => d.id === parseInt(e.target.value)))}
                  className={`w-full px-4 py-2 focus:outline-none ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} border ${isDark ? 'border-slate-800' : 'border-gray-300'}`}
                >
                  <option value="">Select dealer</option>
                  {availableDealers.map(d => (
                    <option key={d.id} value={d.id}>{d.employee?.fullName} - Level {d.seniorityLevel}</option>
                  ))}
                </select>
              </div>
              {availableDealers.length === 0 && (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No available dealers. All dealers are currently assigned or on break.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTable(null);
                    setSelectedDealerToAssign(null);
                  }}
                  className={`flex-1 px-4 py-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDealer}
                  disabled={!selectedDealerToAssign}
                  className="flex-1 px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add Dealer Modal */}
      {showAddDealerModal && (
        <AddDealerModal
          onClose={() => setShowAddDealerModal(false)}
          onSuccess={() => {
            setShowAddDealerModal(false);
            loadData();
          }}
        />
      )}

      {/* Swap Dealers Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md w-full mx-4" hover={false}>
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Swap Dealers</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Dealer 1</label>
                <select
                  value={selectedDealer1?.id || ''}
                  onChange={(e) => setSelectedDealer1(activeDealers.find(d => d.id === parseInt(e.target.value)))}
                  className={`w-full px-4 py-2 focus:outline-none ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} border ${isDark ? 'border-slate-800' : 'border-gray-300'}`}
                >
                  <option value="">Select dealer</option>
                  {activeDealers.map(d => (
                    <option key={d.id} value={d.id}>{d.employee?.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Dealer 2</label>
                <select
                  value={selectedDealer2?.id || ''}
                  onChange={(e) => setSelectedDealer2(activeDealers.find(d => d.id === parseInt(e.target.value)))}
                  className={`w-full px-4 py-2 focus:outline-none ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} border ${isDark ? 'border-slate-800' : 'border-gray-300'}`}
                >
                  <option value="">Select dealer</option>
                  {activeDealers.map(d => (
                    <option key={d.id} value={d.id}>{d.employee?.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSwapModal(false)}
                  className={`flex-1 px-4 py-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwapDealers}
                  disabled={!selectedDealer1 || !selectedDealer2}
                  className="flex-1 px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all disabled:opacity-50"
                >
                  Swap
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Floating Button for Text Prompt - Right Side */}
      <button
        onClick={() => {
          playAlertSound();
          setShowTextPrompt(!showTextPrompt);
        }}
        className={`fixed right-4 bottom-4 z-50 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          showTextPrompt
            ? isDark 
              ? 'bg-[#FA812F] hover:bg-[#E6721A] text-white' 
              : 'bg-[#FA812F] hover:bg-[#E6721A] text-white'
            : isDark
              ? 'bg-[#FA812F]/20 hover:bg-[#FA812F]/30 text-[#FA812F] border-2 border-[#FA812F]/50'
              : 'bg-[#FA812F]/10 hover:bg-[#FA812F]/20 text-[#FA812F] border-2 border-[#FA812F]/30'
        }`}
        title={showTextPrompt ? 'Hide AI Prompt' : 'Show AI Prompt'}
      >
        <Sparkles size={24} />
      </button>

      {/* Text Prompt Input for Natural Language Commands - Bottom of Screen */}
      <TextPromptInput
        isVisible={showTextPrompt}
        onToggle={() => setShowTextPrompt(!showTextPrompt)}
        onSuccess={(message) => {
          console.log('Auto-rotation success:', message);
          loadData();
        }}
        onError={(error) => {
          console.error('Auto-rotation error:', error);
        }}
        onDataReload={loadData}
      />
    </div>
  );
}
