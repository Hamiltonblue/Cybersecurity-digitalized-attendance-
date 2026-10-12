# RUN-CyberPass: Redeemer's University Cybersecurity Attendance System

Rebrand the platform as **RUN-CyberPass**, dedicated to the Department of Cybersecurity at Redeemer's University (Ede, Osun State). Completely wipe all legacy placeholder courses and seed student rosters to provide a pristine blank slate, enabling course representatives and lecturers to input real courses and student cohorts across all levels (100L to 400L) via intuitive manual entry and bulk CSV import.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive interview:
> - **Platform Name**: Rebranded to **RUN-CyberPass** (Redeemer's University Cybersecurity Attendance System).
> - **Data Reset**: Completely wipe all existing placeholder courses, student rosters, session histories, and attendance logs to start with a 100% clean slate.
> - **Cohort Coverage**: Multi-level departmental roster support encompassing all undergraduate levels: **100L, 200L, 300L, and 400L**.
> - **Institution Branding**: Redeemer's University (RUN) academic metadata, Department of Cybersecurity departmental identity, and Nigerian university matriculation formatting (`RUN/CYB/...`).

---

### 1. Overview & Core Concept

- **What It Does**:
  - Serves as the official digital lecture attendance verification platform for Redeemer's University's Department of Cybersecurity.
  - Replaces all legacy CSC demo data with an empty, ready-to-populate institutional database.
  - Provides Course Representatives and Departmental Lecturers with dedicated tools to:
    1. **Register New Courses**: Add courses with Course Code (e.g., `CYB 401`, `CYB 305`, `CYB 201`), Course Title, Lecturer Name, Hall Location (e.g., Science Complex Lecture Theatre, CYB Lab), and Academic Level (100L–400L).
    2. **Populate Student Rosters**: Enroll individual students or bulk-upload class lists via CSV with RUN Matriculation numbers, JAMB numbers, full names, and level tags.
    3. **Launch Live Rolling Sessions**: Generate time-synced 60-second classroom projector PINs with single-device hardware locking.
    4. **Track 75% Senate Clearance**: Calculate cumulative attendance ledgers against the Redeemer's University Senate 75% exam sitting benchmark.

- **Target Audience / Persona**:
  - Redeemer's University Cybersecurity students across 100L to 400L attending departmental lectures and computer laboratory practicals.
  - Departmental Course Representatives and Lecturers managing lecture attendance rosters and generating exportable accreditation sheets.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Zero-State Experience (Initial Clean Slate)**:
     - When opened, the platform clearly indicates: *"No courses or students enrolled yet."*
     - Direct prompt for Course Rep / Lecturer: *"Add your first Cybersecurity course or import the class list to begin."*
  2. **Course Enrollment & Creation**:
     - Course Rep logs in (`rep2024` or admin credentials) $\rightarrow$ creates courses with custom codes (e.g., `CYB 401: Digital Forensics & Incident Response`, `CYB 301: Cryptography & Defense Protocols`).
  3. **Roster Population**:
     - Course Rep enters student details manually or uploads a class CSV template with columns: `JAMB Reg No`, `Matric No (e.g. RUN/CYB/22/0142)`, `Full Name`, `Level (100L-400L)`.
  4. **Student Check-In & Onboarding**:
     - Students see **RUN-CyberPass** branding and the Redeemer's University Cybersecurity guide.
     - They enter their registered RUN Matriculation or JAMB number and the live 60s lecture PIN displayed on the projector screen.

- **Visual Identity & Theme**:
  - **Dominant Neutral Canvas**: Deep slate navy `#090D16` and `#0B132B`.
  - **Accent Colors**: Cybersecurity Emerald `#10B981` (verified attendance), Electric Cyan `#06B6D4` (security telemetry), and Amber `#F59E0B` (PIN timers).
  - **Typography**: Plus Jakarta Sans for titles/body, IBM Plex Mono for matriculation numbers and PIN codes.
  - **Zero-Pill Discipline**: Clean typographic separators (`·`, `/`) for student metadata.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Zero Hardcoded Seed Data vs. Starter Mock Data**
  - *Chosen Approach*: Clean wipe of all student and course arrays (`[]`).
  - *Why*: The user explicitly requested clearing all placeholder data so that authentic Redeemer's University Cybersecurity details can be entered without having to manually delete demo students.
  - *Mitigation for Zero State*: Add clear, friendly empty-state cards in the Student Portal, Projector View, and Course Rep Dashboard explaining how to register the first course and upload students.

- **Decision 2: Comprehensive Level Support (100L to 400L)**
  - *Chosen Approach*: Configure level selector dropdowns and filters with `100L`, `200L`, `300L`, and `400L` options.
  - *Why*: Accommodates both freshman foundational courses and final-year senior cybersecurity seminars.

- **Decision 3: PWA & Manifest Rebranding**
  - *Chosen Approach*: Update `name: 'RUN-CyberPass - Redeemer\'s University Attendance'`, `short_name: 'RUN-CyberPass'`, and mobile title tags.
  - *Why*: Ensures students who install the app on their phones see the official Redeemer's University Cybersecurity app icon and title.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│               RUN-CyberPass: Redeemer's University Portal              │
│                                                                        │
│  ┌─────────────────────────┐         ┌───────────────────────────────┐ │
│  │   Student Portal        │         │   Course Rep Command Center   │ │
│  │   - RUN Matric/JAMB     │         │   - Course Creation Engine    │ │
│  │   - 60s Rolling PIN     │         │   - CSV Class List Importer   │ │
│  │   - Device Lock Shield  │         │   - 75% Senate Exam Matrix    │ │
│  └────────────┬────────────┘         └───────────────┬───────────────┘ │
│               │                                      │                 │
│               └──────────────────┬───────────────────┘                 │
│                                  │                                     │
│  ┌───────────────────────────────▼───────────────────────────────────┐ │
│  │                     Full-Stack Express API                        │ │
│  │   GET /api/courses             (List Redeemer's CYB courses)      │ │
│  │   POST /api/courses            (Create new CYB course)            │ │
│  │   GET /api/students            (Departmental student directory)   │ │
│  │   POST /api/students/bulk      (Import RUN student CSV)           │ │
│  │   POST /api/session/start      (Start live lecture session)       │ │
│  │   POST /api/check-in           (Verify RUN student check-in)      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Empty Initial State**:
  - `masterStudents = []`
  - `masterCourses = []`
  - `attendanceRecords = []`
  - `completedSessions = []`
  - `activeSession = null`
- **Course Creation Endpoint**:
  - Add `POST /api/courses` endpoint in `server.ts` to allow Course Reps to dynamically create new courses with custom codes, titles, lecturers, and halls.
- **CSV Template Download**:
  - Provide a one-click sample CSV download pre-filled with Redeemer's University Cybersecurity sample headers:
    `JAMB Reg No,Matric No,Student Full Name,Department,Level`
