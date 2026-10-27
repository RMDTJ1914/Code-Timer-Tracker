# Code Timer Tracker — Developer Productivity & Session Engine

> **High-Precision Time Tracking, Session Management, and Productivity Analytics Built Specifically for Software Engineers.**

Developed by **Mohammad Abu Khashreef** • Part of **Code Elta6ur**

---

## 🌟 Overview & Product Vision

**Code Timer Tracker** is an engineered developer tool designed to answer real questions about programming time, focus consistency, and project resource allocation:

- *How much focused time did I actually spend coding today vs. interruptions?*
- *Which repositories consumed most of my development hours this week?*
- *Are my initial task time estimates aligning with real recorded session durations?*
- *What is my active coding streak and productivity trend over time?*
- *How can I track billable client work and export clean CSV/JSON reports without invasive monitoring?*

Built with a **local-first client architecture**, all records remain completely private in your browser. No telemetry, keystroke loggers, or source code scraping.

---

## ✨ Key Capabilities & Engineering Features

### 1. High-Precision Time Tracking Engine
- **Timestamp-Accurate Timing**: Calculates elapsed time using delta epoch timestamps (`now - startTime - pausedDuration`), eliminating interval drift and tab sleep inaccuracy.
- **Session Persistence & Crash Recovery**: Active session state is written synchronously to local storage; browser reloads or tab closures resume ticking seamlessly without losing elapsed time.
- **Stateful Pauses**: Accumulates pause spans accurately and reflects live paused duration.
- **Global Header Pill**: Keep track of the active session, elapsed time, and pause/stop controls from any page in the application.
- **Manual Session Logging**: Backfill past offline work with date, duration, billable status, tags, and notes.
- **Full Session Editing**: Correct past session durations, projects, tasks, or notes with instant recalculation.

### 2. Developer Project & Task Management
- **Repository Context**: Associate sessions with projects, tech stack badges (e.g. React, Node, Python, Docker), hourly rates, and categories (Frontend, Backend, DevOps, etc.).
- **Task-Level Tracking**: Assign tasks with priorities (`Low`, `Medium`, `High`, `Urgent`), status (`To Do`, `In Progress`, `Done`), estimated minutes, and deadlines.
- **1-Click Launch**: Launch a live tracking session directly from any project card or task row.
- **Archive System**: Cleanly archive completed repositories while preserving historical session logs.

### 3. Genuine Productivity Analytics & Visualizations
Derived 100% from actual recorded sessions (zero fake metrics or hardcoded graphs):
- **Dynamic Period Selector**: Filter by *This Week*, *This Month*, *Last 30 Days*, or *All Time*.
- **Time Distribution by Project**: Doughnut chart showing real project hour breakdown.
- **Daily Coding Volume**: Bar chart of hours logged day-by-day.
- **Cumulative Focus Trend**: Line chart illustrating continuous focus velocity.
- **Category & Tech Breakdown**: Horizontal chart visualizing time investment across domains.
- **Productivity Metrics**: Total hours, average session duration, total session count, billable value, and top active repository.

### 4. Developer Workflows & UX
- **Command Palette (`Ctrl+K` / `Cmd+K`)**: Instant search and trigger for all navigation, timer controls, project launchers, export actions, and ecosystem links.
- **Distraction-Free Focus Mode (`Ctrl+B`)**: Fullscreen, zero-clutter digital timer display showing current task, project, and discreet pause/stop controls.
- **Focus Interval Companion (Pomodoro)**: Non-blocking work and break timer with Web Audio synthesized cues that do not halt active session tracking.
- **RFC 4180 CSV Export**: Standard-compliant CSV export with UTF-8 BOM encoding for seamless display in Microsoft Excel, Google Sheets, or Apple Numbers.
- **JSON Backup & Safe Restore**: Full workspace export and schema-validated JSON import with replace/merge protection.
- **Dual Technical Theme**: Polished dark mode by default with slate/emerald aesthetics; toggleable high-contrast light mode.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Start, pause, or resume active session (when outside input fields) |
| `Ctrl + Shift + S` | Stop and save active session to logs |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |
| `Ctrl + B` / `Cmd + B` | Toggle Distraction-Free Focus Mode |
| `Ctrl + 1` | Navigate to Developer Dashboard |
| `Ctrl + 2` | Navigate to Live Timer Console |
| `Ctrl + 3` | Navigate to Projects & Tasks |
| `Ctrl + 4` | Navigate to Session History Logs |
| `Ctrl + 5` | Navigate to Productivity Analytics |
| `Escape` | Close modals, command palette, or exit Focus Mode |

---

## 🛠️ Technology Stack & Architecture

- **Core**: Vanilla HTML5, CSS3, ES2022 JavaScript.
- **Visuals**: Chart.js for data visualization, Font Awesome 6 for iconography.
- **Audio**: Web Audio API procedural sound synthesizer (offline-ready, zero external audio MP3 dependencies).
- **Storage**: Browser LocalStorage with automated schema migration.
- **Testing**: Node.js built-in test runner (`node --test tests/test_engine.js`).

---

## 🚀 Getting Started

The application is completely client-side and requires no build step, backend server, or database installation.

### Local Execution:
1. Clone the repository:
   ```bash
   git clone https://github.com/mokashreef/Code-Timer-Tracker.git
   cd Code-Timer-Tracker
   ```
2. Open `index.html` in any modern web browser, or serve with a lightweight local server:
   ```bash
   npx serve .
   ```

### Running Automated Tests:
Run the unit test suite verifying time engine math, CSV RFC 4180 formatting, streak calculation, and backup schema validation:
```bash
node --test tests/test_engine.js
```

---

## 🌐 Code Elta6ur Ecosystem

Code Timer Tracker is an official project within the **Code Elta6ur** ecosystem:

1. [Code Elta6ur — Educational Platform](https://code-elta6ur.com/)
2. [Code Elta6ur — Software Company](https://code-elta6ur.net/)
3. [Code Elta6ur — Portfolio Builder](https://portfolio.code-elta6ur.net/)
4. [Code Ora](https://code-ora.com/)
5. [HardwareBase](https://hardwarebase.code-elta6ur.com/)
6. [Code Elta6ur — Syria Platform](https://code-elta6ur.sy/)
7. [Mohammad Abu Khashreef — Portfolio](https://mohammad.code-elta6ur.com/)
8. [Code Elta6ur GitHub Organization / Projects](https://github.com/mokashreef)

---

## 📄 License & Attribution

- **Developer**: [Mohammad Abu Khashreef](https://mohammad.code-elta6ur.com/)
- **Organization**: [Code Elta6ur](https://code-elta6ur.net/)
- **License**: Released under the [MIT License](LICENSE). Copyright (c) 2026 Mohammad Abu Khashreef / Code Elta6ur.
