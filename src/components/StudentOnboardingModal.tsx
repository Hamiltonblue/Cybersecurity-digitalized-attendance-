import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Smartphone,
  GraduationCap,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Lock,
  RotateCw,
} from 'lucide-react';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCheckIn?: () => void;
}

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartCheckIn,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'step-jamb',
      title: 'Step 1: RUN Matric / JAMB Verification',
      kicker: 'Identity Verification',
      icon: GraduationCap,
      color: 'from-sky-500 to-blue-600',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      summary: 'Your identity is verified against the Redeemer\'s University Cybersecurity course roster.',
      bullets: [
        'Enter your official RUN Matriculation number (e.g., RUN/CYB/22/0142) or registered JAMB number.',
        'The system automatically verifies your name, level (100L–400L), and Cybersecurity course enrollment.',
        'Unregistered students cannot check in and must be added to the departmental roster by the Course Rep.',
      ],
      interactivePreview: (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Redeemer's University Verification</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> CYB Roster Synced
            </span>
          </div>
          <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">MATRIC / JAMB NO</span>
              <span className="text-xs font-mono font-semibold text-white tracking-wider">RUN/CYB/22/0142</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">STUDENT</span>
              <span className="text-xs font-medium text-emerald-300">Cybersecurity Student</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Department of Cybersecurity · Redeemer's University</span>
          </div>
        </div>
      ),
    },
    {
      id: 'step-pin',
      title: 'Step 2: 60-Second Rolling Passcode',
      kicker: 'Lecture Hall Synchronization',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'Passcodes change every 60 seconds on the projector to prevent remote proxying.',
      bullets: [
        'Look at the front projector screen in your lecture theatre (Science Complex / CYB Lab).',
        'Enter the live 4-digit PIN displayed on the board before the 60-second timer expires.',
        'Codes forwarded via WhatsApp or SMS will expire quickly, ensuring only physically present students can sign in.',
      ],
      interactivePreview: (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 shadow-inner space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Classroom Projector PIN</span>
            <span className="text-amber-400 font-mono flex items-center gap-1">
              <RotateCw className="w-3 h-3 animate-spin" /> Rotates every 60s
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            {['8', '4', '1', '9'].map((digit, i) => (
              <div
                key={i}
                className="w-11 h-12 rounded-xl bg-slate-800 border border-amber-500/40 flex items-center justify-center font-mono text-xl font-bold text-amber-300 shadow-md shadow-amber-950/20"
              >
                {digit}
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full w-3/4 rounded-full animate-pulse" />
          </div>
        </div>
      ),
    },
    {
      id: 'step-device',
      title: 'Step 3: Single-Device Anti-Proxy Lock',
      kicker: 'Hardware Integrity Guard',
      icon: Smartphone,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'One phone per student session — proxy sign-ins for absent friends are blocked.',
      bullets: [
        'RUN-CyberPass fingerprints each student device (browser session + hardware telemetry).',
        'Once your phone submits attendance, it locks to your matriculation identity for that lecture.',
        'Attempting to log in for another student from the same device triggers an instant security lockout.',
      ],
      interactivePreview: (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Device Security Lock</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" /> 1 Device = 1 Student
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Device Fingerprint Secured</span>
              <span className="text-[10px] text-emerald-300 font-mono">HW-HASH: 7f4a...9b1e · Locked to Roster</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Course Reps can grant an emergency override in case of genuine device handovers.
          </p>
        </div>
      ),
    },
    {
      id: 'step-ledger',
      title: 'Step 4: 75% Senate Exam Benchmark',
      kicker: 'Cumulative Progress & Eligibility',
      icon: ShieldCheck,
      color: 'from-indigo-500 to-purple-600',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      summary: 'Track your cumulative lecture attendance and verify examination clearance.',
      bullets: [
        'Redeemer\'s University Senate regulations require a minimum of 75% lecture attendance to sit semester exams.',
        'Every verified check-in dynamically updates your permanent multi-session course ledger.',
        'Click the "My Attendance" tab anytime to review your verified timestamps and clearance status.',
      ],
      interactivePreview: (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/60 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>CYB Course Attendance Ledger</span>
            <span className="text-emerald-400 font-mono font-bold">85.0% EXAM ELIGIBLE</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((lec) => (
              <div
                key={lec}
                className={`flex-1 py-1.5 rounded text-center text-[10px] font-mono font-semibold ${
                  lec <= 4
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse'
                }`}
              >
                Lec {lec}
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>4 of 5 Lectures Verified</span>
            <span className="text-emerald-300 font-semibold text-[11px]">Clearance: Approved</span>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('unipass_onboarding_dismissed', 'true');
      } catch {
        // ignore
      }
    }
    onClose();
    if (onStartCheckIn) {
      onStartCheckIn();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${step.badgeColor}`}>
                  {step.kicker}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h2 id="onboarding-step-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {step.summary}
          </p>

          {/* Interactive Mock Preview Box */}
          {step.interactivePreview}

          {/* Key Bullet Instructions */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Essential Rules to Remember
            </h4>
            <div className="space-y-2">
              {step.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Step Indicator Dots + "Don't show again" */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentStep
                      ? 'w-6 bg-emerald-400'
                      : i < currentStep
                      ? 'w-2 bg-emerald-600/60'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Jump to step ${i + 1}`}
                />
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
              />
              <span>Don't show on start</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/30 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-900/40 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Check-In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
