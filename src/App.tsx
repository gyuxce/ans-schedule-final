/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Users,
  UserCheck, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  X,
  Menu,
  CalendarDays,
  TrendingUp,
  CalendarRange,
  Repeat,
  LogOut,
  Lock,
  Mail,
  Key,
  History,
  Moon,
  Sun,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
  MessageSquare,
  FileText,
  ExternalLink,
  ClipboardList,
  BarChart2,
  PlayCircle,
  Download,
  UsersRound
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  format, 
  addDays, 
  subDays,
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  parseISO, 
  parse,
  differenceInMinutes,
  startOfMonth, 
  endOfMonth,
  addMonths,
  subMonths,
  isWithinInterval,
  getDay,
  addWeeks,
  subWeeks,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  addYears
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { AuthPage } from './components/AuthPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- CONSTANTS ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const CLASS_TYPES = ["Private", "Semi-Private", "Group", "Kids Private", "Kids Semi Private", "blank"];

const CLASS_LEVELS = [
  "Intensif Pra Guntai", "Intensif N5", "Intensif N4", "Intensif N3", "Intensif N2", 
  "Pra Guntai", "Guntai 1", "Guntai 2", "Guntai 3", "Guntai 4", "Guntai 5", "Guntai 6", 
  "Guntai 7", "Guntai 8", "Guntai 9", "Guntai 10", "Daimyou 1", "Daimyou 2", "Daimyou 3", 
  "Daimyou 4", "Daimyou 5", "Daimyou 6", "Shogun 1", "Shogun 2", "Shogun 3", "Shogun 4", 
  "Shogun 5", "Shogun 6", "Shogun 7", "Shogun 8", "Level 0 Kids", "Level 1 Kids", 
  "Level 2 Kids", "Level 3 Kids", "Level 4 Kids", "Level 5 Kids", "Level 6 Kids", 
  "Level 7 Kids", "Level 8 Kids", "Level 9 Kids", "Level 10 Kids", "Level 11 Kids", 
  "Level 12 Kids", "Level 13 Kids", "Level 14 Kids", "Level 15 Kids", "Level 16 Kids", 
  "Level 17 Kids", "Level 18 Kids", "Custom N5", "Custom N4", "Custom N3", "Custom Kaiwa", 
  "N5", "N4", "N3", "N2", "Custom Intensif N5", "Custom Intensif N4", "Irodori", "blank"
];

const DAYS_OF_WEEK = [
  { label: 'Senin', value: 1 },
  { label: 'Selasa', value: 2 },
  { label: 'Rabu', value: 3 },
  { label: 'Kamis', value: 4 },
  { label: 'Jumat', value: 5 },
  { label: 'Sabtu', value: 6 },
  { label: 'Minggu', value: 0 }
];

const TYPE_COLORS: Record<string, string> = {
  "Private": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "Semi-Private": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  "Group": "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  "Kids Private": "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  "Kids Semi Private": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  "blank": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "No Show": "bg-red-950 text-white border-red-900 shadow-lg shadow-red-900/20"
};

// --- TYPES ---
interface Sensei {
  id: string;
  name: string;
  note: string;
  no_wa: string;
  email: string;
  level_mengajar: string;
  kelas_tersedia: string;
}

interface Student {
  id: string;
  name: string;
  phone: string;
  level: string;
  type: string;
  sensei_name: string;
  level_awal: string;
  level_sekarang: string;
  durasi_kelas: string;
  payment_status: 'Lunas' | 'Cicilan' | 'Paid' | 'Unpaid';
  is_active: boolean;
  inactive_reason?: string;
  classroom_link?: string;
  chat_link?: string;
  progress_link?: string;
  curriculum_link?: string;
}

interface LessonTracker {
  id: string;
  scheduleId: string;
  studentId: string;
  senseiId?: string;
  date: string;
  attendance: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'No Show';
  material: string;
  score: number;
  notes: string;
  caseNotes?: string;
  studentFeedback?: string;
  actualStartTime?: string;
  isDelayed?: boolean;
  createdAt: string;
}

interface OffDay {
  id: string;
  senseiId: string;
  date: string; // ISO string
  reason: string;
}

interface Schedule {
  id: string;
  senseiId: string;
  studentId?: string; // Kept for backward compatibility
  studentIds?: string[]; // Multiple students for Group/SP
  type: string;
  level: string;
  date: string; // ISO string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'active' | 'completed' | 'cancelled';
  updatedAt?: string;
  updatedBy?: string;
}

// --- UTILS ---
const fetchFromGAS = async (url: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching from GAS:', error);
    return null;
  }
};

const pushToGAS = async (url: string, sheetName: string, data: any[]) => {
  if (!url) return false;
  try {
    // We use text/plain to avoid CORS preflight issues with GAS
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ sheetName, data }),
    });
    return true;
  } catch (error) {
    console.error(`Error pushing ${sheetName} to GAS:`, error);
    return false;
  }
};

const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const scheduleHasStudent = (s: Schedule, studentId: string): boolean => {
  if (s.studentIds && s.studentIds.length > 0) return s.studentIds.includes(studentId);
  return s.studentId === studentId;
};
const Sidebar = (props: any) => {
const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
return (
      <>
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ANS Schedule
              </h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Dashboard v1.0</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60">Utama</p>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button 
              onClick={() => { setActiveTab('teaching'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'teaching' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <PlayCircle size={20} />
              <span className="font-medium">Sesi Mengajar</span>
            </button>
            
            <button 
              onClick={() => { setActiveTab('calendar'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <CalendarDays size={20} />
              <span className="font-medium">Kalender Jadwal</span>
            </button>
            
            <div className="pt-4">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60">Master Data</p>
              <button 
                onClick={() => { setActiveTab('sensei'); setMasterSubTab('sensei'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'sensei' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Users size={20} />
                <span className="font-medium">Data Sensei</span>
              </button>
              <button 
                onClick={() => { setActiveTab('students'); setMasterSubTab('student'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'students' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <UserCheck size={20} />
                <span className="font-medium">Data Students</span>
              </button>
              <button 
                onClick={() => { setActiveTab('offday'); setMasterSubTab('offday'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'offday' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <CalendarDays size={20} />
                <span className="font-medium">Off Days</span>
              </button>
              <button 
                onClick={() => { setActiveTab('reporting'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'reporting' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <BarChart2 size={20} />
                <span className="font-medium">Reporting</span>
              </button>
            </div>

            <div className="pt-4">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60">Tools</p>
              <button 
                onClick={() => { setActiveTab('checker'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'checker' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <AlertCircle size={20} />
                <span className="font-medium">Smart Checker</span>
              </button>
            </div>
          </nav>

          <div className="p-4 mt-auto space-y-2">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 font-medium"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all duration-200 font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            {isSuperAdmin && (
              <button 
                onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
              >
                <Database size={14} />
                Sync Settings
              </button>
            )}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] opacity-60 uppercase tracking-wider font-bold">Cloud Sync</p>
                <button 
                  onClick={handleFullSync}
                  disabled={isSyncing}
                  className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all ${isSyncing ? 'animate-spin' : ''}`}
                >
                  <LayoutDashboard size={14} className="rotate-180" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : dbStatus === 'error' ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
                <span className="text-xs font-medium">{dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Sync Error' : 'Offline'}</span>
              </div>
              <p className="text-[10px] opacity-40 mt-2">Last sync: {lastSync}</p>
            </div>
          </div>
        </div>
      </>
    );
};

const TeachingSessionsView = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [subTab, setSubTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    const filteredSchedules = useMemo(() => {
      return schedules
        .filter(s => {
          if (subTab === 'today') return s.date === todayStr;
          if (subTab === 'tomorrow') return s.date === tomorrowStr;
          if (subTab === 'upcoming') return s.date > tomorrowStr;
          return false;
        })
        .filter(s => s.status !== 'cancelled')
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
    }, [schedules, todayStr, tomorrowStr, subTab]);

    const handleStartLesson = async (schedule: Schedule) => {
      try {
        const now = new Date();
        const actualStartTime = format(now, 'HH:mm');
        
        const scheduledTime = parse(schedule.startTime, 'HH:mm', now);
        const diff = differenceInMinutes(now, scheduledTime);
        const isDelayed = diff > 10;

        const newTracker: LessonTracker = {
          id: `${Date.now()}-${crypto.randomUUID()}`,
          scheduleId: schedule.id,
          studentId: schedule.studentId,
          senseiId: schedule.senseiId,
          date: schedule.date,
          attendance: 'Hadir',
          material: '', 
          score: 0,
          notes: '',
          actualStartTime,
          isDelayed,
          createdAt: now.toISOString()
        };

        await dbOps.save('lesson_trackers', newTracker);
        toast.success(isDelayed ? 'Sesi dimulai! (Terlambat)' : 'Sesi dimulai tepat waktu!');
      } catch (error) {
        toast.error('Gagal memulai sesi');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Operasional Mengajar</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola mulai dan selesaikan sesi belajar hari ini dan mendatang.</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button 
              onClick={() => setSubTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'today' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setSubTab('tomorrow')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'tomorrow' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              Besok
            </button>
            <button 
              onClick={() => setSubTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'upcoming' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              Mendatang
            </button>
          </div>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tidak Ada Jadwal</h3>
            <p className="text-slate-500 mt-2">Sepertinya kamu tidak memiliki jadwal mengajar untuk periode ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSchedules.map(s => {
              const studentIds = s.studentIds?.length > 0 ? s.studentIds : (s.studentId ? [s.studentId] : []);
              const studentsForSchedule = studentList.filter(st => studentIds.includes(st.id));
              const studentNames = studentsForSchedule.map(st => st.name).join(', ') || 'Unknown Student';
              const studentInitial = studentsForSchedule[0]?.name?.charAt(0) || '?';
              const sensei = senseiList.find(sn => sn.id === s.senseiId);
              
              const tracker = lessonTrackers.find(lt => lt.scheduleId === s.id && lt.date === s.date);
              const inProgress = tracker && !tracker.material;
              const completed = tracker && tracker.material;

              return (
                <div key={s.id} className={`bg-white dark:bg-slate-900 border-2 rounded-[2rem] p-5 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden ${
                  completed ? 'border-emerald-100 dark:border-emerald-900/30' : 
                  inProgress ? 'border-amber-100 dark:border-amber-900/30 ring-2 ring-amber-500/5' : 
                  'border-slate-100 dark:border-slate-800'
                }`}>
                  {/* Header/Sensei Badge */}
                  <div className="flex items-center mb-4">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest uppercase rounded-lg border border-indigo-100 dark:border-indigo-800">
                      Sensei {sensei?.name || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0">
                        {studentInitial}
                      </div>
                      <div className="max-w-[140px]">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2" title={studentNames}>{studentNames}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate mt-1">{s.level}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 mt-1">
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">{s.startTime}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">{format(parseISO(s.date), 'dd MMM')}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {tracker?.isDelayed && (
                      <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase rounded shadow-sm animate-pulse">
                        LATE
                      </span>
                    )}
                    {completed ? (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase rounded border border-emerald-100 dark:border-emerald-800">
                        Done
                      </span>
                    ) : inProgress ? (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase rounded border border-amber-100 dark:border-amber-800">
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase rounded border border-slate-200 dark:border-slate-700">
                        Ready
                      </span>
                    )}
                  </div>

                  {completed ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20">
                      <CheckCircle2 size={12} />
                      <span className="text-[9px] font-bold">Session Logged</span>
                    </div>
                  ) : inProgress ? (
                    <button 
                      onClick={() => {
                          setSelectedTrackerSchedule(s);
                          setShowTrackerModal(true);
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-100 dark:shadow-none text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                      <ClipboardList size={14} />
                      Finish Session
                    </button>
                  ) : (
                    <button 
                      disabled={subTab !== 'today'}
                      onClick={() => handleStartLesson(s)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group ${
                        subTab === 'today' 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <PlayCircle size={14} />
                      {subTab === 'today' ? 'Start Session' : 'Locked'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

const AnalyticsCards = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

    const FollowUpReminder = () => {
      const today = new Date();
      const followUpStudents = studentList.filter(student => {
        const studentSchedules = schedules.filter(s => scheduleHasStudent(s, student.id) && s.status !== 'cancelled');
        if (studentSchedules.length === 0) return false;
        const dates = studentSchedules.map(s => {
          try { return parseISO(s.date).getTime(); } catch(e) { return 0; }
        }).filter(t => t > 0);
        if (dates.length === 0) return false;
        const maxDate = new Date(Math.max(...dates));
        const diff = differenceInDays(maxDate, today);
        return diff >= 0 && diff <= 1 && student.is_active !== false;
      });

      if (followUpStudents.length === 0) return null;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-1 md:col-span-2 lg:col-span-4 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-100/10 dark:shadow-none"
        >
          <div className="flex items-center gap-4">
            <div className="bg-rose-500 text-white shadow-rose-200 animate-pulse p-3 rounded-2xl shadow-lg transition-all">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight underline decoration-rose-500/30">
                Follow-up Diperlukan!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
                Ada {followUpStudents.length} siswa yang masa belajarnya akan habis hari ini atau besok.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {followUpStudents.slice(0, 10).map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => {
                      setGlobalSearchTerm(s.name);
                      setActiveTab('students');
                      setMasterSubTab('student');
                      setStudentStatusFilter('Active');
                    }}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-lg border border-rose-100 dark:border-rose-800 uppercase tracking-tight hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95 shadow-sm"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => { 
              setActiveTab('students'); 
              setMasterSubTab('student');
              setStudentStatusFilter('Active');
              setGlobalSearchTerm('');
            }}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none text-xs uppercase tracking-widest"
          >
            Cek Detail
          </button>
        </motion.div>
      );
    };

    return (
      <div className="space-y-6 mb-8">
        {/* Top Stat Cards - 5 Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] p-4 text-white shadow-xl shadow-indigo-200/40 dark:shadow-none flex flex-col justify-between cursor-default transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Users size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black opacity-80 uppercase tracking-widest leading-none">Total Siswa</p>
                <h3 className="text-5xl font-black mt-1 font-mono">{analytics.totalStudents}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-black bg-white/10 w-fit px-3 py-1 rounded-full uppercase">
              <BookOpen size={12} />
              <span>Siswa Aktif</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[1.5rem] p-5 text-white shadow-xl shadow-emerald-200/40 dark:shadow-none flex flex-col justify-between cursor-default transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black opacity-80 uppercase tracking-widest leading-none">Selesai</p>
                <h3 className="text-5xl font-black mt-1 font-mono">{analytics.completedThisMonth}</h3>
              </div>
            </div>
            <p className="mt-4 text-xs font-black opacity-80 uppercase tracking-wider">Materi Bulan Ini</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-[1.5rem] p-5 text-white shadow-xl shadow-rose-200/40 dark:shadow-none flex flex-col justify-between cursor-default transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <AlertCircle size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black opacity-80 uppercase tracking-widest leading-none">Unpaid</p>
                <h3 className="text-5xl font-black mt-1 font-mono">{analytics.unpaidStudents}</h3>
              </div>
            </div>
            <p className="mt-4 text-xs font-black opacity-80 uppercase tracking-wider">Perlu Ditagih</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.5rem] p-5 text-white shadow-xl shadow-amber-200/40 dark:shadow-none flex flex-col justify-between cursor-default transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <UserCheck size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black opacity-80 uppercase tracking-widest leading-none">Sensei</p>
                <h3 className="text-5xl font-black mt-1 font-mono">{senseiList.length}</h3>
              </div>
            </div>
            <p className="mt-4 text-xs font-black opacity-80 uppercase tracking-wider">Staff Mengajar</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[1.5rem] p-5 text-white shadow-xl shadow-cyan-200/40 dark:shadow-none flex flex-col justify-between cursor-default transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <CalendarDays size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black opacity-80 uppercase tracking-widest leading-none">Jadwal</p>
                <h3 className="text-5xl font-black mt-1 font-mono">{analytics.total}</h3>
              </div>
            </div>
            <p className="mt-4 text-xs font-black opacity-80 uppercase tracking-wider">Plan Sesi Rutin</p>
          </motion.div>
        </div>

        {/* Main Bento Grid - 4 Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">
          {/* Follow Up Reminder - Full Width within bento */}
          <FollowUpReminder />

          {/* Weekly Activity - 1x2 Bento */}
          <div className="md:col-span-1 md:row-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm md:text-base">Aktivitas</h4>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '800' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Level Distribution - 2x2 Bento */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:col-span-2 md:row-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm md:text-base">Distribusi Level Siswa</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic font-mono mt-1">Consolidated Groups</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="w-full h-[220px] md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-2 gap-x-4 gap-y-3">
                {analytics.pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase truncate max-w-[100px]">{entry.name}</span>
                      <span className="text-xs font-bold text-indigo-500">{entry.value} Siswa</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Sessions - Vertical Tower */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm md:row-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase italic">Sesi Mendatang</h4>
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {analytics.upcomingSessions.length > 0 ? (
                analytics.upcomingSessions.map((s) => (
                  <div key={s.id} className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{s.time}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${s.type === 'Private' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {s.type}
                      </span>
                    </div>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1 truncate">{s.senseiName}</p>
                    <p className="text-xs text-slate-500 font-bold truncate">Siswa: <span className="text-slate-800 dark:text-slate-300 italic">{s.studentName}</span></p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <Calendar size={32} className="mb-2 text-slate-300" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">No Classes Left</p>
                </div>
              )}
            </div>
          </div>

          {/* Workload Bento */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:row-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Workload</h4>
            </div>
            <div className="space-y-4">
              {analytics.workloadData.slice(0, 3).map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-black uppercase">
                    <span className="text-slate-500 truncate max-w-[120px]">{s.name}</span>
                    <span className="text-indigo-600 font-mono">{s.count} Sesi</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / Math.max(...analytics.workloadData.map(d => d.count))) * 100}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity - 2 Wide */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm md:text-base">Log Aktivitas</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic font-mono mt-1">Real-time Updates</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.recentTrackers.slice(0, 2).map((lt) => (
                <div key={lt.id} className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-transparent">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-2xl">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                      <span className="text-indigo-600 dark:text-indigo-400 font-black italic">{lt.senseiName}</span> menyelesaikan materi <span className="font-bold underline underline-offset-2 decoration-emerald-200 decoration-1 italic">"{lt.material}"</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Bento - 1x1 */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-pink-500 rounded-full"></div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Pembayaran</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic mt-1">Status Overview</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', fontSize: '9px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={6} wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', left: '70%' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

const ReportingDashboard = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    // Data processing for reporting
    const activeStudentsCount = studentList.filter(s => s.is_active !== false).length;
    const inactiveStudentsCount = studentList.filter(s => s.is_active === false).length;
    const dropRate = studentList.length > 0 ? ((inactiveStudentsCount / studentList.length) * 100).toFixed(1) : 0;

    // Inactive reason data
    const reasonCounts = studentList
      .filter(s => s.is_active === false && s.inactive_reason)
      .reduce((acc, s) => {
        const reason = s.inactive_reason || 'Lainnya';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const reasonChartData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

    // Sensei performance (Average score from trackers)
    const senseiStats = senseiList.map(sensei => {
      const trackers = lessonTrackers.filter(lt => lt.senseiId === sensei.id);
      const avgScore = trackers.length > 0 ? (trackers.reduce((sum, lt) => sum + (lt.score || 0), 0) / trackers.length).toFixed(1) : 0;
      const totalSesi = trackers.length;
      return { name: sensei.name, score: parseFloat(avgScore as string), sessions: totalSesi };
    }).sort((a, b) => b.score - a.score);

    const CHART_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316'];

    return (
      <div className="space-y-8 pb-12">
        {/* Top 4 Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <UserCheck size={28} />
              </div>
              <TrendingUp size={20} className="text-emerald-500 opacity-40" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none">{activeStudentsCount}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 px-1">Siswa Aktif</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-2xl text-rose-600 dark:text-rose-400">
                <AlertCircle size={28} />
              </div>
              <TrendingUp size={20} className="text-rose-500 opacity-40 rotate-180" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none">{dropRate}%</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 px-1">Drop Rate (Total)</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl text-amber-600 dark:text-amber-400">
                <BarChart2 size={28} />
              </div>
              <Database size={20} className="text-amber-500 opacity-40" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none">{inactiveStudentsCount}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 px-1">Total Inactive</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 size={28} />
              </div>
              <TrendingUp size={20} className="text-indigo-500 opacity-40" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none">
              {(lessonTrackers.length / (studentList.length || 1)).toFixed(1)}
            </h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 px-1">Avg Sesi/Siswa</p>
          </motion.div>
        </div>

        {/* Charts Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reason Distribution Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
              <div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Analisis Alasan Berhenti</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Mengapa siswa berhenti belajar?</p>
              </div>
            </div>

            <div className="h-[350px]">
              {reasonChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <AlertCircle size={48} className="mb-4 text-slate-300" />
                  <p className="font-bold text-slate-400 uppercase tracking-widest">Belum Ada Data Inactive</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sensei Performance Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
              <div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Performa Rating Sensei</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Berdasarkan rata-rata nilai siswa</p>
              </div>
            </div>

            <div className="h-[350px]">
              {senseiStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={senseiStats.slice(0, 5)} layout="vertical" margin={{ left: 40, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="score" 
                      fill="#6366f1" 
                      radius={[0, 10, 10, 0]}
                      barSize={20}
                    >
                      {senseiStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 8 ? '#10b981' : entry.score > 7 ? '#6366f1' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <UserCheck size={48} className="mb-4 text-slate-300" />
                  <p className="font-bold text-slate-400 uppercase tracking-widest">Belum Ada Data Nilai</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-[0.3em] opacity-60 mb-6 font-mono">Summary Sensei</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-black font-mono">{(senseiList.length / (studentList.length || 1)).toFixed(2)}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Rasio Sensei/Siswa</p>
              </div>
              <div>
                <p className="text-4xl font-black font-mono">{lessonTrackers.filter(lt => isWithinInterval(parseISO(lt.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Sesi Bulan Ini</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-sm font-black uppercase tracking-[0.3em] opacity-60 mb-6 font-mono">Top Sensei Score</h4>
              <div className="space-y-4">
                {senseiStats.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black opacity-20 italic">#0{i+1}</span>
                      <span className="font-bold text-sm tracking-tight">{s.name}</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-black">
                      ★ {s.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Abstract visual background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          </div>
        </div>
      </div>
    );
  };

const CalendarView = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const dates = useMemo(() => {
      if (viewMode === 'week') {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
      } else {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
      }
    }, [currentDate, viewMode]);

    const filteredSchedules = useMemo(() => {
      const start = parseISO(dateRange.start);
      const end = parseISO(dateRange.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
      return schedules.filter(s => {
        if (!s.date) return false;
        const d = parseISO(s.date);
        if (Number.isNaN(d.getTime())) return false;
        return isWithinInterval(d, { start, end });
      });
    }, [schedules, dateRange]);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Calendar size={24} className="text-indigo-600" />
              Kalender Jadwal
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 hidden md:block"></div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <CalendarDays size={16} />
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <CalendarRange size={16} />
                Month
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 min-w-[150px] text-center">
                {format(currentDate, viewMode === 'week' ? 'MMMM yyyy' : 'MMMM yyyy')}
              </h2>
              <button 
                onClick={() => setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Filter size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                min="2026-03-01"
                max="2027-03-31"
                className="bg-transparent text-sm font-medium outline-none text-slate-600"
              />
              <span className="text-slate-300">to</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                min="2026-03-01"
                max="2027-03-31"
                className="bg-transparent text-sm font-medium outline-none text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-r border-slate-100 dark:border-slate-800 min-w-[180px]">
                  Sensei
                </th>
                {dates.map(date => (
                  <th key={date.toISOString()} className={`p-4 text-center border-b border-slate-100 dark:border-slate-800 min-w-[140px] ${isSameDay(date, new Date()) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(date, 'EEE')}</p>
                    <p className={`text-xl font-bold mt-1 ${isSameDay(date, new Date()) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{format(date, 'd')}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {senseiList.length === 0 ? (
                <tr>
                  <td colSpan={dates.length + 1} className="p-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="opacity-20" />
                      <p>Belum ada data Sensei. Silakan tambah di Master Data.</p>
                    </div>
                  </td>
                </tr>
              ) : senseiList.map(sensei => (
                <tr key={sensei.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 p-4 font-semibold text-slate-700 dark:text-slate-200 border-b border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {sensei.name}
                  </td>
                  {dates.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isOff = offDays.some(o => o.senseiId === sensei.id && o.date === dateStr);
                    const daySchedules = filteredSchedules.filter(s => s.senseiId === sensei.id && s.date === dateStr);
                    
                    return (
                      <td 
                        key={date.toISOString()} 
                        className={`p-2 border-b border-slate-100 dark:border-slate-800 align-top min-h-[100px] relative ${isSameDay(date, new Date()) ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                        onClick={() => {
                          if (!isOff) {
                            setSelectedCell({ senseiId: sensei.id, date });
                            setShowScheduleModal(true);
                          }
                        }}
                      >
                        {isOff ? (
                          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-[10px] font-bold p-2 rounded-xl border border-rose-100 dark:border-rose-800 flex items-center justify-center h-full min-h-[60px] cursor-not-allowed">
                            OFF
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {daySchedules.map(s => {
                              const sStudents = studentList.filter(st => scheduleHasStudent(s, st.id));
                              const hasNoShow = lessonTrackers.some(lt => lt.scheduleId === s.id && lt.attendance === 'No Show');
                              
                              return (
                                <motion.div 
                                  layoutId={s.id}
                                  key={s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSchedule(s);
                                    setShowScheduleModal(true);
                                  }}
                                  className={`p-2 rounded-xl border text-[11px] font-medium cursor-pointer shadow-sm hover:shadow-md transition-all ${
                                    hasNoShow 
                                      ? 'bg-rose-950 text-rose-100 border-rose-900 shadow-rose-900/20' 
                                      : (TYPE_COLORS[s.type] || TYPE_COLORS['blank'])
                                  }`}
                                  title={`${sStudents.map(st => st.name).join(', ') || 'Unknown'} - ${s.level} (${s.type})`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">{s.startTime} - {s.endTime}</span>
                                    {hasNoShow && <span className="bg-rose-500 text-[8px] px-1 rounded uppercase animate-pulse">No Show</span>}
                                    {!hasNoShow && <span className="opacity-60 text-[9px] uppercase">{s.type}</span>}
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-bold">
                                        {sStudents.length > 0 ? sStudents.map(st => st.name).join(', ') : 'Unknown Student'}
                                      </p>
                                      <p className="text-[9px] opacity-70">{s.level}</p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSchedule(s);
                                          setShowScheduleModal(true);
                                          // Note: In the modal, focus on Sensei could be improved but for now just opening Edit is standard
                                        }}
                                        className="p-1 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 transition-all text-slate-700 dark:text-white"
                                        title="Swap Sensei / Edit"
                                      >
                                        <UsersRound size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTrackerSchedule(s);
                                          setShowTrackerModal(true);
                                        }}
                                        className="p-1 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 transition-all text-slate-700 dark:text-white"
                                        title="Lesson Tracker"
                                      >
                                        <ClipboardList size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCell({ senseiId: sensei.id, date });
                                setShowScheduleModal(true);
                              }}
                              className="w-full h-10 flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all mt-1"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

const MasterData = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const filteredData = useMemo(() => {
      let results = [];
      const search = globalSearchTerm.toLowerCase();
      if (masterSubTab === 'sensei') {
        results = senseiList.filter(s => s.name.toLowerCase().includes(search));
      } else if (masterSubTab === 'student') {
        results = studentList.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(search);
          const isActive = s.is_active !== false;
          const matchesStatus = (studentStatusFilter === 'Active' && isActive) || (studentStatusFilter === 'Inactive' && !isActive);
          return matchesSearch && matchesStatus;
        });
      } else {
        results = offDays.filter(o => {
          const sensei = senseiList.find(s => s.id === o.senseiId);
          return sensei?.name.toLowerCase().includes(search) || o.reason.toLowerCase().includes(search);
        });
      }
      return results;
    }, [masterSubTab, senseiList, studentList, offDays, globalSearchTerm, studentStatusFilter]);

    useEffect(() => {
      setCurrentPage(1);
    }, [masterSubTab, globalSearchTerm, studentStatusFilter]);

    const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleSave = async () => {
      setIsSaving(true);
      const collectionName = masterSubTab === 'sensei' ? 'sensei' : masterSubTab === 'student' ? 'students' : 'offdays';
      const label = masterSubTab === 'sensei' ? 'Sensei' : masterSubTab === 'student' ? 'Student' : 'Off Day';
      
      try {
        await dbOps.save(collectionName, formData);
        toast.success(`${label} berhasil disimpan!`);
        setShowForm(false);
        setFormData({});
      } catch (err) {
        console.error('Save failed:', err);
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async () => {
      if (!deleteConfirm) return;
      
      const collectionName = masterSubTab === 'sensei' ? 'sensei' : masterSubTab === 'student' ? 'students' : 'offdays';
      const label = masterSubTab === 'sensei' ? 'Sensei' : masterSubTab === 'student' ? 'Student' : 'Off Day';
      
      try {
        await dbOps.delete(collectionName, deleteConfirm.id);
        toast.success(`${label} berhasil dihapus!`);
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total {masterSubTab === 'sensei' ? 'Sensei' : 'Student'}:</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{filteredData.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {masterSubTab === 'student' && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                <button 
                  onClick={() => setStudentStatusFilter('Active')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${studentStatusFilter === 'Active' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                >
                  Aktif
                </button>
                <button 
                  onClick={() => setStudentStatusFilter('Inactive')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${studentStatusFilter === 'Inactive' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}
                >
                  Inactive
                </button>
              </div>
            )}
            <button 
              onClick={() => exportToExcel(masterSubTab === 'sensei' ? senseiList : studentList, `${masterSubTab}_data`)}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              <Download size={18} />
              Export
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari data..." 
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64 dark:text-white"
              />
            </div>
            <button 
              onClick={() => { 
                const defaultData = masterSubTab === 'student' ? { is_active: true, payment_status: 'Unpaid' } : {};
                setFormData(defaultData); 
                setShowForm(true); 
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Plus size={20} />
              Tambah
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">No</th>
                {masterSubTab === 'offday' ? (
                  <>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Sensei</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Alasan</th>
                  </>
                ) : masterSubTab === 'sensei' ? (
                  <>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Nama</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">No. WA</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Level</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Catatan</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Nama Siswa</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Sensei</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Level (Awal/Skrg)</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Kelas & Durasi</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Payment</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Selesai Kapan</th>
                    <th className="p-4 text-left text-sm font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </>
                )}
                <th className="p-4 text-right text-sm font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <Database size={48} className="mx-auto mb-4 opacity-20" />
                    Belum ada data yang ditemukan.
                  </td>
                </tr>
              ) : paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  {masterSubTab === 'offday' ? (
                    <>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{senseiList.find(s => s.id === item.senseiId)?.name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.date && !Number.isNaN(parseISO(item.date).getTime()) ? format(parseISO(item.date), 'dd MMMM yyyy') : '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.reason}</td>
                    </>
                  ) : masterSubTab === 'sensei' ? (
                    <>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{item.name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.no_wa || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.email || '-'}</td>
                      <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">{item.level_mengajar || '-'}</td>
                      <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">{item.kelas_tersedia || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.note}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.phone}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.sensei_name || '-'}</td>
                      <td className="p-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Awal: {item.level_awal || '-'}</div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Skrg: {item.level_sekarang || item.level || '-'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.type}</div>
                        <div className="text-xs text-slate-400">{item.durasi_kelas ? item.durasi_kelas + ' mnt' : '-'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                          item.payment_status === 'Lunas' || item.payment_status === 'Paid' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : item.payment_status === 'Cicilan'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold">
                        {(() => {
                          const studentSchedules = schedules.filter(s => scheduleHasStudent(s, item.id) && s.status !== 'cancelled');
                          if (studentSchedules.length === 0) return <span className="text-slate-400">-</span>;
                          const dates = studentSchedules.map(s => parseISO(s.date).getTime()).filter(t => !Number.isNaN(t));
                          if (dates.length === 0) return <span className="text-slate-400">-</span>;
                          const maxDate = new Date(Math.max(...dates));
                          const today = new Date();
                          const diff = differenceInDays(maxDate, today);
                          
                          const isUrgent = diff >= 0 && diff <= 1;
                          const isOverdue = diff < 0;
 
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isUrgent ? 'text-rose-600' : isOverdue ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {format(maxDate, 'dd MMM yyyy')}
                              </span>
                              {isUrgent && (
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-1 rounded-lg"
                                  title="H-1 atau Hari Ini Selesai!"
                                >
                                  <Bell size={12} />
                                </motion.div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                          item.is_active !== false 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {(masterSubTab === 'student' || masterSubTab === 'sensei') && (
                        <button 
                          onClick={() => { 
                            setSelectedProfileData({ type: masterSubTab === 'sensei' ? 'sensei' : 'student', data: item }); 
                            setShowProfileModal(true); 
                          }}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      {masterSubTab === 'student' && (
                        <>
                          <button 
                            onClick={() => { setSelectedResourceStudent(item); setShowResourceHub(true); }}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800"
                            title="Resource Hub"
                          >
                            <BookOpen size={18} />
                          </button>
                          <button 
                            onClick={() => { setSelectedTrackerStudent(item); setShowTrackerModal(true); }}
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800"
                            title="Lesson Tracker"
                          >
                            <ClipboardList size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setFormData(item); setShowForm(true); }}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ id: item.id, name: masterSubTab === 'offday' ? senseiList.find(s => s.id === item.senseiId)?.name || 'Off Day' : item.name })}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    {formData.id ? 'Edit' : 'Tambah'} {masterSubTab === 'sensei' ? 'Sensei' : masterSubTab === 'student' ? 'Student' : 'Off Day'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {masterSubTab === 'offday' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sensei</label>
                        <select 
                          value={formData.senseiId || ''}
                          onChange={e => setFormData({ ...formData, senseiId: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                        >
                          <option value="">Pilih Sensei</option>
                          {senseiList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
                        <input 
                          type="date" 
                          value={formData.date || ''}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Alasan</label>
                        <textarea 
                          value={formData.reason || ''}
                          onChange={e => setFormData({ ...formData, reason: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                          placeholder="Masukkan nama..."
                        />
                      </div>
                      {masterSubTab === 'sensei' ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No. WhatsApp</label>
                              <input 
                                type="text" 
                                value={formData.no_wa || ''}
                                onChange={e => setFormData({ ...formData, no_wa: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                placeholder="08..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                              <input 
                                type="email" 
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                placeholder="email@ext.com"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Level Mengajar</label>
                              <select 
                                value={formData.level_mengajar || 'blank'}
                                onChange={e => setFormData({ ...formData, level_mengajar: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kelas Tersedia</label>
                              <select 
                                value={formData.kelas_tersedia || 'blank'}
                                onChange={e => setFormData({ ...formData, kelas_tersedia: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Catatan</label>
                            <textarea 
                              value={formData.note || ''}
                              onChange={e => setFormData({ ...formData, note: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              placeholder="Masukkan catatan..."
                              rows={2}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No. WhatsApp</label>
                              <input 
                                type="text" 
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                placeholder="Contoh: 08123456789"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Sensei</label>
                              <select 
                                value={formData.sensei_name || ''}
                                onChange={e => setFormData({ ...formData, sensei_name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                <option value="">Pilih Sensei...</option>
                                {senseiList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Level Awal</label>
                              <select 
                                value={formData.level_awal || 'blank'}
                                onChange={e => setFormData({ ...formData, level_awal: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Level Sekarang</label>
                              <select 
                                value={formData.level_sekarang || formData.level || 'blank'}
                                onChange={e => setFormData({ ...formData, level_sekarang: e.target.value, level: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipe Kelas</label>
                              <select 
                                value={formData.type || 'blank'}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Durasi (Menit)</label>
                              <input 
                                type="text" 
                                value={formData.durasi_kelas || ''}
                                onChange={e => setFormData({ ...formData, durasi_kelas: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                placeholder="30, 60, 90..."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status Pembayaran</label>
                              <select 
                                value={formData.payment_status || 'Unpaid'}
                                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                                <option value="Lunas">Lunas</option>
                                <option value="Cicilan">Cicilan</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status Siswa</label>
                              <select 
                                value={formData.is_active === false ? 'Inactive' : 'Active'}
                                onChange={e => setFormData({ ...formData, is_active: e.target.value === 'Active' })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>

                          {formData.is_active === false && (
                            <div className="mt-4">
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Alasan Berhenti</label>
                              <input 
                                type="text"
                                value={formData.inactive_reason || ''}
                                onChange={e => setFormData({ ...formData, inactive_reason: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                placeholder="Contoh: Pindah rumah, Lulus, Biaya, dll."
                              />
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Resource Hub Links (Optional)</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Google Classroom URL</label>
                                <input 
                                  type="url"
                                  value={formData.classroom_link || ''}
                                  onChange={e => setFormData({ ...formData, classroom_link: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                  placeholder="https://classroom.google.com/..."
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Google Chat Space URL</label>
                                <input 
                                  type="url"
                                  value={formData.chat_link || ''}
                                  onChange={e => setFormData({ ...formData, chat_link: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                  placeholder="https://mail.google.com/chat/..."
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Progress Google Sheets URL</label>
                                <input 
                                  type="url"
                                  value={formData.progress_link || ''}
                                  onChange={e => setFormData({ ...formData, progress_link: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                  placeholder="https://docs.google.com/spreadsheets/..."
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Curriculum Google Sheets URL</label>
                                <input 
                                  type="url"
                                  value={formData.curriculum_link || ''}
                                  onChange={e => setFormData({ ...formData, curriculum_link: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                  placeholder="https://docs.google.com/spreadsheets/..."
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                  <button 
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Loader2 size={20} />
                        </motion.div>
                        Menyimpan...
                      </>
                    ) : 'Simpan'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

const UserManagement = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('lastLogin', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        toast.error(`Gagal mengambil data user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUsers();
    }, []);

    const handleToggleStatus = async (user: any) => {
      const newStatus = user.status === 'Approved' ? 'Pending' : 'Approved';
      try {
        const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
        if (error) throw error;
        toast.success(`User ${newStatus === 'Approved' ? 'disetujui' : 'ditangguhkan'}`);
        fetchUsers();
      } catch (err: any) {
        toast.error('Gagal update status: ' + err.message);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchUsers}
              className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
              title="Refresh Users"
            >
              <Repeat size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
              Super Admin Mode
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Last Login</th>
                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'Super Admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'Approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{u.lastLogin && !Number.isNaN(parseISO(u.lastLogin).getTime()) ? format(parseISO(u.lastLogin), 'dd MMM yyyy HH:mm') : 'Never'}</td>
                  <td className="p-4 text-right">
                    {u.role !== 'Super Admin' && (
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline"
                      >
                        {u.status === 'Approved' ? 'Revoke' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

const SmartChecker = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [checkDate, setCheckDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [availableSensei, setAvailableSensei] = useState<Sensei[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = () => {
      const inputStart = startTime;
      const inputEnd = endTime;
      
      const results = senseiList.filter(sensei => {
        // Check Off Days
        const isOff = offDays.some(o => o.senseiId === sensei.id && o.date === checkDate);
        if (isOff) return false;

        // Check Schedule Overlaps
        const hasOverlap = schedules.some(s => {
          if (s.senseiId !== sensei.id || s.date !== checkDate || s.status === 'cancelled') return false;
          // Logic: (Existing Start < Input End) AND (Existing End > Input Start)
          return s.startTime < inputEnd && s.endTime > inputStart;
        });

        return !hasOverlap;
      });

      setAvailableSensei(results);
      setHasSearched(true);
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-2xl text-pink-600 dark:text-pink-400">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cari Sensei Tersedia</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Temukan pengajar yang tidak memiliki jadwal tumpang tindih.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={checkDate}
                  onChange={e => setCheckDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jam Mulai</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jam Selesai</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSearch}
            className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 dark:shadow-none hover:scale-[1.01] transition-all active:scale-[0.99]"
          >
            Cek Ketersediaan
          </button>
        </div>

        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              Hasil Pencarian 
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">{availableSensei.length} Ditemukan</span>
            </h3>
            
            {availableSensei.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                <AlertCircle size={48} className="mx-auto text-rose-300 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Maaf, tidak ada Sensei yang tersedia pada waktu tersebut.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSensei.map(sensei => (
                  <div key={sensei.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-pink-200 dark:hover:border-pink-900 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-500 dark:text-pink-400 font-bold text-xl">
                        {sensei.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{sensei.name}</h4>
                        <p className="text-xs text-slate-400">{sensei.note || 'No notes'}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Available
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };

const LessonTrackerModal = (props: any) => {
        const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const student = selectedTrackerStudent || studentList.find(s => selectedTrackerSchedule && scheduleHasStudent(selectedTrackerSchedule, s.id));
    const sensei = selectedTrackerSchedule ? senseiList.find(s => s.id === selectedTrackerSchedule.senseiId) : null;
    const defaultDate = selectedTrackerSchedule?.date || format(new Date(), 'yyyy-MM-dd');

    const [formData, setFormData] = useState<Partial<LessonTracker>>({
      date: defaultDate,
      actualStartTime: selectedTrackerSchedule?.startTime || format(new Date(), 'HH:mm'),
      attendance: 'Hadir',
      material: '',
      score: 0,
      notes: '',
      caseNotes: '',
      studentFeedback: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Effect to check if there is an in-progress tracker for this schedule
    useEffect(() => {
      if (selectedTrackerSchedule) {
        const inProgress = lessonTrackers.find(lt => 
          lt.scheduleId === selectedTrackerSchedule.id && 
          lt.date === selectedTrackerSchedule.date &&
          !lt.material
        );
        if (inProgress) {
          setEditingId(inProgress.id);
          setFormData({
            date: inProgress.date,
            actualStartTime: inProgress.actualStartTime || '',
            attendance: inProgress.attendance,
            material: inProgress.material,
            score: inProgress.score,
            notes: inProgress.notes,
            caseNotes: inProgress.caseNotes || '',
            studentFeedback: inProgress.studentFeedback || ''
          });
        }
      }
    }, [selectedTrackerSchedule, lessonTrackers]);

    const history = useMemo(() => {
      if (!student) return [];
      return lessonTrackers
        .filter(lt => lt.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [student, lessonTrackers]);

    const handleSave = async () => {
      if (!student) return;
      setIsSaving(true);
      try {
        const now = new Date();
        let isDelayed = false;
        let actualStartTimeStr = formData.actualStartTime || format(now, 'HH:mm');

        if (selectedTrackerSchedule && !editingId) {
          try {
            const scheduledDate = parseISO(selectedTrackerSchedule.date);
            const scheduledTime = parse(selectedTrackerSchedule.startTime, 'HH:mm', scheduledDate);
            const actualTime = parse(actualStartTimeStr, 'HH:mm', scheduledDate);
            const diff = differenceInMinutes(actualTime, scheduledTime);
            if (diff > 10) {
              isDelayed = true;
            }
          } catch (e) {
            console.error('Error calculating delay:', e);
          }
        }

        if (editingId) {
          const original = lessonTrackers.find(lt => lt.id === editingId);
          if (!original) throw new Error('Original record not found');
          
          const updatedTracker: LessonTracker = {
            ...original,
            date: formData.date || format(new Date(), 'yyyy-MM-dd'),
            attendance: formData.attendance as any,
            material: formData.material || '',
            score: Number(formData.score) || 0,
            notes: formData.notes || '',
            caseNotes: formData.caseNotes || '',
            studentFeedback: formData.studentFeedback || '',
          };
          await dbOps.save('lesson_trackers', updatedTracker);
          toast.success('Progress berhasil diperbarui!');
        } else {
          const newTracker: LessonTracker = {
            id: `${Date.now()}-${crypto.randomUUID()}`,
            scheduleId: selectedTrackerSchedule?.id || '',
            studentId: student.id,
            senseiId: sensei?.id || '',
            date: formData.date || format(new Date(), 'yyyy-MM-dd'),
            attendance: formData.attendance as any,
            material: formData.material || '',
            score: Number(formData.score) || 0,
            notes: formData.notes || '',
            caseNotes: formData.caseNotes || '',
            studentFeedback: formData.studentFeedback || '',
            actualStartTime: actualStartTimeStr,
            isDelayed,
            createdAt: new Date().toISOString()
          };
          await dbOps.save('lesson_trackers', newTracker);
          toast.success(isDelayed ? 'Progress disimpan! (Sesi Terlambat)' : 'Progress berhasil disimpan!');
        }
        
        setFormData({
          date: defaultDate,
          actualStartTime: format(new Date(), 'HH:mm'),
          attendance: 'Hadir',
          material: '',
          score: 0,
          notes: '',
          caseNotes: '',
          studentFeedback: ''
        });
        setEditingId(null);
      } catch (error) {
        console.error('Save tracker failed:', error);
        toast.error('Gagal menyimpan progress');
      } finally {
        setIsSaving(false);
      }
    };

    const handleEdit = (item: LessonTracker) => {
      setFormData({
        date: item.date,
        actualStartTime: item.actualStartTime || '',
        attendance: item.attendance,
        material: item.material,
        score: item.score,
        notes: item.notes,
        caseNotes: item.caseNotes || '',
        studentFeedback: item.studentFeedback || ''
      });
      setEditingId(item.id);
      const formElement = document.getElementById('tracker-form');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
      try {
        await dbOps.delete('lesson_trackers', id);
        toast.success('Riwayat sesi berhasil dihapus');
        setConfirmDeleteId(null);
        if (editingId === id) {
          setEditingId(null);
          setFormData({
            date: defaultDate,
            attendance: 'Hadir',
            material: '',
            score: 0,
            notes: ''
          });
        }
      } catch (error) {
        console.error('Delete tracker failed:', error);
        toast.error('Gagal menghapus riwayat sesi');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
        >
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Lesson Tracker</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Progress Belajar: <span className="font-bold text-indigo-600 dark:text-indigo-400">{student?.name}</span> {sensei && (
                    <> oleh <span className="font-bold text-emerald-600 dark:text-emerald-400">{sensei.name}</span></>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setShowTrackerModal(false); setSelectedTrackerSchedule(null); setSelectedTrackerStudent(null); }} 
              className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Form Section */}
            <div id="tracker-form" className="w-full md:w-1/2 p-8 overflow-y-auto border-r border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{editingId ? 'Edit Riwayat Sesi' : 'Input Progress Baru'}</h4>
                {editingId && (
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          date: defaultDate,
                          attendance: 'Hadir',
                          material: '',
                          score: 0,
                          notes: ''
                        });
                      }}
                      className="text-[10px] font-bold text-rose-500 uppercase hover:underline"
                    >
                      Batal Edit
                    </button>
                )}
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
                    <input 
                      type="date" 
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kehadiran</label>
                    <select 
                      value={formData.attendance || ''}
                      onChange={e => setFormData({ ...formData, attendance: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                    >
                      {['Hadir', 'Izin', 'Sakit', 'Alpa', 'No Show'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jam Mulai Sebenarnya</label>
                    <input 
                      type="time" 
                      value={formData.actualStartTime || ''}
                      onChange={e => setFormData({ ...formData, actualStartTime: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">* Digunakan untuk memantau ketepatan waktu</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progress Score (0-100)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={formData.score || ''}
                      onChange={e => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Materi Belajar</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Hiragana Ba-Pa, Partikel wa/ga..."
                    value={formData.material || ''}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catatan Ke Sensei / Admin</label>
                  <textarea 
                    rows={3}
                    placeholder="Siswa sudah lancar di bab 1, perlu pengulangan di kata kerja..."
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white resize-none mb-4"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Case Student / Notes (Internal)</label>
                  <textarea 
                    rows={3}
                    placeholder="Kendala khusus siswa, minat belajar, dll..."
                    value={formData.caseNotes || ''}
                    onChange={e => setFormData({ ...formData, caseNotes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student Feedback</label>
                  <textarea 
                    rows={3}
                    placeholder="Feedback balik dari siswa kedepannya..."
                    value={formData.studentFeedback || ''}
                    onChange={e => setFormData({ ...formData, studentFeedback: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full py-4 ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'} text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <CheckCircle2 size={20} /> : <Plus size={20} />)}
                    {editingId ? 'Perbarui Sesi' : 'Simpan Progress Hari Ini'}
                  </button>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="w-full md:w-1/2 p-8 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center">
                Riwayat Sesi
                <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg text-[10px] lowercase">{history.length} sesi total</span>
              </h4>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <BookOpen size={40} className="mx-auto text-slate-200 mb-4 opacity-50" />
                    <p className="text-sm text-slate-400 font-medium italic">Belum ada riwayat progress untuk siswa ini.</p>
                  </div>
                ) : (
                  history.map(item => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.id} 
                      className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{format(parseISO(item.date), 'dd MMMM yyyy')}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                              item.attendance === 'Hadir' ? 'bg-emerald-100 text-emerald-600' : 
                              item.attendance === 'No Show' ? 'bg-rose-950 text-rose-100' :
                              'bg-rose-100 text-rose-600'
                            }`}>
                              {item.attendance}
                            </span>
                            {item.actualStartTime && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Start: {item.actualStartTime}
                              </span>
                            )}
                            {item.isDelayed && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-rose-600 text-white border border-rose-700 shadow-sm animate-pulse">
                                LATE
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-lg border border-rose-100 dark:border-rose-800">
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="px-2 py-1 text-[9px] font-bold text-white bg-rose-600 rounded-md shadow-sm"
                              >
                                Ya, Hapus
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-[9px] font-bold text-slate-500 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                title="Edit Sesi"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                title="Hapus Sesi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-xl">
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mb-0.5">SCORE</p>
                            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">{item.score}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Materi</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.material}</p>
                        </div>
                        {item.notes && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Catatan</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">"{item.notes}"</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

const RekapAbsensiModal = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const filteredTrackers = useMemo(() => {
      return lessonTrackers.filter(lt => {
        const d = parseISO(lt.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
    }, [selectedMonth, selectedYear, lessonTrackers]);

    // --- HELPERS ---

  const handleDownloadExcel = () => {
      if (filteredTrackers.length === 0) {
        toast.error('Tidak ada data untuk bulan/tahun ini');
        return;
      }

      const data = filteredTrackers.map(lt => {
        const student = studentList.find(s => s.id === lt.studentId);
        const sensei = senseiList.find(s => s.id === lt.senseiId);
        return {
          'Nama Siswa': student?.name || 'Unknown',
          'Nama Sensei': sensei?.name || 'Unknown',
          'Tanggal': lt.date,
          'Materi': lt.material,
          'Jam Mulai': lt.actualStartTime || '-',
          'Kehadiran': lt.attendance,
          'Nilai': lt.score,
          'Status Ketepatan Waktu': lt.isDelayed ? 'Delayed/Terlambat' : 'Tepat Waktu',
          'Catatan': lt.notes,
          'Internal Case': lt.caseNotes || '',
          'Feedback Siswa': lt.studentFeedback || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
      XLSX.writeFile(wb, `Rekap_Absensi_${months[selectedMonth]}_${selectedYear}.xlsx`);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20"
        >
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Rekap Absensi Bulanan</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold">Progress Akademik & Performa</p>
              </div>
            </div>
            <button onClick={() => setShowRekapModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bulan</label>
                <select 
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tahun</label>
                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ringkasan Data</h4>
                <div className="bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                  {filteredTrackers.length} Sesi Ditemukan
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Terlambat</p>
                  <p className="text-xl font-black text-rose-500">{filteredTrackers.filter(lt => lt.isDelayed).length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tepat Waktu</p>
                  <p className="text-xl font-black text-emerald-500">{filteredTrackers.filter(lt => !lt.isDelayed).length}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDownloadExcel}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              <FileText size={20} />
              Download Rekap Excel
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

const ProfileViewModal = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    if (!selectedProfileData) return null;
    const { type, data } = selectedProfileData;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Profile Detail</h3>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black leading-tight">
                  {type === 'sensei' ? 'Informasi Sensei / Pengajar' : 'Informasi Siswa / Pelajar'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {data.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{data.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {type === 'sensei' ? 'Sensei' : 'Student'}
                  </span>
                  {type === 'student' && (
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      data.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {data.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Info Blocks */}
              {type === 'sensei' ? (
                <>
                  <div className="md:col-span-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.no_wa || '-'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.email || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Level Mengajar</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.level_mengajar || '-'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kelas Tersedia</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.kelas_tersedia || '-'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Level</label>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm">
                      {data.level_sekarang || data.level || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipe & Durasi</label>
                    <p className="text-slate-700 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                      {data.type || '-'} | {data.durasi_kelas || '-'}
                    </p>
                  </div>
                </>
              )}

              {/* Full Width Section */}
              <div className="md:col-span-3">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {type === 'sensei' ? 'Catatan / Deskripsi' : 'Sensei Pengajar & Info Pelajaran'}
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {type === 'sensei' ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">{data.note || 'Tidak ada catatan tambahan.'}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase mr-2">Sensei Pendamping</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 text-right truncate">{data.sensei_name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase mr-2">Payment Status</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                          data.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>{data.payment_status || 'UNPAID'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              {type === 'student' && data.chat_link && (
                <a 
                  href={data.chat_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-100 dark:shadow-none"
                >
                  <MessageSquare size={14} />
                  Chat Siswa
                </a>
              )}
              {type === 'student' && data.classroom_link && (
                <a 
                  href={data.classroom_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  <ExternalLink size={14} />
                  Classroom
                </a>
              )}
              {type === 'student' && data.progress_link && (
                <a 
                  href={data.progress_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-50"
                >
                  <BarChart2 size={14} />
                  Progress
                </a>
              )}
              {type === 'student' && data.curriculum_link && (
                <a 
                  href={data.curriculum_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-50"
                >
                  <BookOpen size={14} />
                  Kurikulum
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

const ResourceHubModal = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    if (!selectedResourceStudent) return null;

    const links = [
      { label: 'Google Classroom', url: selectedResourceStudent.classroom_link, color: 'bg-emerald-500', icon: <BookOpen size={20} /> },
      { label: 'Google Chat Space', url: selectedResourceStudent.chat_link, color: 'bg-indigo-500', icon: <MessageSquare size={20} /> },
      { label: 'Progress Siswa', url: selectedResourceStudent.progress_link, color: 'bg-blue-500', icon: <Database size={20} /> },
      { label: 'Kurikulum & Materi', url: selectedResourceStudent.curriculum_link, color: 'bg-amber-500', icon: <FileText size={20} /> },
    ];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-white/20"
        >
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100 dark:shadow-none">
              <Database size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Resource Hub</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{selectedResourceStudent.name}</p>
          </div>

          <div className="p-8 space-y-3">
            {links.map((link, idx) => (
              <a 
                key={idx}
                href={link.url || '#'}
                target={link.url ? "_blank" : undefined}
                rel="noreferrer"
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  link.url 
                    ? `${link.color} text-white shadow-lg hover:translate-x-2 active:scale-95` 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    {link.icon}
                  </div>
                  <span className="font-bold text-sm">{link.label}</span>
                </div>
                {link.url ? (
                  <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <span className="text-[10px] font-bold">MISSING</span>
                )}
              </a>
            ))}
          </div>

          <button 
            onClick={() => setShowResourceHub(false)}
            className="m-8 mt-0 py-4 rounded-2xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            Tutup
          </button>
        </motion.div>
      </div>
    );
  };

const ScheduleModal = (props: any) => {
      const { activeTab, setActiveTab, masterSubTab, setMasterSubTab, syncConfig, setSyncConfig, dbStatus, setDbStatus, gasUrl, setGasUrl, isSyncing, setIsSyncing, lastSync, setLastSync, showSettings, setShowSettings, senseiList, setSenseiList, studentList, setStudentList, offDays, setOffDays, schedules, setSchedules, lessonTrackers, setLessonTrackers, viewMode, setViewMode, currentDate, setCurrentDate, studentStatusFilter, setStudentStatusFilter, globalSearchTerm, setGlobalSearchTerm, dateRange, setDateRange, showScheduleModal, setShowScheduleModal, showTrackerModal, setShowTrackerModal, showRekapModal, setShowRekapModal, showProfileModal, setShowProfileModal, selectedProfileData, setSelectedProfileData, selectedTrackerSchedule, setSelectedTrackerSchedule, selectedTrackerStudent, setSelectedTrackerStudent, showResourceHub, setShowResourceHub, selectedResourceStudent, setSelectedResourceStudent, editingSchedule, setEditingSchedule, selectedCell, setSelectedCell, isSidebarOpen, setIsSidebarOpen, user, setUser, authLoading, setAuthLoading, theme, setTheme, indonesianDayName, analytics, supabase, handleFullSync, handlePullData, sanitizeData, dbOps, isSuperAdmin, ADMIN_EMAILS } = props;
    const [formData, setFormData] = useState<any>(() => {
      if (editingSchedule) {
        const start = parseISO(`2000-01-01T${editingSchedule.startTime}`);
        const end = parseISO(`2000-01-01T${editingSchedule.endTime}`);
        const diffMs = end.getTime() - start.getTime();
        const duration = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        return { 
          ...editingSchedule, 
          duration,
          studentIds: editingSchedule.studentIds || (editingSchedule.studentId ? [editingSchedule.studentId] : [])
        };
      }
      if (selectedCell) return { 
        senseiId: selectedCell.senseiId, 
        date: format(selectedCell.date, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:30',
        duration: 90,
        type: 'Private',
        level: 'Intensif N5',
        status: 'active',
        targetSessions: 1,
        daysOfWeek: [],
        studentIds: []
      };
      return {
        senseiId: senseiList[0]?.id || '',
        studentIds: [],
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:30',
        duration: 90,
        type: 'Private',
        level: 'Intensif N5',
        status: 'active',
        targetSessions: 1,
        daysOfWeek: []
      };
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSenseiBusy = useMemo(() => {
      if (!formData.senseiId || !formData.date || !formData.startTime || !formData.endTime) return false;
      return schedules.some(s => {
        if (s.id === editingSchedule?.id) return false;
        if (s.senseiId !== formData.senseiId || s.date !== formData.date || s.status === 'cancelled') return false;
        return (formData.startTime < s.endTime && formData.endTime > s.startTime);
      });
    }, [formData.senseiId, formData.date, formData.startTime, formData.endTime, schedules, editingSchedule]);

    const isSenseiOff = useMemo(() => {
      if (!formData.senseiId || !formData.date) return false;
      return offDays.some(o => o.senseiId === formData.senseiId && o.date === formData.date);
    }, [formData.senseiId, formData.date, offDays]);

    const estimatedFinishDate = useMemo(() => {
      if (!formData.date || formData.targetSessions <= 1) return formData.date;
      try {
        let sessionsCreated = 0;
        let currentDateObj = parseISO(formData.date);
        const selectedDays = formData.daysOfWeek && formData.daysOfWeek.length > 0 ? formData.daysOfWeek : [getDay(currentDateObj)];
        let lastDate = currentDateObj;
        let safetyCounter = 0;
        while (sessionsCreated < formData.targetSessions && safetyCounter < 1000) {
          if (selectedDays.includes(getDay(currentDateObj))) {
            lastDate = currentDateObj;
            sessionsCreated++;
          }
          if (sessionsCreated < formData.targetSessions) {
            currentDateObj = addDays(currentDateObj, 1);
          }
          safetyCounter++;
        }
        return format(lastDate, 'yyyy-MM-dd');
      } catch (e) { return formData.date; }
    }, [formData.date, formData.targetSessions, formData.daysOfWeek]);

    useEffect(() => {
      if (formData.startTime && formData.duration) {
        try {
          const [hours, minutes] = formData.startTime.split(':').map(Number);
          const date = new Date(2000, 0, 1, hours, minutes);
          const endDate = new Date(date.getTime() + formData.duration * 60000);
          const calculatedEndTime = format(endDate, 'HH:mm');
          if (calculatedEndTime !== formData.endTime) {
            setFormData((prev: any) => ({ ...prev, endTime: calculatedEndTime }));
          }
        } catch (e) { console.error('Error calculating end time:', e); }
      }
    }, [formData.startTime, formData.duration]);

    const [senseiSearch, setSenseiSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const filteredSensei = senseiList.filter(s => s.name.toLowerCase().includes(senseiSearch.toLowerCase()));
    const filteredStudents = studentList
      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
      .filter(s => !formData.studentIds?.includes(s.id));

    const handleSaveSchedule = async () => {
      if (!formData.senseiId) return toast.error('Silahkan pilih Sensei');
      if (!formData.studentIds || formData.studentIds.length === 0) return toast.error('Silahkan pilih minimal satu Siswa');
      setIsSubmitting(true);
      try {
        const newSchedules: Schedule[] = [];
        let sessionsCreated = 0;
        let currentDateObj = parseISO(formData.date);
        if (Number.isNaN(currentDateObj.getTime())) throw new Error('Tanggal mulai tidak valid');
        
        if (formData.targetSessions > 1 && !editingSchedule) {
          const selectedDays = formData.daysOfWeek && formData.daysOfWeek.length > 0 ? formData.daysOfWeek : [getDay(currentDateObj)];
          let safetyCounter = 0;
          while (sessionsCreated < formData.targetSessions && safetyCounter < 1000) {
            if (selectedDays.includes(getDay(currentDateObj))) {
              newSchedules.push({
                id: `${Date.now()}-${sessionsCreated}-${crypto.randomUUID()}`,
                senseiId: formData.senseiId,
                studentIds: formData.studentIds,
                type: formData.type,
                level: formData.level,
                date: format(currentDateObj, 'yyyy-MM-dd'),
                startTime: formData.startTime,
                endTime: formData.endTime,
                status: 'active',
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || 'System'
              });
              sessionsCreated++;
            }
            currentDateObj = addDays(currentDateObj, 1);
            safetyCounter++;
          }
        } else {
          newSchedules.push({
            id: editingSchedule?.id || `${Date.now()}-${crypto.randomUUID()}`,
            senseiId: formData.senseiId,
            studentIds: formData.studentIds,
            type: formData.type,
            level: formData.level,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            status: formData.status,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.email || 'System'
          });
        }
        await dbOps.bulkSave('schedules', newSchedules);
        toast.success(editingSchedule ? 'Jadwal berhasil diperbarui!' : `Berhasil membuat ${newSchedules.length} jadwal!`);
        setShowScheduleModal(false);
        setEditingSchedule(null);
        setSelectedCell(null);
      } catch (error: any) {
        toast.error(`Gagal menyimpan jadwal: ${error.message}`);
      } finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
      if (!editingSchedule) return;
      setIsDeleting(true);
      try {
        await dbOps.delete('schedules', editingSchedule.id);
        toast.success('Jadwal berhasil dihapus!');
        setShowScheduleModal(false);
        setEditingSchedule(null);
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20"
        >
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{editingSchedule ? 'Edit Jadwal' : 'Buat Jadwal Baru'}</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Lengkapi detail sesi belajar di bawah ini.</p>
            </div>
            <button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); }} className="p-2 md:p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm dark:text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto space-y-6">
            {(isSenseiBusy || isSenseiOff) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={`p-4 rounded-2xl border flex items-center gap-3 ${isSenseiOff ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <AlertCircle size={20} className={isSenseiOff ? 'text-rose-500' : 'text-amber-500'} />
                <div className="text-sm font-bold">{isSenseiOff ? 'Sensei sedang OFF di tanggal ini!' : 'Sensei sudah memiliki jadwal lain di jam yang sama!'}</div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                  Sensei
                  {formData.senseiId && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSenseiBusy || isSenseiOff ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {isSenseiOff ? 'OFF' : isSenseiBusy ? 'Busy' : 'Available'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari Sensei..."
                    value={senseiSearch || (senseiList.find(s => s.id === formData.senseiId)?.name || '')}
                    onChange={e => { setSenseiSearch(e.target.value); if (!e.target.value) setFormData((prev: any) => ({ ...prev, senseiId: '' })); }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
                {senseiSearch && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl max-h-40 overflow-y-auto text-slate-700 dark:text-slate-300">
                    {filteredSensei.map(s => {
                      const busy = schedules.some(sc => sc.senseiId === s.id && sc.date === formData.date && sc.status === 'active' && formData.startTime < sc.endTime && formData.endTime > sc.startTime);
                      const off = offDays.some(o => o.senseiId === s.id && o.date === formData.date);
                      return (
                        <div key={s.id} onClick={() => { setFormData((prev: any) => ({ ...prev, senseiId: s.id })); setSenseiSearch(''); }} className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-medium flex justify-between items-center">
                          <span>{s.name}</span>
                          <span className={`text-[9px] font-black uppercase ${off ? 'text-rose-500' : busy ? 'text-amber-500' : 'text-emerald-500'}`}>{off ? 'OFF' : busy ? 'Busy' : 'Available'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipe Kelas</label>
                <select value={formData.type || 'Private'} onChange={e => {
                  const newType = e.target.value;
                  const studentIds = formData.studentIds || [];
                  const adjustedStudentIds = (newType === 'Private' || newType === 'Kids Private') && studentIds.length > 1 ? [studentIds[0]] : studentIds;
                  setFormData((prev: any) => ({ ...prev, type: newType, studentIds: adjustedStudentIds }));
                }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white">
                  {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Student(s) {(formData.type === 'Group' || formData.type === 'Semi-Private') && <span className="ml-2 text-indigo-500 normal-case">(Bisa pilih multi)</span>}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.studentIds?.map((sid: string) => (
                    <div key={sid} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs font-bold shadow-sm">
                      {studentList.find(st => st.id === sid)?.name || 'Unknown'}
                      <button onClick={() => setFormData((prev: any) => ({ ...prev, studentIds: prev.studentIds.filter((id: string) => id !== sid) }))} className="hover:text-rose-500"><X size={14} /></button>
                    </div>
                  ))}
                  {(!formData.studentIds || formData.studentIds.length === 0) && <span className="text-xs text-slate-400 italic">Belum ada siswa terpilih</span>}
                </div>
                {((formData.type !== 'Private' && formData.type !== 'Kids Private') || (formData.studentIds?.length || 0) < 1) && (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari & Tambah Siswa..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                    {studentSearch && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl max-h-40 overflow-y-auto text-slate-700 dark:text-slate-300">
                        {filteredStudents.map(s => <div key={s.id} onClick={() => { setFormData((prev: any) => ({ ...prev, studentIds: [...(prev.studentIds || []), s.id], level: s.level_sekarang || s.level })); setStudentSearch(''); }} className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-medium">{s.name} <span className="text-[10px] text-slate-400 ml-2">({s.level})</span></div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:col-span-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Level Materi</label>
                  <select value={formData.level || 'Intensif N5'} onChange={e => setFormData((prev: any) => ({ ...prev, level: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white">
                    {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData((prev: any) => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jam Mulai</label>
                  <input type="time" value={formData.startTime || ''} onChange={e => setFormData((prev: any) => ({ ...prev, startTime: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">Durasi (Menit) <span className="text-indigo-500 font-mono text-[10px]">{formData.endTime && `Selesai: ${formData.endTime}`}</span></label>
                  <input type="number" value={formData.duration || ''} onChange={e => setFormData((prev: any) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                </div>
              </div>

              {!editingSchedule && (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Repeat Sesi</label>
                      <input type="number" min="1" max="100" value={formData.targetSessions || 1} onChange={e => setFormData((prev: any) => ({ ...prev, targetSessions: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
                    </div>
                    {formData.targetSessions > 1 && (
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimasi Selesai</label>
                        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl border border-indigo-100 dark:border-indigo-800 text-sm">{format(parseISO(estimatedFinishDate), 'dd MMM yyyy')}</div>
                      </div>
                    )}
                  </div>
                  {formData.targetSessions > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button key={day.value} onClick={() => {
                          const current = formData.daysOfWeek || [];
                          const updated = current.includes(day.value) ? current.filter((d: number) => d !== day.value) : [...current, day.value];
                          setFormData((prev: any) => ({ ...prev, daysOfWeek: updated }));
                        }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${formData.daysOfWeek?.includes(day.value) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{day.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
            {editingSchedule && <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-3 rounded-2xl font-black text-rose-600 hover:bg-rose-50 transition-all uppercase tracking-widest text-[10px]"><Trash2 size={16} />Hapus</button>}
            <div className="flex gap-3 ml-auto">
              <button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); }} className="px-8 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Batal</button>
              <button disabled={isSubmitting || !formData.senseiId || !formData.studentIds || formData.studentIds.length === 0} onClick={handleSaveSchedule} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-widest text-[10px] disabled:opacity-50">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingSchedule ? 'Update Jadwal' : 'Simpan Jadwal'}</button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-2xl w-full max-w-sm border border-rose-100 text-center">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Jadwal?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sesi belajar ini akan dihapus secara permanen.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Batal</button>
                  <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">{isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Hapus'}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };


const ADMIN_EMAILS = ['contact.ilusa@gmail.com', 'yugegirip@gmail.com'];

const UI_TO_DB_MAP: Record<string, string> = {
  'senseiId': 'sensei_id',
  'studentId': 'student_id',
  'studentIds': 'student_ids',
  'startTime': 'start_time',
  'endTime': 'end_time',
  'updatedAt': 'updated_at',
  'updatedBy': 'updated_by',
  'scheduleId': 'schedule_id',
  'actualStartTime': 'actual_start_time',
  'caseNotes': 'case_notes',
  'studentFeedback': 'student_feedback',
  'isDelayed': 'is_delayed',
  'createdAt': 'created_at',
  'lastLogin': 'last_login',
  'offdayId': 'offday_id',
  'lessonId': 'lesson_id'
};

const DB_TO_UI_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(UI_TO_DB_MAP).map(([k, v]) => [v, k])
);

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'sensei' | 'students' | 'offday' | 'checker' | 'teaching' | 'reporting'>('dashboard');
  const [masterSubTab, setMasterSubTab] = useState<'sensei' | 'student' | 'offday'>('sensei');
  
  // Sync Configuration
  const [syncConfig, setSyncConfig] = useState(() => {
    const saved = localStorage.getItem('syncConfig');
    return saved ? JSON.parse(saved) : {
      type: 'supabase',
      supabase: { url: SUPABASE_URL, key: SUPABASE_ANON_KEY }
    };
  });
  
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('gasUrl') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => localStorage.getItem('lastSync') || 'Never');
  const [showSettings, setShowSettings] = useState(false);

  const [senseiList, setSenseiList] = useState<Sensei[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lessonTrackers, setLessonTrackers] = useState<LessonTracker[]>([]);

  // Dashboard Filters
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [studentStatusFilter, setStudentStatusFilter] = useState<'Active' | 'Inactive'>('Active');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    end: format(endOfYear(addYears(new Date(), 1)), 'yyyy-MM-dd')
  });

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState<{ type: 'sensei' | 'student', data: any } | null>(null);
  const [selectedTrackerSchedule, setSelectedTrackerSchedule] = useState<Schedule | null>(null);
  const [selectedTrackerStudent, setSelectedTrackerStudent] = useState<Student | null>(null);
  const [showResourceHub, setShowResourceHub] = useState(false);
  const [selectedResourceStudent, setSelectedResourceStudent] = useState<Student | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ senseiId: string, date: Date } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');

  // Today's Day Name
  const indonesianDayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  // --- THEME ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  // --- DYNAMIC ANALYTICS ---
  const analytics = useMemo(() => {
    const activeSchedules = schedules.filter(s => s.status === 'active');
    const privateClasses = activeSchedules.filter(s => s.type === 'Private').length;
    const n5Classes = activeSchedules.filter(s => s.level.includes('N5')).length;
    
    const unpaidStudents = studentList.filter(s => s.payment_status === 'Unpaid').length;
    
    const now = new Date();
    const completedThisMonth = lessonTrackers.filter(lt => {
      try {
        const d = parseISO(lt.date);
        return isSameMonth(d, now) && lt.material;
      } catch (e) { return false; }
    }).length;

    // Weekly Activity Chart Data
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    const weeklyActivityData = last7Days.map(day => {
      const count = lessonTrackers.filter(lt => {
        try {
          return isSameDay(parseISO(lt.date), day);
        } catch (e) { return false; }
      }).length;
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'dd MMM'),
        count
      };
    });
    
    const typeBreakdown: Record<string, number> = {};
    activeSchedules.forEach(s => {
      typeBreakdown[s.type] = (typeBreakdown[s.type] || 0) + 1;
    });

    const consolidatedLevelBreakdown: Record<string, number> = {};
    studentList.forEach(s => {
      const levels = s.level.split(',').map(l => l.trim());
      levels.forEach(l => {
        if (!l) return;
        let category = l;
        // Grouping logic for cleaner chart
        if (l.toLowerCase().includes('guntai')) category = 'Guntai';
        else if (l.toLowerCase().includes('intensif')) category = 'Intensif';
        else if (l.toLowerCase().includes('kids')) category = 'Kids';
        else if (l.toLowerCase().includes('kaiwa')) category = 'Kaiwa';
        else if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(l)) category = 'JLPT ' + l;
        
        consolidatedLevelBreakdown[category] = (consolidatedLevelBreakdown[category] || 0) + 1;
      });
    });

    const pieData = Object.entries(consolidatedLevelBreakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Sensei Workload (Beban Kerja)
    const senseiWorkload: Record<string, number> = {};
    activeSchedules.forEach(s => {
      const senseiName = senseiList.find(x => x.id === s.senseiId)?.name || 'Unknown';
      senseiWorkload[senseiName] = (senseiWorkload[senseiName] || 0) + 1;
    });

    const workloadData = Object.entries(senseiWorkload)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 busiest sensei

    // Payment Summary for Chart
    const paymentData = [
      { name: 'Sudah Bayar', value: studentList.filter(s => s.payment_status === 'Paid').length },
      { name: 'Belum Bayar', value: studentList.filter(s => s.payment_status === 'Unpaid').length }
    ];

    // Upcoming Sessions
    const todayStr = format(now, 'yyyy-MM-dd');
    const upcomingSessions = schedules
      .filter(s => s.date === todayStr && s.status === 'active')
      .map(s => {
        let sessionTime = now;
        try {
          const [hour, minute] = s.startTime.split(':');
          sessionTime = new Date(now);
          sessionTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
        } catch (e) {
          // ignore
        }
        
        const senseiName = senseiList.find(x => x.id === s.senseiId)?.name || 'Unknown';
        const sIds = s.studentIds && s.studentIds.length > 0 ? s.studentIds : (s.studentId ? [s.studentId] : []);
        const studentName = sIds.map(id => studentList.find(x => x.id === id)?.name || 'Unknown').join(', ');

        return { ...s, sessionTime, senseiName, studentName, time: s.startTime };
      })
      .filter(s => isAfter(s.sessionTime, now))
      .sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime())
      .slice(0, 6);

    // Recent Activity
    const recentTrackers = [...lessonTrackers]
      .filter(lt => lt.material) // Only count completed
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 4)
      .map(lt => {
        const senseiName = senseiList.find(x => x.id === lt.senseiId)?.name || 'Unknown';
        return { ...lt, senseiName };
      });

    const recentStudents = [...studentList]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 2);

    const newStudents30Days = studentList.filter(s => {
      try {
        const joinDate = parseISO(s.id.split('-')[0] || ''); // Assuming ID starts with date or fallback
        return differenceInDays(now, joinDate) <= 30;
      } catch (e) { return false; }
    }).length;

    return {
      total: activeSchedules.length,
      privateClasses,
      n5Classes,
      unpaidStudents,
      completedThisMonth,
      totalStudents: studentList.length,
      newStudents30Days: newStudents30Days || 0,
      typeBreakdown,
      levelBreakdown: consolidatedLevelBreakdown,
      weeklyActivityData,
      pieData,
      workloadData,
      paymentData,
      upcomingSessions,
      recentTrackers,
      recentStudents
    };
  }, [schedules, studentList, lessonTrackers]);

  // --- SUPABASE CLIENT ---
  const supabase = useMemo(() => createClient(syncConfig.supabase.url, syncConfig.supabase.key), [syncConfig.supabase.url, syncConfig.supabase.key]);

  // --- AUTHENTICATION ---
  useEffect(() => {
    console.log('Auth check started');
    // Check current session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Auth Session Error:', error);
        // Sometimes the refresh token is just missing/stale on reload, force clear it
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh token')) {
          supabase.auth.signOut().catch(() => {});
        }
      }
      const session = data?.session;
      const u = session?.user ?? null;
      console.log('Session fetched:', u ? u.email : 'No user');
      setUser(u);
      setAuthLoading(false);
    }).catch(err => {
      console.error('Session fetch failed:', err);
      // fallback catch for unhandled refresh token rejects
      if (err?.message?.includes('Refresh Token') || err?.message?.includes('refresh token')) {
        supabase.auth.signOut().catch(() => {});
      }
      setAuthLoading(false);
    });

    // Fallback if getSession is taking too long
    const timeout = setTimeout(() => {
      setAuthLoading(prev => {
        if (prev) {
          console.log('Auth loading timeout reached');
          return false;
        }
        return prev;
      });
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth Event:', _event);
      const newUser = session?.user ?? null;
      setUser((prev: any) => {
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  // --- DATABASE INITIALIZATION & REAL-TIME LISTENERS ---
  useEffect(() => {
    if (!user) return;
    
    localStorage.setItem('syncConfig', JSON.stringify(syncConfig));
    
    let unsubscribeSensei: () => void = () => {};
    let unsubscribeStudents: () => void = () => {};
    let unsubscribeOffDays: () => void = () => {};
    let unsubscribeSchedules: () => void = () => {};
    let unsubscribeLessonTrackers: () => void = () => {};
    let supabaseChannel: any = null;
    let isMounted = true;

    const initDB = async () => {
      if (!user || !isMounted) return;
      
      if (syncConfig.type === 'supabase' && syncConfig.supabase.url && syncConfig.supabase.key) {
        try {
          // Test connection
          const { error: connError } = await supabase.from('sensei').select('id').limit(1);
          if (connError) throw connError;
          
          if (!isMounted) return;
          setDbStatus('connected');

          // Initial Fetch
          const fetchAll = async () => {
            try {
              const [sRes, stRes, odRes, scRes, ltRes] = await Promise.all([
                supabase.from('sensei').select('*'),
                supabase.from('students').select('*'),
                supabase.from('offdays').select('*'),
                supabase.from('schedules').select('*'),
                supabase.from('lesson_trackers').select('*')
              ]);

              if (!isMounted) return;

      const mapFromDb = (data: any[]) => data.map(d => {
                const obj: any = {};
                Object.keys(d).forEach(k => {
                  const uiKey = DB_TO_UI_MAP[k] || k;
                  obj[uiKey] = d[k];
                });
                return obj;
              });

              if (sRes.data) setSenseiList(mapFromDb(sRes.data));
              if (stRes.data) setStudentList(mapFromDb(stRes.data));
              if (odRes.data) setOffDays(mapFromDb(odRes.data));
              if (scRes.data) setSchedules(mapFromDb(scRes.data));
              if (ltRes.data) setLessonTrackers(mapFromDb(ltRes.data));
            } catch (err: any) {
              console.error(`Supabase Fetch Error: ${err.message}`);
            }
          };
          fetchAll();

          // Real-time Subscriptions
          supabaseChannel = supabase.channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
              if (isMounted) fetchAll();
            })
            .subscribe();

        } catch (error: any) {
          console.error('Supabase Init Error:', error);
          if (isMounted) {
            setDbStatus('error');
            if (error.message === 'Failed to fetch') {
              toast.error('Gagal terhubung ke database. Silakan cek koneksi internet Anda atau status project Supabase.');
            } else {
              toast.error(`Error Database: ${error.message}`);
            }
          }
        }
      } else {
        // Fallback to localStorage if no cloud DB
        if (isMounted) {
          setDbStatus('disconnected');
          setSenseiList(JSON.parse(localStorage.getItem('senseiList') || '[]'));
          setStudentList(JSON.parse(localStorage.getItem('studentList') || '[]'));
          setOffDays(JSON.parse(localStorage.getItem('offDays') || '[]'));
          setSchedules(JSON.parse(localStorage.getItem('schedules') || '[]'));
        }
      }
    };

    initDB();

    return () => {
      isMounted = false;
      unsubscribeSensei();
      unsubscribeStudents();
      unsubscribeOffDays();
      unsubscribeSchedules();
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, [syncConfig, user?.id, supabase]);

  // Persist to localStorage as backup
  useEffect(() => { localStorage.setItem('senseiList', JSON.stringify(senseiList)); }, [senseiList]);
  useEffect(() => { localStorage.setItem('studentList', JSON.stringify(studentList)); }, [studentList]);
  useEffect(() => { localStorage.setItem('offDays', JSON.stringify(offDays)); }, [offDays]);
  useEffect(() => { localStorage.setItem('schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('lessonTrackers', JSON.stringify(lessonTrackers)); }, [lessonTrackers]);
  useEffect(() => { localStorage.setItem('lastSync', lastSync); }, [lastSync]);
  useEffect(() => { localStorage.setItem('gasUrl', gasUrl); }, [gasUrl]);

  const handleFullSync = async () => {
    if (!gasUrl) {
      setShowSettings(true);
      return;
    }
    setIsSyncing(true);
    try {
      await pushToGAS(gasUrl, 'Sensei', senseiList);
      await pushToGAS(gasUrl, 'Students', studentList);
      await pushToGAS(gasUrl, 'OffDays', offDays);
      await pushToGAS(gasUrl, 'Schedules', schedules);
      await pushToGAS(gasUrl, 'LessonTrackers', lessonTrackers);
      const now = format(new Date(), 'HH:mm:ss');
      setLastSync(now);
      toast.success('Sinkronisasi ke Google Sheets berhasil!');
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(`Gagal sinkronisasi: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!gasUrl) return;
    setIsSyncing(true);
    try {
      const data = await fetchFromGAS(gasUrl);
      if (data) {
        if (data.Sensei) setSenseiList(data.Sensei);
        if (data.Students) setStudentList(data.Students);
        if (data.OffDays) setOffDays(data.OffDays);
        if (data.Schedules) setSchedules(data.Schedules);
        if (data.LessonTrackers) setLessonTrackers(data.LessonTrackers);
        setLastSync(format(new Date(), 'HH:mm:ss'));
        toast.success('Data berhasil ditarik dari Google Sheets!');
      }
    } catch (error: any) {
      console.error('Pull failed:', error);
      toast.error(`Gagal menarik data: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- CRUD HELPERS ---
  const sanitizeData = (collectionName: string, data: any) => {
    const allowedFields: any = {
      'sensei': ['id', 'name', 'note', 'no_wa', 'email', 'level_mengajar', 'kelas_tersedia'],
      'students': ['id', 'name', 'phone', 'level', 'type', 'sensei_name', 'level_awal', 'level_sekarang', 'durasi_kelas', 'payment_status', 'is_active', 'classroom_link', 'chat_link', 'progress_link', 'curriculum_link'],
      'offdays': ['id', 'senseiId', 'date', 'reason'],
      'lesson_trackers': ['id', 'scheduleId', 'studentId', 'senseiId', 'date', 'attendance', 'material', 'score', 'notes', 'caseNotes', 'studentFeedback', 'actualStartTime', 'isDelayed', 'createdAt'],
      'schedules': ['id', 'senseiId', 'studentId', 'studentIds', 'type', 'level', 'date', 'startTime', 'endTime', 'status', 'updatedAt', 'updatedBy'],
      'profiles': ['id', 'email', 'role', 'status', 'lastLogin']
    };
    const fields = allowedFields[collectionName];
    if (!fields) return data;
    
    const sanitized: any = {};
    fields.forEach((f: string) => {
      let value = data[f];
      
      // Khusus untuk studentIds, pastikan dia array jika masuk ke DB
      if (f === 'studentIds' && value && !Array.isArray(value)) {
        value = [value];
      }

      if (value !== undefined) {
        // Map state keys to db keys explicitly for Supabase
        if (syncConfig.type === 'supabase') {
          const dbKey = UI_TO_DB_MAP[f] || f;
          sanitized[dbKey] = value;
        } else {
          sanitized[f] = value;
        }
      }
    });
    return sanitized;
  };

  const dbOps = {
    save: async (collectionName: string, data: any) => {
      const sanitized = sanitizeData(collectionName, data);
      let finalDataForDb = sanitized;
      let finalDataForState = data;
      
      if (syncConfig.type === 'supabase') {
        try {
          const id = sanitized.id || `${Date.now()}-${crypto.randomUUID()}`;
          finalDataForDb = { ...sanitized, id };
          
          // Original data mapping for state
          const { error } = await supabase.from(collectionName).upsert(finalDataForDb);
          if (error) throw error;
          
          finalDataForState = { ...data, id };
        } catch (err: any) {
          toast.error(`Supabase Save Error (${collectionName}): ${err.message}`);
          throw err;
        }
      } else {
        const id = data.id || `${Date.now()}-${crypto.randomUUID()}`;
        finalDataForState = { ...data, id };
      }

      const setterMap: any = {
        'sensei': setSenseiList,
        'students': setStudentList,
        'offdays': setOffDays,
        'schedules': setSchedules,
        'lesson_trackers': setLessonTrackers
      };
      const setter = setterMap[collectionName];
      if (setter) {
        setter((prev: any[]) => {
          if (finalDataForState.id && prev.some(item => item.id === finalDataForState.id)) {
            return prev.map(item => item.id === finalDataForState.id ? finalDataForState : item);
          }
          return [...prev, finalDataForState];
        });
      }
      return finalDataForState;
    },
    bulkSave: async (collectionName: string, dataArray: any[]) => {
      if (dataArray.length === 0) return;
      
      const sanitizedArray = dataArray.map(d => sanitizeData(collectionName, d));
      let finalDataArrayForState = dataArray;
      
      if (syncConfig.type === 'supabase') {
        try {
          const finalDataArrayForDb = sanitizedArray.map((d, idx) => d.id ? d : { ...d, id: `${Date.now()}-${idx}-${crypto.randomUUID()}` });
          const { error } = await supabase.from(collectionName).upsert(finalDataArrayForDb);
          if (error) throw error;
          
          finalDataArrayForState = dataArray.map((d, idx) => {
            const dbItem = finalDataArrayForDb[idx];
            return { ...d, id: dbItem.id };
          });
        } catch (err: any) {
          toast.error(`Supabase Bulk Save Error (${collectionName}): ${err.message}`);
          throw err;
        }
      } else {
        finalDataArrayForState = dataArray.map((d, idx) => d.id ? d : { ...d, id: `${Date.now()}-${idx}-${crypto.randomUUID()}` });
      }

      const setterMap: any = {
        'sensei': setSenseiList,
        'students': setStudentList,
        'offdays': setOffDays,
        'schedules': setSchedules,
        'lesson_trackers': setLessonTrackers
      };
      const setter = setterMap[collectionName];
      if (setter) {
        setter((prev: any[]) => {
          const newItems = finalDataArrayForState.filter(d => !prev.some(p => p.id === d.id));
          const updatedItems = prev.map(p => {
            const updated = finalDataArrayForState.find(d => d.id === p.id);
            return updated ? updated : p;
          });
          return [...updatedItems, ...newItems];
        });
      }
      return finalDataArrayForState;
    },
    delete: async (collectionName: string, id: string) => {
      if (syncConfig.type === 'supabase') {
        try {
          /* using global supabase */
          const { error } = await supabase.from(collectionName).delete().eq('id', id);
          if (error) throw error;
        } catch (err: any) {
          toast.error(`Supabase Delete Error: ${err.message}`);
          throw err;
        }
      }
      
      const setterMap: any = {
        'sensei': setSenseiList,
        'students': setStudentList,
        'offdays': setOffDays,
        'schedules': setSchedules,
        'lesson_trackers': setLessonTrackers
      };
      const setter = setterMap[collectionName];
      if (setter) {
        setter((prev: any[]) => prev.filter((item: any) => item.id !== id));
      }
    }
  };

  // --- COMPONENTS ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin text-indigo-600 dark:text-indigo-400">
          <Repeat size={40} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage supabase={supabase} theme={theme} onAuthSuccess={(u) => setUser(u)} />;
  }
  const isSuperAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '');
    const appProps = {
activeTab,
setActiveTab,
masterSubTab,
setMasterSubTab,
syncConfig,
setSyncConfig,
dbStatus,
setDbStatus,
gasUrl,
setGasUrl,
isSyncing,
setIsSyncing,
lastSync,
setLastSync,
showSettings,
setShowSettings,
senseiList,
setSenseiList,
studentList,
setStudentList,
offDays,
setOffDays,
schedules,
setSchedules,
lessonTrackers,
setLessonTrackers,
viewMode,
setViewMode,
currentDate,
setCurrentDate,
studentStatusFilter,
setStudentStatusFilter,
globalSearchTerm,
setGlobalSearchTerm,
dateRange,
setDateRange,
showScheduleModal,
setShowScheduleModal,
showTrackerModal,
setShowTrackerModal,
showRekapModal,
setShowRekapModal,
showProfileModal,
setShowProfileModal,
selectedProfileData,
setSelectedProfileData,
selectedTrackerSchedule,
setSelectedTrackerSchedule,
selectedTrackerStudent,
setSelectedTrackerStudent,
showResourceHub,
setShowResourceHub,
selectedResourceStudent,
setSelectedResourceStudent,
editingSchedule,
setEditingSchedule,
selectedCell,
setSelectedCell,
isSidebarOpen,
setIsSidebarOpen,
user,
setUser,
authLoading,
setAuthLoading,
theme,
setTheme,
indonesianDayName,
analytics,
supabase,
handleFullSync,
handlePullData,
sanitizeData,
dbOps,
isSuperAdmin,
ADMIN_EMAILS
};


  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
      <Toaster position="top-right" richColors closeButton />
      <Sidebar {...appProps} />
      
      <main className="lg:ml-64 p-4 md:p-8 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {activeTab === 'dashboard' ? 'Dashboard Jadwal' : 
                 activeTab === 'calendar' ? 'Kalender Jadwal' :
                 activeTab === 'teaching' ? 'Sesi Mengajar' :
                 activeTab === 'sensei' ? 'Data Sensei' : 
                 activeTab === 'students' ? 'Data Students' : 
                 activeTab === 'offday' ? 'Off Days' : 
                 activeTab === 'reporting' ? 'Reporting Dashboard' : 
                 activeTab === 'checker' ? 'Smart Checker' : 'User Management'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">Hello, <span className="text-indigo-600 font-bold">{user.email?.split('@')[0]}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {activeTab === 'dashboard' && (
              <div className="relative group hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <input 
                  type="text" 
                  placeholder="Cari siswa..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-40 md:w-48 shadow-sm"
                />
              </div>
            )}
            
            {(activeTab === 'dashboard' || activeTab === 'calendar') && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRekapModal(true)}
                  className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Rekap</span>
                </button>
                <button 
                  onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 uppercase tracking-wider"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Tambah Baru</span>
                </button>
              </div>
            )}
            
            <div className="bg-white dark:bg-slate-900 px-3 md:px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xs md:text-sm shadow-md">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-right">
                <p className="font-black text-slate-700 dark:text-slate-200 text-[9px] uppercase tracking-widest leading-none mb-1">
                  {isSuperAdmin ? 'Super Admin' : 'Staff'}
                </p>
                <span className="font-bold text-slate-400 text-[10px]">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Dashboard tab.">
              <AnalyticsCards {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Calendar tab.">
              <CalendarView {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}

        {activeTab === 'teaching' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Teaching Sessions tab.">
              <TeachingSessionsView {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}

        {(activeTab === 'sensei' || activeTab === 'students' || activeTab === 'offday') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Master Data tab.">
              <MasterData {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}

        {activeTab === 'checker' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Smart Checker tab.">
              <SmartChecker {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}

        {activeTab === 'reporting' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorBoundary fallbackMessage="Error loading Reporting tab.">
              <ReportingDashboard {...appProps} />
            </ErrorBoundary>
          </motion.div>
        )}
      </main>

      {/* Global Modals */}
      <AnimatePresence>
        {showScheduleModal && <ScheduleModal {...appProps} />}
      </AnimatePresence>

      <AnimatePresence>
        {showTrackerModal && (selectedTrackerSchedule || selectedTrackerStudent) && <LessonTrackerModal {...appProps} />}
      </AnimatePresence>

      <AnimatePresence>
        {showRekapModal && <RekapAbsensiModal {...appProps} />}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && <ProfileViewModal {...appProps} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {showResourceHub && selectedResourceStudent && <ResourceHubModal {...appProps} />}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Database size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Sync Settings</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                  dbStatus === 'connected' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 
                  dbStatus === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' :
                  'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                }`}>
                  <div className={`${
                    dbStatus === 'connected' ? 'bg-emerald-500' : 
                    dbStatus === 'error' ? 'bg-rose-500' :
                    'bg-slate-400'
                  } p-2 rounded-xl text-white`}>
                    {dbStatus === 'connected' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h4 className={`font-bold ${
                      dbStatus === 'connected' ? 'text-emerald-800 dark:text-emerald-400' : 
                      dbStatus === 'error' ? 'text-rose-800 dark:text-rose-400' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                      {dbStatus === 'connected' ? 'Supabase Connected' : 
                       dbStatus === 'error' ? 'Database Connection Error' :
                       'Local Mode (Offline)'}
                    </h4>
                    <p className={`text-xs ${
                      dbStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-500' : 
                      dbStatus === 'error' ? 'text-rose-600 dark:text-rose-500' :
                      'text-slate-500 dark:text-slate-400'
                    }`}>
                      {dbStatus === 'connected' ? 'Aplikasi terhubung otomatis ke database tim.' : 
                       dbStatus === 'error' ? 'Terjadi kesalahan saat menghubungkan ke cloud. Cek koneksi Anda.' :
                       'Menggunakan penyimpanan lokal browser Anda.'}
                    </p>
                  </div>
                </div>

                {dbStatus === 'error' && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('syncConfig');
                      window.location.reload();
                    }}
                    className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Reset & Gunakan Local Mode
                  </button>
                )}

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                    <strong>Note:</strong> Sinkronisasi data dilakukan secara real-time. Perubahan yang dibuat oleh anggota tim lain akan langsung muncul di dashboard Anda.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Google Sheets Sync (Optional)</label>
                  <input 
                    type="text" 
                    value={gasUrl}
                    onChange={e => setGasUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm dark:text-white"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={handlePullData}
                      disabled={isSyncing || !gasUrl}
                      className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      Pull from Sheets
                    </button>
                    <button 
                      onClick={handleFullSync}
                      disabled={isSyncing || !gasUrl}
                      className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      Push to Sheets
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
