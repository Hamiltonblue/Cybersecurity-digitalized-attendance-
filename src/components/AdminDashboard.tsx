import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Monitor,
  Download,
  Users,
  ShieldAlert,
  Search,
  CheckCircle,
  Clock,
  Unlock,
  Building,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Filter,
  Lock,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import {
  AttendanceSession,
  AttendanceRecord,
  FlaggedProxyAttempt,
  Student,
  Course,
} from '../types/attendance.ts';
import { CourseLedgerView } from './CourseLedgerView.tsx';

interface AdminDashboardProps {
  onOpenProjector: () => void;
  onOpenRoster: () => void;
  onRefreshSessionState?: () => void;
  onLockAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenProjector,
  onOpenRoster,
  onRefreshSessionState,
  onLockAdmin,
}) => {
  // Session Configuration Form State: Clean slate for Redeemer's University Cybersecurity
  const [selectedCourseId, setSelectedCourseId] = useState('NEW');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [hallLocation, setHallLocation] = useState('Science Complex CYB Lab 1');
  const [lecturerName, setLecturerName] = useState('');
  const [courseLevel, setCourseLevel] = useState('400L');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [passcodeIntervalSeconds, setPasscodeIntervalSeconds] = useState(60); // 1 minute default

  // Active Session & Live Data
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [flaggedAttempts, setFlaggedAttempts] = useState<FlaggedProxyAttempt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'ledger' | 'security' | 'config'>('attendance');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Unlock Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideDeviceId, setOverrideDeviceId] = useState('');
  const [overrideReason, setOverrideReason] = useState('Student verified physically in hall');

  // Load and poll data
  const refreshData = async () => {
    try {
      const proj = await AttendanceApiService.getProjectorData();
      if (proj.session) {
        setActiveSession(proj.session);
      } else {
        setActiveSession(null);
      }
      setRecords(proj.records);
      const allStudents = await AttendanceApiService.getStudents();
      setStudents(allStudents);

      const courseRes = await AttendanceApiService.getCourses();
      if (courseRes.courses) setCourses(courseRes.courses);

      // Fetch flagged attempts
      const recordsRes = await fetch('/api/records');
      if (recordsRes.ok) {
        const json = await recordsRes.json();
        if (json.flagged) setFlaggedAttempts(json.flagged);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  // When course dropdown changes in config form
  const handleCourseSelectionChange = (cId: string) => {
    setSelectedCourseId(cId);
    if (cId === 'NEW') {
      setCourseCode('');
      setCourseTitle('');
      setLecturerName('');
      setHallLocation('ETF Lecture Theatre 1');
      return;
    }

    const found = courses.find(c => c.id === cId);
    if (found) {
      setCourseCode(found.code);
      setCourseTitle(found.title);
      setLecturerName(found.lecturerName);
      setHallLocation(found.hallLocation);
    }
  };

  // Launch lecture for a course from the ledger view
  const handleStartLectureForCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    setCourseCode(course.code);
    setCourseTitle(course.title);
    setLecturerName(course.lecturerName);
    setHallLocation(course.hallLocation);
    setActiveTab('config');
  };

  // Start Session Handler
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActionSuccess(null);

    try {
      const session = await AttendanceApiService.startSession({
        courseId: selectedCourseId !== 'NEW' ? selectedCourseId : undefined,
        courseCode,
        courseTitle,
        hallLocation,
        lecturerName,
        durationMinutes,
        passcodeIntervalSeconds,
      });
      setActiveSession(session);
      setActionSuccess(`Attendance session launched for ${courseCode} (Lecture #${session.lectureNumber || 1})!`);
      setActiveTab('attendance');
      if (onRefreshSessionState) onRefreshSessionState();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Session Handler
  const handleStopSession = async () => {
    if (!confirm('Are you sure you want to end this attendance session early? Records will be permanently archived.')) return;
    setIsLoading(true);
    try {
      await AttendanceApiService.stopSession();
      setActiveSession(null);
      setActionSuccess('Session concluded. Records permanently archived into Course Ledger.');
      if (onRefreshSessionState) onRefreshSessionState();
      refreshData();
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Device Override
  const handleGrantOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !overrideDeviceId.trim()) return;

    try {
      await AttendanceApiService.overrideDevice(
        activeSession.id,
        overrideDeviceId.trim(),
        overrideReason
      );
      setActionSuccess(`Exemption granted for device ID ${overrideDeviceId.substring(0, 8)}...`);
      setOverrideModalOpen(false);
      setOverrideDeviceId('');
      refreshData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Error
    }
  };

  // Wipe All Data Completely (Clean Slate)
  const handleClearAllSystemData = async () => {
    if (!confirm('Are you sure you want to completely wipe all courses, student rosters, session records, and logs? This will reset the platform to a 100% clean slate.')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await AttendanceApiService.clearAllData();
      setActionSuccess(res.message || 'System wiped clean. 0 courses and 0 students.');
      setActiveSession(null);
      setRecords([]);
      setFlaggedAttempts([]);
      setStudents([]);
      setCourses([]);
      setSelectedCourseId('NEW');
      setCourseCode('');
      setCourseTitle('');
      setLecturerName('');
      if (onRefreshSessionState) onRefreshSessionState();
      refreshData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  // Load Redeemer's University Cybersecurity Sample Cohort
  const handleSeedRunCybData = async () => {
    setIsLoading(true);
    try {
      const res = await AttendanceApiService.seedRunCybData();
      if (res.success) {
        setActionSuccess(res.message || "Loaded Redeemer's University Cybersecurity courses and student roster.");
        refreshData();
        if (onRefreshSessionState) onRefreshSessionState();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  // Export CSV Direct Download
  const handleDownloadCsv = () => {
    if (typeof window === 'undefined') return;
    const session = activeSession;
    const sessionInfo = session
      ? `Institutional Attendance Report\nCourse Code: ${session.courseCode}\nCourse Title: ${session.courseTitle}\nLecture Number: ${session.lectureNumber || 1}\nVenue: ${session.hallLocation}\nLecturer: ${session.lecturerName}\nSession Date: ${new Date(session.startTime).toLocaleDateString()}\nTotal Verified: ${records.length} of ${students.length} (${((records.length / (students.length || 1)) * 100).toFixed(1)}%)\n\n`
      : 'Attendance Report\n\n';

    const headers = 'S/N,JAMB Registration No,Matric No,Student Full Name,Department,Check-In Time,Status,Device ID\n';
    const rows = records
      .map((r, i) => {
        return `${i + 1},"${r.jambRegNo}","${r.matricNo}","${r.studentName}","${r.department}","${new Date(r.timestamp).toLocaleTimeString()}","${r.status}","${r.deviceId.substring(0, 10)}"`;
      })
      .join('\n');

    const csvBlob = new Blob([sessionInfo + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_${activeSession?.courseCode || 'Course'}_Lec${activeSession?.lectureNumber || 1}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.jambRegNo.toLowerCase().includes(q) ||
      r.matricNo.toLowerCase().includes(q)
    );
  });

  const isSessionRunning = activeSession && activeSession.status === 'active' && activeSession.expiresAt > Date.now();
  const sessionSecondsLeft = activeSession ? Math.max(0, Math.ceil((activeSession.expiresAt - Date.now()) / 1000)) : 0;
  const minsLeft = Math.floor(sessionSecondsLeft / 60);
  const secsLeft = sessionSecondsLeft % 60;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                Redeemer's University · Department of Cybersecurity
              </span>
              <span className="text-xs text-slate-400">· Multi-Session Continuity</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Attendance Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live classroom session controller, cumulative multi-session ledgers, and anti-proxy device authorization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isSessionRunning ? (
              <button
                onClick={onOpenProjector}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Open Projector Screen</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('config')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Configure & Start Session</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ledger')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium border border-emerald-500/30 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Course Ledgers</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={records.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              title="Download attendance list for active lecture"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Session CSV</span>
            </button>

            <button
              onClick={onOpenRoster}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Master Roster ({students.length})</span>
            </button>

            <button
              onClick={handleSeedRunCybData}
              disabled={isLoading}
              className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preload realistic Redeemer's University Cybersecurity sample courses and cohort"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Starter Cohort</span>
            </button>

            <button
              onClick={handleClearAllSystemData}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium border border-slate-800 hover:border-rose-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Completely wipe all courses, rosters, and sessions for fresh entry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wipe All Data</span>
            </button>

            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Lock Course Rep session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Live Active Session HUD Card */}
        {isSessionRunning ? (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Course & Lecture Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Live Attendance Active
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lecture #{activeSession.lectureNumber || 1}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeSession.courseCode}
              </h2>
              <p className="text-xs text-slate-300 truncate font-medium">
                {activeSession.courseTitle}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Building className="w-3 h-3 text-emerald-400" />
                <span>{activeSession.hallLocation}</span>
                <span>·</span>
                <span>{activeSession.lecturerName}</span>
              </div>
            </div>

            {/* 5-Min Timer Metric */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Session Countdown</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {minsLeft.toString().padStart(2, '0')}:{secsLeft.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-400">/ 05:00</span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (sessionSecondsLeft / 300) * 100))}%` }}
                />
              </div>
            </div>

            {/* Attendance Count Metric */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Students</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {records.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {students.length} ({((records.length / (students.length || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                {students.length - records.length} students yet to check in
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenProjector}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Projector Mode</span>
              </button>
              <button
                onClick={handleStopSession}
                className="w-full py-2 bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-400 rounded-xl text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
              >
                End Session & Archive
              </button>
            </div>
          </div>
        ) : (
          /* Session Inactive Banner */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  No Active Attendance Session
                </h3>
                <p className="text-xs text-slate-400">
                  Ready to launch a new attendance window. Attendance will automatically accumulate into course archives.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ledger')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                View Cumulative Ledgers
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Configure & Start Session
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Roster ({records.length})
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Cumulative Ledgers & Matrices</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Anti-Proxy ({flaggedAttempts.length})
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Launch Class Session
          </button>
        </div>

        {/* TAB 1: VERIFIED ATTENDANCE LIST (Current Lecture) */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase tracking-wider">
                  Live Attendance Register
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  Showing {filteredRecords.length} of {records.length} checked-in students for this lecture
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, JAMB or matric..."
                  className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-mono">
                    <th className="py-2.5 px-3">S/N</th>
                    <th className="py-2.5 px-3">Student Full Name</th>
                    <th className="py-2.5 px-3">JAMB Reg No</th>
                    <th className="py-2.5 px-3">Matric No</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Check-In Time</th>
                    <th className="py-2.5 px-3">Device Fingerprint</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                          {r.studentName}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                          {r.jambRegNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {r.matricNo}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {r.department}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap" title={r.deviceId}>
                          {r.deviceId.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                        {records.length === 0
                          ? 'No attendance records logged for this session yet. Students will appear here in real time.'
                          : 'No students matched your search criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CUMULATIVE MULTI-SESSION COURSE LEDGER */}
        {activeTab === 'ledger' && (
          <CourseLedgerView
            onStartLectureForCourse={handleStartLectureForCourse}
            activeSession={activeSession}
          />
        )}

        {/* TAB 3: SECURITY & ANTI-PROXY AUDIT */}
        {activeTab === 'security' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div>
                <span className="font-bold text-white uppercase tracking-wider block">
                  Anti-Proxy & Tamper Security Log
                </span>
                <span className="text-slate-400">
                  Enforces 1-device-per-student limit and blocks malicious browser requests.
                </span>
              </div>
              <button
                onClick={() => setOverrideModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Grant Device Exemption</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-mono">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Flagged Target</th>
                    <th className="py-2.5 px-3">Device Signature</th>
                    <th className="py-2.5 px-3">Blocked Violation Type</th>
                    <th className="py-2.5 px-3 text-right">Defense Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {flaggedAttempts.length > 0 ? (
                    flaggedAttempts.slice().reverse().map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          <div>{f.studentName || f.jambRegNo}</div>
                          <div className="text-[11px] font-mono text-slate-500">{f.jambRegNo}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {f.deviceId.substring(0, 10)}...
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            {f.reason.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                            BLOCKED BY SHIELD
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No security violations flagged. Zero proxy submissions detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SESSION CONFIGURATION & LAUNCH */}
        {activeTab === 'config' && (
          <form
            onSubmit={handleStartSession}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Course Continuation & Auto-Increment
                </span>
                <span className="text-xs text-slate-400">· Links to historical lecture records</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Launch Attendance Session
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select an existing registered course to automatically continue from the previous lecture, or register a new course code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Existing Course to Continue */}
              <div className="sm:col-span-2 space-y-1.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Select Course to Continue</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Auto-accumulates with previous sessions
                  </span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelectionChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title} (Currently has {c.totalLectures} lectures held)
                    </option>
                  ))}
                  <option value="NEW">+ Register New Course Code</option>
                </select>
                <p className="text-[11px] text-slate-400 pt-1">
                  {selectedCourseId !== 'NEW' ? (
                    <span className="text-emerald-400 font-medium">
                      ✓ Continuation Mode: The system will automatically link this session and record it as the next continuous lecture for this course.
                    </span>
                  ) : (
                    <span>Enter new course details below to begin Lecture #1 for this course.</span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Course Code
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CYB 401"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Academic Level
                </label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                >
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level (Final Year)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Session Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                >
                  <option value={5}>5 Minutes (Standard Policy)</option>
                  <option value={3}>3 Minutes (Rapid Check)</option>
                  <option value={10}>10 Minutes (Extended Lecture)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Digital Forensics & Incident Response"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Lecture Hall / Venue
                </label>
                <input
                  type="text"
                  value={hallLocation}
                  onChange={(e) => setHallLocation(e.target.value)}
                  placeholder="e.g. Science Complex CYB Lab 1"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Lecturer / Invigilator
                </label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  placeholder="e.g. Dr. / Prof. ..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
              >
                <Play className="w-4 h-4" />
                <span>Launch Attendance Session Now</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Override Device Exception Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleGrantOverride}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-amber-400" />
                Course Rep Device Override
              </span>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If a student's phone battery died or they cannot access their personal device, you can authorize a one-time check-in from another device after physical in-person verification.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Device UUID Fingerprint
              </label>
              <input
                type="text"
                value={overrideDeviceId}
                onChange={(e) => setOverrideDeviceId(e.target.value)}
                placeholder="Enter or paste device ID"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Verification Rationale
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Student verified physically in hall"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Authorize Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
