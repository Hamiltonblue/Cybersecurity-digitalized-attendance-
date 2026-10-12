# Cumulative Multi-Session Attendance Ledger & Student Course Analytics

A comprehensive multi-session continuity system that accumulates attendance across consecutive class sessions for each course, maintains a permanent historical lecture archive, calculates cumulative attendance rates against the 75% exam eligibility standard, and provides students with a dedicated personal course attendance portal.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 clarification:
> - **Student Attendance Portal**: **Dedicated "My Attendance" tab** in the top navigation bar where any student can look up their personal course records, total lectures attended, and exam eligibility status.
> - **Course Rep History & Ledger**: **Unified Course Ledger** inside the management dashboard featuring session date filters, cumulative student attendance matrices, and comprehensive semester exports.
> - **Session Continuity Flow**: **Select course to append to existing lecture history** when starting a new class session, automatically linking the new session to the course's historical lecture count.

---

### 1. Overview & Core Concept

#### What It Delivers
1. **Multi-Session Continuity & Accumulation**:
   - Each lecture session belongs to a course (e.g., `CSC 401`, `CSC 415`, `MTH 301`).
   - When a Course Rep launches Lecture 2, Lecture 3, or Lecture 4, the system automatically links it to the course timeline.
   - Cumulative counts update in real-time: `Total Lectures Held`, `Times Attended`, and `Attendance Rate (%)`.

2. **Accredited 75% Exam Eligibility Tracker**:
   - Computes academic compliance according to standard Nigerian university senate regulations (e.g. minimum 75% lecture attendance required to sit for semester examinations).
   - Students and course reps instantly see visual status tiers:
     - **Eligible ($\ge 75\%$)**: Green compliance confirmation
     - **At Risk ($50\% - 74\%$)**: Amber warning indicating danger of exam barring
     - **Ineligible ($< 50\%$)**: Red alert requiring Course Rep / Lecturer intervention

3. **Dedicated Student "My Attendance" Portal**:
   - Accessible without an admin password directly from the top navigation.
   - Students enter or search their JAMB Reg No or Matric No.
   - Instantly renders a personal academic scorecard showing:
     - All registered courses with attendance progress bars.
     - Total lectures held vs. attended for each course.
     - Chronological session timeline (Date, Hall, Lecturer, Verification Timestamp).

4. **Historical Session Archive & Multi-Session CSV Ledger**:
   - Course Rep can inspect past sessions individually or download a complete **Cumulative Attendance Matrix CSV** (all students in rows, all class dates in columns, plus total attendance and percentage).

---

### 2. User Experience & Visual Design

#### Public & Authenticated Navigation Bar
```
[ UniPass NG ] ─── [ Check-In ]  [ Hall Screen ]  [ Student Directory ]  [ My Attendance ] ─── [ Course Rep Hub / Login ]
```

- **Top Bar Tabs**:
  - `Check-In`: Real-time mobile attendance entry for the active class.
  - `Hall Screen`: Classroom projector rolling 60-second passcode display.
  - `Student Directory`: Public searchable roster of accredited students.
  - **`My Attendance` (NEW)**: Student-facing personal attendance history and course statistics lookup.
  - `Course Rep Hub`: Privileged admin center (locked behind rep password `rep2024`).

#### "My Attendance" Student View Flow
1. **Search Bar**: Student inputs JAMB Reg No (`2024/104829AB`) or Matric No (`CSC/2020/001`) with quick-select suggestions.
2. **Student Identity Header**: Displays student's Full Name, Matric No, Department, and overall attendance compliance rate.
3. **Course Progress Cards**:
   - Clean tabular cards for each course with:
     - Course Code (`CSC 401`) & Title (`Distributed Computing`).
     - Progress bar with tabular metric: `4 / 5 Lectures (80.0%)`.
     - Senate Status: `Exam Eligible (>= 75%)`.
4. **Interactive Session Log Expansion**:
   - Clicking a course unfolds the detailed lecture ledger:
     - `Lecture 1 · Sep 28 · 10:00 AM · Present`
     - `Lecture 2 · Oct 05 · 10:15 AM · Present`
     - `Lecture 3 · Oct 12 · 09:55 AM · Absent`

#### Course Rep "Cumulative Ledger" View Flow
1. **Course Selector**: Toggle between enrolled courses or view all.
2. **Summary KPI Metrics**:
   - `Total Lectures Conducted` (e.g., 5)
   - `Average Class Attendance` (e.g., 88.4%)
   - `Exam Eligible Students` (e.g., 28 / 30)
3. **Cumulative Ledger Table**:
   - Columns: Student Name, JAMB No, Matric No, [Lec 1, Lec 2, Lec 3, Lec 4, Lec 5], Total Attended, Attendance %, Senate Status.
4. **Action Controls**:
   - `Export Cumulative Matrix CSV`: Full spreadsheet formatted for academic board submission.
   - `View Past Sessions`: Deep-dive into specific historical dates and device verification logs.

---

### 3. Key Architectural Decisions & Data Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Data Architecture                             │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│     Course Entity     │                         │  Attendance Session   │
├───────────────────────┤                         ├───────────────────────┤
│ id: 'course-csc401'   │                         │ id: 'session-101'     │
│ code: 'CSC 401'       │◄────────────────────────┤ courseId: 'csc401'    │
│ title: 'Distributed...'│       (1 to Many)       │ lectureNumber: 3      │
│ lecturer: 'Dr. Bab...'│                         │ status: 'completed'   │
└───────────────────────┘                         └───────────┬───────────┘
                                                              │
                                                              ▼
                                                  ┌───────────────────────┐
                                                  │   Attendance Record   │
                                                  ├───────────────────────┤
                                                  │ sessionId: 'sess-101' │
                                                  │ jambRegNo: '2024/...' │
                                                  │ timestamp: 171...     │
                                                  │ deviceId: 'dev_...'   │
                                                  └───────────────────────┘
```

#### New API Endpoints
1. `GET /api/courses`: List all registered courses with session counts and lecture history.
2. `GET /api/courses/:courseId/ledger`: Cumulative attendance ledger calculating total lectures, student attendance counts, percentages, and exam eligibility for that course.
3. `GET /api/student/stats/:jambOrMatric`: Public lookup endpoint returning a student's full attendance history across all courses, session-by-session status, and exam qualifications.
4. `GET /api/courses/:courseId/export-matrix`: Downloads the complete multi-session attendance matrix CSV.
5. `POST /api/session/start`: Enhanced to accept `courseId` or existing course selection, auto-incrementing the lecture number for that course.

---

### 4. Implementation Steps

1. **Server Architecture (`server.ts`)**:
   - Pre-populate realistic multi-session lecture history for courses (`CSC 401`, `CSC 415`, `MTH 301`) so historical continuity is immediately visible.
   - Implement cumulative aggregation algorithms computing student attendance rates and exam compliance flags.
   - Add `/api/student/stats/:jambOrMatric` and `/api/courses/:courseId/ledger` endpoints.
   - Implement cumulative CSV export supporting multi-date matrix generation.

2. **Frontend Service (`src/services/api.ts`) & Types (`src/types/attendance.ts`)**:
   - Define `Course`, `CourseLedger`, `StudentCourseStats`, and `SessionHistoryItem` interfaces.
   - Add API client methods for fetching course ledgers, student personal stats, and matrix exports.

3. **Student "My Attendance" Component (`src/components/StudentAttendanceStats.tsx`)**:
   - Build responsive student lookup interface with search, summary cards, and collapsible lecture-by-lecture audit history.

4. **Course Rep Cumulative Ledger (`src/components/CourseLedgerView.tsx` / `AdminDashboard.tsx`)**:
   - Add unified course ledger view to the admin dashboard with lecture timelines, matrix tables, and 1-click cumulative CSV export.

5. **Navigation & Session Modal Integration (`src/components/Navbar.tsx`, `src/App.tsx`, `AdminDashboard.tsx`)**:
   - Add the "My Attendance" tab to top navigation.
   - Update "Start Session" modal to allow selecting an existing course from a dropdown or typing a new course code.
