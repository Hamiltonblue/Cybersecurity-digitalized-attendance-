import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { Course, CourseLedger, AttendanceSession } from '../types/attendance.ts';

interface CourseLedgerViewProps {
  onStartLectureForCourse?: (course: Course) => void;
  activeSession?: AttendanceSession | null;
}

export const CourseLedgerView: React.FC<CourseLedgerViewProps> = ({
  onStartLectureForCourse,
  activeSession,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course-csc401');
  const [ledger, setLedger] = useState<CourseLedger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'at_risk' | 'ineligible'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Load courses
  const fetchCourses = async () => {
    try {
      const res = await AttendanceApiService.getCourses();
      if (res.courses && res.courses.length > 0) {
        setCourses(res.courses);
        if (!selectedCourseId) {
          setSelectedCourseId(res.courses[0].id);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Load ledger for selected course
  const fetchLedger = async (courseId: string) => {
    setIsLoading(true);
    try {
      const data = await AttendanceApiService.getCourseLedger(courseId);
      setLedger(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchLedger(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleExportCsv = async () => {
    if (!ledger) return;
    setIsExporting(true);
    try {
      const blob = await AttendanceApiService.exportCourseMatrixCsv(ledger.course.id);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cumulative_Ledger_${ledger.course.code.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore
    } finally {
      setIsExporting(false);
    }
  };

  // Filter students in matrix
  const filteredStudents = (ledger?.students || []).filter((row) => {
    const matchesSearch =
      row.student.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.student.jambRegNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.student.matricNo.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'eligible' && row.statusTier === 'eligible') ||
      (statusFilter === 'at_risk' && row.statusTier === 'at_risk') ||
      (statusFilter === 'ineligible' && row.statusTier === 'ineligible');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Course Selector */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Multi-Session Continuity Ledger
              </span>
              <span className="text-xs text-slate-400">· Senate 75% Exam Eligibility Tracker</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Course Attendance Archives & Cumulative Matrices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a course to view complete multi-session attendance history, continuous lecture accumulation, and student-by-student eligibility scorecard.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={isExporting || !ledger}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export Matrix CSV</span>
            </button>

            {ledger && onStartLectureForCourse && (
              <button
                onClick={() => onStartLectureForCourse(ledger.course)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Launch Lecture #${(ledger.totalLecturesHeld || 0) + 1} for ${ledger.course.code}`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Launch Next Lecture (#{ledger.totalLecturesHeld + 1})</span>
              </button>
            )}
          </div>
        </div>

        {/* Course Pills */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1">
          {courses.map((c) => {
            const isSelected = selectedCourseId === c.id;
            const isLive = activeSession?.courseCode.toUpperCase() === c.code.toUpperCase();

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md font-semibold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span className="font-mono">{c.code}</span>
                <span className="text-[11px] opacity-80">({c.totalLectures} Lecs)</span>
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Loading course ledger & session history...</p>
        </div>
      )}

      {/* Loaded Ledger Content */}
      {!isLoading && ledger && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="text-xs text-slate-400 font-medium">Lectures Conducted</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {ledger.totalLecturesHeld}
                <span className="text-xs text-slate-500 font-normal ml-1">sessions</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">Continuous Accumulation</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="text-xs text-slate-400 font-medium">Average Turnout</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {ledger.averageAttendanceRate}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Across all sessions</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="text-xs text-slate-400 font-medium">Exam Eligible (&ge;75%)</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {ledger.eligibleStudentsCount}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {ledger.totalStudents}
                </span>
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">Senate Benchmark Met</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="text-xs text-slate-400 font-medium">At Risk (50-74%)</div>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {ledger.atRiskStudentsCount}
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">Warning Threshold</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md col-span-2 lg:col-span-1">
              <div className="text-xs text-slate-400 font-medium">Barred (&lt;50%)</div>
              <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
                {ledger.ineligibleStudentsCount}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-1">Requires Intervention</div>
            </div>
          </div>

          {/* Chronological Session Timeline Chips */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lecture Timeline ({ledger.sessions.length} Recorded Sessions)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Lecturer: <strong className="text-slate-200">{ledger.course.lecturerName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {ledger.sessions.map((sess) => {
                const countPresent = ledger.students.filter(
                  (s) => s.sessionAttendance[sess.id]
                ).length;
                const turnoutPct = ((countPresent / ledger.totalStudents) * 100).toFixed(0);

                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="font-bold text-white">Lecture #{sess.lectureNumber}</span>
                        <span className="text-emerald-400 font-semibold">{turnoutPct}%</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(sess.startTime).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sess.hallLocation}</span>
                      <span className="font-mono text-slate-300">
                        {countPresent}/{ledger.totalStudents} present
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix Search & Filters */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter student name or JAMB..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({ledger.students.length})
                </button>
                <button
                  onClick={() => setStatusFilter('eligible')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'eligible'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/40'
                      : 'text-emerald-400/70 hover:text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Eligible ({ledger.eligibleStudentsCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('at_risk')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'at_risk'
                      ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/40'
                      : 'text-amber-400/70 hover:text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>At Risk ({ledger.atRiskStudentsCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('ineligible')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                    statusFilter === 'ineligible'
                      ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/40'
                      : 'text-rose-400/70 hover:text-rose-400'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  <span>Barred ({ledger.ineligibleStudentsCount})</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">S/N</th>
                    <th className="px-3 py-3 min-w-[160px]">Student Full Name</th>
                    <th className="px-3 py-3 min-w-[120px]">JAMB Reg No</th>
                    <th className="px-3 py-3 min-w-[110px]">Matric No</th>
                    {/* Columns for each lecture */}
                    {ledger.sessions.map((s) => (
                      <th
                        key={s.id}
                        className="px-2 py-3 text-center min-w-[65px]"
                        title={`Lecture #${s.lectureNumber} - ${new Date(s.startTime).toLocaleDateString()}`}
                      >
                        L#{s.lectureNumber}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center min-w-[80px]">Total Signed</th>
                    <th className="px-3 py-3 text-center min-w-[70px]">Rate (%)</th>
                    <th className="px-3 py-3 text-right min-w-[110px]">Senate Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {filteredStudents.map((row, idx) => (
                    <tr key={row.student.jambRegNo} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white">
                        {row.student.fullName}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-300">
                        {row.student.jambRegNo}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">
                        {row.student.matricNo}
                      </td>
                      {/* Attendance dot/badge for each lecture */}
                      {ledger.sessions.map((s) => {
                        const attended = row.sessionAttendance[s.id];
                        return (
                          <td key={s.id} className="px-2 py-2.5 text-center">
                            {attended ? (
                              <span
                                className="inline-block w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold leading-4"
                                title={`Lecture #${s.lectureNumber}: Present`}
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className="inline-block w-4 h-4 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold leading-4"
                                title={`Lecture #${s.lectureNumber}: Absent`}
                              >
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-white">
                        {row.attendedCount} / {row.totalLectures}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        <span
                          className={
                            row.attendanceRate >= 75
                              ? 'text-emerald-400'
                              : row.attendanceRate >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {row.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.statusTier === 'eligible' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Eligible
                          </span>
                        ) : row.statusTier === 'at_risk' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Barred
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={8 + ledger.sessions.length}
                        className="p-8 text-center text-slate-500"
                      >
                        No students match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
