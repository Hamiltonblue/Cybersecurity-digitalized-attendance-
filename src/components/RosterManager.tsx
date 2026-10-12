import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertCircle,
  GraduationCap,
  Lock,
  Copy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AttendanceApiService } from '../services/api.ts';
import { Student } from '../types/attendance.ts';

interface RosterManagerProps {
  onBackToDashboard?: () => void;
  isAdminAuthenticated: boolean;
  onRequireAdminAuth: () => void;
  onSelectStudentForCheckIn?: (jamb: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  onBackToDashboard,
  isAdminAuthenticated,
  onRequireAdminAuth,
  onSelectStudentForCheckIn,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedJamb, setCopiedJamb] = useState<string | null>(null);

  // New Student Form
  const [newJamb, setNewJamb] = useState('');
  const [newName, setNewName] = useState('');
  const [newMatric, setNewMatric] = useState('');
  const [newDepartment, setNewDepartment] = useState('Cybersecurity');
  const [newLevel, setNewLevel] = useState('400L');

  // CSV Drag & Drop State
  const [csvContent, setCsvContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Array<{ jambRegNo: string; fullName: string; matricNo?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStudents = async () => {
    const list = await AttendanceApiService.getStudents();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenAdd = () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleOpenUpload = () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleClearAllStudents = async () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    if (!confirm('Are you sure you want to completely clear all students from the roster? This provides a 100% clean slate.')) return;
    await AttendanceApiService.resetStudents();
    setStudents([]);
    setNotification('Student roster completely cleared. Ready for fresh departmental entry.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSeedRunCybCohort = async () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth();
      return;
    }
    const res = await AttendanceApiService.seedRunCybData();
    if (res.success) {
      await loadStudents();
      setNotification("Loaded Redeemer's University Cybersecurity sample cohort (100L–400L).");
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJamb.trim() || !newName.trim()) return;

    try {
      const currentYearShort = new Date().getFullYear().toString().slice(-2);
      await AttendanceApiService.addStudent({
        jambRegNo: newJamb.trim().toUpperCase(),
        fullName: newName.trim(),
        matricNo: newMatric.trim().toUpperCase() || `RUN/CYB/${currentYearShort}/${Math.floor(1000 + Math.random() * 9000)}`,
        department: newDepartment.trim() || 'Cybersecurity',
        level: newLevel.trim() || '400L',
      });
      setNotification(`Added ${newName.trim()} to Redeemer's University Cybersecurity roster.`);
      setIsAddModalOpen(false);
      setNewJamb('');
      setNewName('');
      setNewMatric('');
      loadStudents();
      setTimeout(() => setNotification(null), 3000);
    } catch {
      // Error
    }
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvString(text);
    };
    reader.readAsText(file);
  };

  const parseCsvString = (text: string) => {
    setCsvContent(text);
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsed: Array<{ jambRegNo: string; fullName: string; matricNo?: string }> = [];

    const startIdx = lines[0].toLowerCase().includes('jamb') || lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 2) {
        let jamb = cols[0];
        let name = cols[1];
        let matric = cols[2];

        if (cols[1].includes('/') && !cols[0].includes('/')) {
          jamb = cols[1];
          name = cols[0];
        }

        if (jamb && name) {
          parsed.push({
            jambRegNo: jamb.toUpperCase(),
            fullName: name,
            matricNo: matric,
          });
        }
      }
    }

    setParsedPreview(parsed);
  };

  const handleCommitCsvImport = async () => {
    if (parsedPreview.length === 0) return;
    const importedCount = await AttendanceApiService.bulkImportStudents(parsedPreview);
    setNotification(`Successfully imported ${importedCount} students into the master list!`);
    setIsUploadModalOpen(false);
    setParsedPreview([]);
    setCsvContent('');
    loadStudents();
    setTimeout(() => setNotification(null), 4000);
  };

  // Download Sample Template CSV for Redeemer's University Cybersecurity
  const handleDownloadSampleCsv = () => {
    const template = 'JAMB Reg No,Student Full Name,Matric No,Department,Level\n2024/778899AA,"Oluwaseun Emmanuel Adeyemi",RUN/CYB/21/0045,Cybersecurity,400L\n2024/778899BB,"Amina Fatima Danjuma",RUN/CYB/21/0088,Cybersecurity,400L\n2024/778899CC,"Chukwuma David Okonkwo",RUN/CYB/22/0112,Cybersecurity,300L\n2024/778899DD,"Blessing Temitope Ajayi",RUN/CYB/22/0145,Cybersecurity,300L\n2024/778899EE,"Favour Chidinma Eze",RUN/CYB/23/0204,Cybersecurity,200L\n2024/778899GG,"Precious Oluwanifemi Williams",RUN/CYB/24/0301,Cybersecurity,100L\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RUN_CyberPass_Class_Roster_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJamb = (jamb: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jamb);
      setCopiedJamb(jamb);
      setTimeout(() => setCopiedJamb(null), 2000);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.jambRegNo.toLowerCase().includes(q) ||
      s.matricNo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
              Redeemer's University · Department of Cybersecurity
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
              Departmental Student Registry & Directory
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Accredited student roster across 100L to 400L for lecture attendance verification ({students.length} students enrolled).
            </p>
          </div>

          {/* Action Buttons: Add / Upload CSV / Sample Cohort / Clear */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAdminAuthenticated
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isAdminAuthenticated ? 'Add student to class roster' : 'Requires Course Rep password'}
            >
              {isAdminAuthenticated ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Add Student {isAdminAuthenticated ? '' : '(Rep)'}</span>
            </button>

            <button
              onClick={handleOpenUpload}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isAdminAuthenticated ? 'Bulk upload CSV roster' : 'Requires Course Rep password'}
            >
              {isAdminAuthenticated ? <Upload className="w-4 h-4 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Upload CSV {isAdminAuthenticated ? '' : '(Rep)'}</span>
            </button>

            {isAdminAuthenticated && (
              <>
                <button
                  onClick={handleSeedRunCybCohort}
                  className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Load Redeemer's University Cybersecurity sample cohort (100L-400L)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Load Sample Cohort</span>
                </button>

                <button
                  onClick={handleClearAllStudents}
                  className="px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Wipe student roster back to clean empty slate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Roster</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Table & Search Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider">
                Accredited Students
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">
                Showing {filteredStudents.length} of {students.length}
              </span>
            </div>

            {/* Instant Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your name, JAMB, or matric..."
                className="w-full h-8 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-mono">
                  <th className="py-2.5 px-3">S/N</th>
                  <th className="py-2.5 px-3">JAMB Reg No</th>
                  <th className="py-2.5 px-3">Matric No</th>
                  <th className="py-2.5 px-3">Student Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3 text-right">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.jambRegNo} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{s.jambRegNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyJamb(s.jambRegNo)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title="Copy JAMB number"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedJamb === s.jambRegNo && (
                            <span className="text-[10px] text-emerald-400 font-sans">Copied!</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {s.matricNo}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {s.department}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {s.level}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {onSelectStudentForCheckIn ? (
                          <button
                            type="button"
                            onClick={() => onSelectStudentForCheckIn(s.jambRegNo)}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Use to Check In</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Accredited
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      {students.length === 0 ? (
                        <div className="space-y-2 py-4">
                          <p className="text-slate-400 font-medium">No students enrolled in the Cybersecurity roster yet.</p>
                          <p className="text-[11px] text-slate-500">
                            Course Representatives can use "Add Student" above to enroll students, or "Upload CSV" to import the class list.
                          </p>
                        </div>
                      ) : (
                        `No students found matching "${searchQuery}". Try searching by first name or JAMB number.`
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: ADD STUDENT (Protected) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStudent}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Enroll Student to Master Roster
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                JAMB Registration Number *
              </label>
              <input
                type="text"
                value={newJamb}
                onChange={(e) => setNewJamb(e.target.value.toUpperCase())}
                placeholder="e.g. 2024/778899AA"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Student Full Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Oluwaseun Emmanuel Adeyemi"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  RUN Matric Number
                </label>
                <input
                  type="text"
                  value={newMatric}
                  onChange={(e) => setNewMatric(e.target.value.toUpperCase())}
                  placeholder="e.g. RUN/CYB/21/0045"
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Level
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500"
                >
                  <option value="100L">100L</option>
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Enroll to Class List
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CSV BULK IMPORT (Protected) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload Master Class List CSV
              </span>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a comma-separated class roster containing JAMB Registration Numbers and Full Names.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl text-center cursor-pointer transition-colors bg-slate-900/60"
            >
              <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-white">
                Click to browse or drop CSV file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Accepts .csv format (Columns: JAMB Reg No, Full Name, Matric No)
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {parsedPreview.length > 0 && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-emerald-400 block">
                  Detected {parsedPreview.length} students to import:
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                  {parsedPreview.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.fullName}</span>
                      <span className="text-emerald-400">{p.jambRegNo}</span>
                    </div>
                  ))}
                  {parsedPreview.length > 5 && (
                    <div className="text-slate-500 italic">
                      + {parsedPreview.length - 5} more students...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleCommitCsvImport}
                disabled={parsedPreview.length === 0}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Import {parsedPreview.length > 0 ? `(${parsedPreview.length} Students)` : ''}
              </button>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
