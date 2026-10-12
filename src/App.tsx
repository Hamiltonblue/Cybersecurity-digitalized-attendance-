import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ProjectorView } from './components/ProjectorView.tsx';
import { RosterManager } from './components/RosterManager.tsx';
import { StudentAttendanceStats } from './components/StudentAttendanceStats.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { SecurityModal } from './components/SecurityModal.tsx';
import { StudentOnboardingModal } from './components/StudentOnboardingModal.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { AttendanceApiService } from './services/api.ts';
import { SessionPublicInfo } from './types/attendance.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('student');
  const [publicSession, setPublicSession] = useState<SessionPublicInfo | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [selectedJambForCheckIn, setSelectedJambForCheckIn] = useState<string>('');
  const [selectedJambForStats, setSelectedJambForStats] = useState<string>('');

  // Check existing session auth and first-time onboarding prompt on mount
  useEffect(() => {
    setIsAdminAuthenticated(AttendanceApiService.isAdminAuthenticated());
    try {
      const dismissed = localStorage.getItem('unipass_onboarding_dismissed');
      if (dismissed !== 'true') {
        setIsOnboardingOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll public session state for active indicator
  const syncSession = async () => {
    try {
      const res = await AttendanceApiService.getActiveSession();
      if (res.active && res.session) {
        setPublicSession({
          id: res.session.id,
          courseId: res.session.courseId,
          lectureNumber: res.session.lectureNumber,
          courseCode: res.session.courseCode,
          courseTitle: res.session.courseTitle,
          hallLocation: res.session.hallLocation,
          status: res.session.status,
          startTime: res.session.startTime,
          expiresAt: res.session.expiresAt,
          remainingMs: Math.max(0, res.session.expiresAt - Date.now()),
        });
      } else {
        setPublicSession(null);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    syncSession();
    const interval = setInterval(syncSession, 2500);
    return () => clearInterval(interval);
  }, []);

  // Tab change handler: only Course Rep Hub requires password authentication
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'admin' && !isAdminAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    AttendanceApiService.logoutAdmin();
    setIsAdminAuthenticated(false);
    setActiveTab('student');
  };

  const handleSelectStudentForCheckIn = (jamb: string) => {
    setSelectedJambForCheckIn(jamb);
    setActiveTab('student');
  };

  const handleNavigateToStats = (jamb?: string) => {
    if (jamb) setSelectedJambForStats(jamb);
    setActiveTab('my-stats');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Hide navbar only in projector mode for clean lecture hall projection */}
      {activeTab !== 'projector' && (
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sessionActive={publicSession !== null && publicSession.status === 'active'}
          activeCourseCode={publicSession?.courseCode}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          onAdminLogout={handleAdminLogout}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {/* 1. Student Check-In (Public) */}
        {activeTab === 'student' && (
          <StudentPortal
            activeSession={publicSession}
            onGoToProjector={() => setActiveTab('projector')}
            onGoToDirectory={() => setActiveTab('roster')}
            onGoToMyStats={handleNavigateToStats}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenAdminLogin={() => setIsLoginModalOpen(true)}
            isAdminAuthenticated={isAdminAuthenticated}
            prefilledJamb={selectedJambForCheckIn}
          />
        )}

        {/* 2. Lecture Hall Projector / PIN Screen (Public) */}
        {activeTab === 'projector' && (
          <ProjectorView
            onBackToDashboard={() => setActiveTab(isAdminAuthenticated ? 'admin' : 'student')}
            onOpenCheckInTab={() => setActiveTab('student')}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        )}

        {/* 3. Student Directory (Public read-only lookup with guarded Rep enrollment) */}
        {activeTab === 'roster' && (
          <RosterManager
            onBackToDashboard={() => setActiveTab(isAdminAuthenticated ? 'admin' : 'student')}
            isAdminAuthenticated={isAdminAuthenticated}
            onRequireAdminAuth={() => setIsLoginModalOpen(true)}
            onSelectStudentForCheckIn={handleSelectStudentForCheckIn}
          />
        )}

        {/* 4. Dedicated My Attendance & Course Analytics Tab (Public) */}
        {activeTab === 'my-stats' && (
          <StudentAttendanceStats
            onGoToCheckIn={() => setActiveTab('student')}
            activeCourseCode={publicSession?.status === 'active' ? publicSession.courseCode : undefined}
            initialJambQuery={selectedJambForStats}
          />
        )}

        {/* 5. Course Rep Command Center (Protected by password) */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onOpenProjector={() => setActiveTab('projector')}
            onOpenRoster={() => setActiveTab('roster')}
            onRefreshSessionState={syncSession}
            onLockAdmin={handleAdminLogout}
          />
        )}
      </main>

      {/* Course Rep Authentication Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Security & Anti-Tamper Shield Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Student First-Time & Replayable Onboarding Guide Modal */}
      <StudentOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCheckIn={() => {
          setIsOnboardingOpen(false);
          setActiveTab('student');
        }}
      />

      {/* Lecture Hall Offline Connectivity Toast */}
      <OfflineIndicator />
    </div>
  );
}
