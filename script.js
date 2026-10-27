/**
 * Code Timer Tracker — Core Application Engine
 * Developed by Mohammad Abu Khashreef • Code Elta6ur
 * Local-First Developer Productivity Engine
 */

class StorageManager {
    static STORAGE_KEY = 'code_timer_v2_data';
    static ACTIVE_SESSION_KEY = 'code_timer_v2_active_session';
    static LEGACY_KEY = 'codeTimerData';

    static getDefaultState() {
        return {
            version: '2.0',
            projects: [
                {
                    id: 'proj_default_1',
                    name: 'Code Timer Tracker',
                    description: 'Developer productivity, session tracking, and project analytics suite',
                    category: 'Full-Stack',
                    color: '#10b981',
                    hourlyRate: 65,
                    estimatedHours: 40,
                    techStack: ['JavaScript', 'HTML5', 'CSS3', 'Chart.js', 'Git'],
                    archived: false,
                    createdAt: new Date().toISOString()
                }
            ],
            tasks: [
                {
                    id: 'task_default_1',
                    projectId: 'proj_default_1',
                    title: 'Core time engine and analytics rebuild',
                    priority: 'high',
                    status: 'in_progress',
                    estimatedMinutes: 180,
                    deadline: '',
                    createdAt: new Date().toISOString()
                }
            ],
            sessions: [],
            settings: {
                theme: 'dark',
                dailyGoalHours: 4,
                weeklyGoalHours: 25,
                weekStart: 'sunday',
                timeFormat: '24h',
                soundEnabled: true,
                notificationsEnabled: false,
                pomoWorkMinutes: 25,
                pomoBreakMinutes: 5
            }
        };
    }

    static load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.sessions)) {
                    return this.normalizeState(parsed);
                }
            } catch (err) {
                console.error('Failed to parse storage data:', err);
            }
        }

        const legacyRaw = localStorage.getItem(this.LEGACY_KEY);
        if (legacyRaw) {
            try {
                const legacy = JSON.parse(legacyRaw);
                const migrated = this.migrateLegacyData(legacy);
                this.save(migrated);
                return migrated;
            } catch (err) {
                console.error('Failed to migrate legacy data:', err);
            }
        }

        const initial = this.getDefaultState();
        this.save(initial);
        return initial;
    }

    static normalizeState(data) {
        const defaults = this.getDefaultState();
        return {
            version: '2.0',
            projects: Array.isArray(data.projects) ? data.projects : defaults.projects,
            tasks: Array.isArray(data.tasks) ? data.tasks : defaults.tasks,
            sessions: Array.isArray(data.sessions) ? data.sessions : [],
            settings: { ...defaults.settings, ...(data.settings || {}) }
        };
    }

    static migrateLegacyData(legacy) {
        const base = this.getDefaultState();
        if (Array.isArray(legacy.projects)) {
            base.projects = legacy.projects.map((p, idx) => ({
                id: p.id || `migrated_proj_${idx}`,
                name: p.name || 'Unnamed Project',
                description: p.description || '',
                category: 'General',
                color: p.color || '#10b981',
                hourlyRate: parseFloat(p.rate) || 0,
                estimatedHours: 0,
                techStack: [],
                archived: false,
                createdAt: new Date().toISOString()
            }));
        }
        if (Array.isArray(legacy.sessions)) {
            base.sessions = legacy.sessions.map((s, idx) => {
                const duration = typeof s.duration === 'number' ? s.duration : 0;
                const start = s.startTime ? new Date(s.startTime).toISOString() : new Date().toISOString();
                const end = s.endTime ? new Date(s.endTime).toISOString() : new Date(new Date(start).getTime() + duration).toISOString();
                return {
                    id: s.id || `migrated_sess_${idx}`,
                    projectId: s.projectId || '',
                    taskId: null,
                    taskTitle: s.task || 'General Work',
                    startTime: start,
                    endTime: end,
                    duration: duration,
                    pausedDuration: 0,
                    tags: Array.isArray(s.tags) ? s.tags : [],
                    billable: !!s.billable,
                    hourlyRate: 0,
                    earned: 0,
                    notes: s.notes || '',
                    createdAt: start
                };
            });
        }
        return base;
    }

    static save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.error('Storage write error:', err);
        }
    }

    static saveActiveSession(session) {
        if (!session) {
            localStorage.removeItem(this.ACTIVE_SESSION_KEY);
            return;
        }
        try {
            localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(session));
        } catch (err) {
            console.error('Active session write error:', err);
        }
    }

    static loadActiveSession() {
        const raw = localStorage.getItem(this.ACTIVE_SESSION_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('Failed to parse active session:', err);
            return null;
        }
    }
}

class SoundSynthesizer {
    constructor(enabled = true) {
        this.enabled = enabled;
        this.ctx = null;
    }

    initCtx() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(frequency, type, duration, gainValue = 0.08) {
        if (!this.enabled) return;
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context policy fallback
        }
    }

    playStart() {
        this.playTone(523.25, 'sine', 0.12, 0.08); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.18, 0.08), 80); // E5
    }

    playPause() {
        this.playTone(440, 'triangle', 0.15, 0.06); // A4
    }

    playStop() {
        this.playTone(659.25, 'sine', 0.12, 0.08); // E5
        setTimeout(() => this.playTone(523.25, 'sine', 0.22, 0.08), 90); // C5
    }

    playBreakChime() {
        this.playTone(783.99, 'sine', 0.2, 0.09); // G5
        setTimeout(() => this.playTone(987.77, 'sine', 0.3, 0.09), 120); // B5
    }
}

class AppEngine {
    constructor() {
        window.appEngine = this;
        this.state = StorageManager.load();
        this.synth = new SoundSynthesizer(this.state.settings.soundEnabled);
        this.activeSession = null;
        this.timerInterval = null;
        this.currentPage = 'dashboard';

        this.pomodoro = {
            running: false,
            phase: 'work',
            timeLeft: this.state.settings.pomoWorkMinutes * 60,
            interval: null
        };

        this.sessionsPagination = {
            page: 1,
            perPage: 10,
            filtered: []
        };

        this.charts = {
            dashProjects: null,
            projectsDistribution: null,
            dailyVolume: null,
            cumulativeTrend: null,
            categoryBreakdown: null
        };

        this.initDOMReferences();
        this.applyTheme(this.state.settings.theme);
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.populateProjectSelects();
        this.restoreActiveSession();
        this.renderAll();
    }

    initDOMReferences() {
        this.dom = {
            app: document.getElementById('app'),
            themeToggle: document.getElementById('themeToggle'),
            navTabs: document.querySelectorAll('.nav-tab'),
            pageViews: document.querySelectorAll('.page-view'),

            // Header Pill
            headerTimerPill: document.getElementById('headerTimerPill'),
            pillProjectName: document.getElementById('pillProjectName'),
            pillTimerDisplay: document.getElementById('pillTimerDisplay'),
            pillPauseBtn: document.getElementById('pillPauseBtn'),
            pillStopBtn: document.getElementById('pillStopBtn'),

            // Dashboard
            dashStartTimerBtn: document.getElementById('dashStartTimerBtn'),
            dashNewProjectBtn: document.getElementById('dashNewProjectBtn'),
            dashTodayTime: document.getElementById('dashTodayTime'),
            dashWeekTime: document.getElementById('dashWeekTime'),
            dashBillableAmount: document.getElementById('dashBillableAmount'),
            dashBillableTime: document.getElementById('dashBillableTime'),
            dashActiveStreak: document.getElementById('dashActiveStreak'),
            dashActiveProjectsCount: document.getElementById('dashActiveProjectsCount'),
            todayProgressBadge: document.getElementById('todayProgressBadge'),
            weekProgressBadge: document.getElementById('weekProgressBadge'),
            dailyGoalProgress: document.getElementById('dailyGoalProgress'),
            weeklyGoalProgress: document.getElementById('weeklyGoalProgress'),
            dailyGoalText: document.getElementById('dailyGoalText'),
            weeklyGoalText: document.getElementById('weeklyGoalText'),
            dashTimerClock: document.getElementById('dashTimerClock'),
            dashActiveSessionStatus: document.getElementById('dashActiveSessionStatus'),
            dashMetaProject: document.getElementById('dashMetaProject'),
            dashMetaTask: document.getElementById('dashMetaTask'),
            dashTimerToggleBtn: document.getElementById('dashTimerToggleBtn'),
            dashTimerPauseBtn: document.getElementById('dashTimerPauseBtn'),
            dashTimerStopBtn: document.getElementById('dashTimerStopBtn'),
            dashRecentSessionsList: document.getElementById('dashRecentSessionsList'),
            dashProjectsEmpty: document.getElementById('dashProjectsEmpty'),

            // Timer Console
            consoleMainClock: document.getElementById('consoleMainClock'),
            consoleSessionStatusBadge: document.getElementById('consoleSessionStatusBadge'),
            consoleBillableBadge: document.getElementById('consoleBillableBadge'),
            consoleCategoryBadge: document.getElementById('consoleCategoryBadge'),
            consoleStartTimeText: document.getElementById('consoleStartTimeText'),
            consolePausedTimeText: document.getElementById('consolePausedTimeText'),
            consoleStartBtn: document.getElementById('consoleStartBtn'),
            consolePauseBtn: document.getElementById('consolePauseBtn'),
            consoleStopBtn: document.getElementById('consoleStopBtn'),
            timerProjectSelect: document.getElementById('timerProjectSelect'),
            timerTaskSelect: document.getElementById('timerTaskSelect'),
            timerTagsInput: document.getElementById('timerTagsInput'),
            timerBillableCheck: document.getElementById('timerBillableCheck'),
            timerNotesInput: document.getElementById('timerNotesInput'),
            activeProjectDetailsBody: document.getElementById('activeProjectDetailsBody'),

            // Pomodoro Companion
            pomoClock: document.getElementById('pomoClock'),
            pomoPhase: document.getElementById('pomoPhase'),
            pomoToggleBtn: document.getElementById('pomoToggleBtn'),
            pomoResetBtn: document.getElementById('pomoResetBtn'),
            pomoWorkDuration: document.getElementById('pomoWorkDuration'),
            pomoBreakDuration: document.getElementById('pomoBreakDuration'),

            // Projects Page
            projectsContainer: document.getElementById('projectsContainer'),
            projectFilterStatus: document.getElementById('projectFilterStatus'),
            createProjectBtn: document.getElementById('createProjectBtn'),

            // Sessions Table & Filters
            sessionSearchInput: document.getElementById('sessionSearchInput'),
            sessionFilterProject: document.getElementById('sessionFilterProject'),
            sessionFilterPeriod: document.getElementById('sessionFilterPeriod'),
            sessionFilterBillable: document.getElementById('sessionFilterBillable'),
            resetSessionFiltersBtn: document.getElementById('resetSessionFiltersBtn'),
            sessionsTableBody: document.getElementById('sessionsTableBody'),
            sessionTableCount: document.getElementById('sessionTableCount'),
            sessionPrevPageBtn: document.getElementById('sessionPrevPageBtn'),
            sessionNextPageBtn: document.getElementById('sessionNextPageBtn'),
            sessionCurrentPageText: document.getElementById('sessionCurrentPageText'),

            // Analytics
            analyticsTotalTime: document.getElementById('analyticsTotalTime'),
            analyticsAvgSession: document.getElementById('analyticsAvgSession'),
            analyticsTotalSessionsCount: document.getElementById('analyticsTotalSessionsCount'),
            analyticsBillableEarned: document.getElementById('analyticsBillableEarned'),
            analyticsBillableHours: document.getElementById('analyticsBillableHours'),
            analyticsTopProject: document.getElementById('analyticsTopProject'),
            analyticsTopProjectHours: document.getElementById('analyticsTopProjectHours'),
            periodButtons: document.querySelectorAll('.period-btn'),

            // Settings
            settingsForm: document.getElementById('settingsForm'),
            settingDailyGoalHours: document.getElementById('settingDailyGoalHours'),
            settingWeeklyGoalHours: document.getElementById('settingWeeklyGoalHours'),
            settingWeekStart: document.getElementById('settingWeekStart'),
            settingTimeFormat: document.getElementById('settingTimeFormat'),
            settingSoundToggle: document.getElementById('settingSoundToggle'),
            settingNotificationsToggle: document.getElementById('settingNotificationsToggle'),
            storageSessionsCount: document.getElementById('storageSessionsCount'),
            storageProjectsCount: document.getElementById('storageProjectsCount'),
            btnDownloadBackup: document.getElementById('btnDownloadBackup'),
            importBackupInput: document.getElementById('importBackupInput'),
            btnResetAllData: document.getElementById('btnResetAllData'),

            // Modals
            projectModal: document.getElementById('projectModal'),
            projectForm: document.getElementById('projectForm'),
            taskModal: document.getElementById('taskModal'),
            taskForm: document.getElementById('taskForm'),
            manualSessionModal: document.getElementById('manualSessionModal'),
            manualSessionForm: document.getElementById('manualSessionForm'),
            editSessionModal: document.getElementById('editSessionModal'),
            editSessionForm: document.getElementById('editSessionForm'),
            confirmModal: document.getElementById('confirmModal'),
            commandPaletteModal: document.getElementById('commandPaletteModal'),
            cmdPaletteInput: document.getElementById('cmdPaletteInput'),
            cmdPaletteResults: document.getElementById('cmdPaletteResults'),

            // Focus Overlay
            focusModeOverlay: document.getElementById('focusModeOverlay'),
            focusClock: document.getElementById('focusClock'),
            focusProjectPill: document.getElementById('focusProjectPill'),
            focusTaskTitle: document.getElementById('focusTaskTitle'),
            focusSubStatus: document.getElementById('focusSubStatus'),
            focusTogglePauseBtn: document.getElementById('focusTogglePauseBtn'),
            focusStopBtn: document.getElementById('focusStopBtn'),
            focusExitBtn: document.getElementById('focusExitBtn'),

            // Toast
            toastContainer: document.getElementById('toastContainer')
        };
    }

    initEventListeners() {
        // Navigation Tabs
        this.dom.navTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                const page = tab.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Theme Toggle
        this.dom.themeToggle?.addEventListener('click', () => {
            const nextTheme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
            this.state.settings.theme = nextTheme;
            this.applyTheme(nextTheme);
            this.saveState();
            this.showToast(`Switched to ${nextTheme} mode`, 'info');
        });

        // Header Pill Controls
        this.dom.pillPauseBtn?.addEventListener('click', () => this.togglePauseSession());
        this.dom.pillStopBtn?.addEventListener('click', () => this.stopAndSaveSession());

        // Dashboard Controls
        this.dom.dashStartTimerBtn?.addEventListener('click', () => {
            this.navigateTo('timer');
        });
        this.dom.dashNewProjectBtn?.addEventListener('click', () => this.openProjectModal());
        this.dom.dashTimerToggleBtn?.addEventListener('click', () => {
            if (!this.activeSession) {
                this.startSession();
            } else {
                this.navigateTo('timer');
            }
        });
        this.dom.dashTimerPauseBtn?.addEventListener('click', () => this.togglePauseSession());
        this.dom.dashTimerStopBtn?.addEventListener('click', () => this.stopAndSaveSession());
        document.getElementById('dashGoToTimerBtn')?.addEventListener('click', () => this.navigateTo('timer'));
        document.getElementById('viewAllSessionsBtn')?.addEventListener('click', () => this.navigateTo('sessions'));

        // Preset buttons on dashboard
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const task = btn.getAttribute('data-task');
                const tag = btn.getAttribute('data-tag');
                this.startPresetSession(task, tag);
            });
        });

        // Timer Console Controls
        this.dom.consoleStartBtn?.addEventListener('click', () => this.startSession());
        this.dom.consolePauseBtn?.addEventListener('click', () => this.togglePauseSession());
        this.dom.consoleStopBtn?.addEventListener('click', () => this.stopAndSaveSession());

        this.dom.timerProjectSelect?.addEventListener('change', () => {
            this.updateTaskSelectOptions();
            this.updateProjectSnapshot();
            this.syncConsoleMetadataToActiveSession();
        });

        this.dom.timerTaskSelect?.addEventListener('change', () => {
            this.syncConsoleMetadataToActiveSession();
        });
        this.dom.timerTagsInput?.addEventListener('input', () => {
            this.syncConsoleMetadataToActiveSession();
        });
        this.dom.timerBillableCheck?.addEventListener('change', () => {
            this.syncConsoleMetadataToActiveSession();
        });
        this.dom.timerNotesInput?.addEventListener('input', () => {
            this.syncConsoleMetadataToActiveSession();
        });

        document.getElementById('quickAddProjectBtn')?.addEventListener('click', () => this.openProjectModal());
        document.getElementById('quickAddTaskBtn')?.addEventListener('click', () => {
            const currentProjId = this.dom.timerProjectSelect ? this.dom.timerProjectSelect.value : '';
            this.openTaskModal(null, currentProjId);
        });

        // Fullscreen & Focus Mode
        document.getElementById('focusModeBtn')?.addEventListener('click', () => this.openFocusMode());
        document.getElementById('consoleFullscreenBtn')?.addEventListener('click', () => this.openFocusMode());
        this.dom.focusExitBtn?.addEventListener('click', () => this.closeFocusMode());
        this.dom.focusTogglePauseBtn?.addEventListener('click', () => this.togglePauseSession());
        this.dom.focusStopBtn?.addEventListener('click', () => this.stopAndSaveSession());

        // Companion Pomodoro
        this.dom.pomoToggleBtn?.addEventListener('click', () => this.togglePomodoro());
        this.dom.pomoResetBtn?.addEventListener('click', () => this.resetPomodoro());
        this.dom.pomoWorkDuration?.addEventListener('change', () => {
            this.state.settings.pomoWorkMinutes = parseInt(this.dom.pomoWorkDuration.value) || 25;
            this.saveState();
            if (!this.pomodoro.running && this.pomodoro.phase === 'work') {
                this.resetPomodoro();
            }
        });
        this.dom.pomoBreakDuration?.addEventListener('change', () => {
            this.state.settings.pomoBreakMinutes = parseInt(this.dom.pomoBreakDuration.value) || 5;
            this.saveState();
            if (!this.pomodoro.running && this.pomodoro.phase === 'break') {
                this.resetPomodoro();
            }
        });

        // Project Filter & Add
        this.dom.createProjectBtn?.addEventListener('click', () => this.openProjectModal());
        this.dom.projectFilterStatus?.addEventListener('change', () => this.renderProjects());

        // Sessions View
        document.getElementById('openManualSessionModalBtn')?.addEventListener('click', () => this.openManualSessionModal());
        document.getElementById('logManualBtn')?.addEventListener('click', () => this.openManualSessionModal());
        document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportCsv());
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportJsonBackup());

        this.dom.sessionSearchInput?.addEventListener('input', () => this.applySessionFilters());
        this.dom.sessionFilterProject?.addEventListener('change', () => this.applySessionFilters());
        this.dom.sessionFilterPeriod?.addEventListener('change', () => this.applySessionFilters());
        this.dom.sessionFilterBillable?.addEventListener('change', () => this.applySessionFilters());
        this.dom.resetSessionFiltersBtn?.addEventListener('click', () => {
            if (this.dom.sessionSearchInput) this.dom.sessionSearchInput.value = '';
            if (this.dom.sessionFilterProject) this.dom.sessionFilterProject.value = 'all';
            if (this.dom.sessionFilterPeriod) this.dom.sessionFilterPeriod.value = 'all';
            if (this.dom.sessionFilterBillable) this.dom.sessionFilterBillable.value = 'all';
            this.applySessionFilters();
        });

        this.dom.sessionPrevPageBtn?.addEventListener('click', () => {
            if (this.sessionsPagination.page > 1) {
                this.sessionsPagination.page--;
                this.renderSessionsTable();
            }
        });
        this.dom.sessionNextPageBtn?.addEventListener('click', () => {
            const maxPage = Math.ceil(this.sessionsPagination.filtered.length / this.sessionsPagination.perPage) || 1;
            if (this.sessionsPagination.page < maxPage) {
                this.sessionsPagination.page++;
                this.renderSessionsTable();
            }
        });

        // Analytics Period Buttons
        this.dom.periodButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.periodButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = btn.getAttribute('data-period');
                this.renderAnalytics(period);
            });
        });

        // Settings Form
        this.dom.settingsForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.state.settings.dailyGoalHours = parseFloat(this.dom.settingDailyGoalHours.value) || 4;
            this.state.settings.weeklyGoalHours = parseFloat(this.dom.settingWeeklyGoalHours.value) || 25;
            this.state.settings.weekStart = this.dom.settingWeekStart.value;
            this.state.settings.timeFormat = this.dom.settingTimeFormat.value;
            this.state.settings.soundEnabled = this.dom.settingSoundToggle.checked;
            this.state.settings.notificationsEnabled = this.dom.settingNotificationsToggle.checked;
            this.synth.enabled = this.state.settings.soundEnabled;

            if (this.state.settings.notificationsEnabled && 'Notification' in window) {
                Notification.requestPermission();
            }

            this.saveState();
            this.renderDashboard();
            this.showToast('Productivity targets and preferences saved.', 'success');
        });

        this.dom.btnDownloadBackup?.addEventListener('click', () => this.exportJsonBackup());
        this.dom.importBackupInput?.addEventListener('change', (e) => this.handleBackupImport(e));
        this.dom.btnResetAllData?.addEventListener('click', () => {
            this.openConfirmDialog(
                'Reset All Data',
                'Are you sure you want to delete all locally stored sessions, projects, and tasks? This cannot be undone.',
                () => {
                    localStorage.removeItem(StorageManager.STORAGE_KEY);
                    localStorage.removeItem(StorageManager.ACTIVE_SESSION_KEY);
                    this.state = StorageManager.getDefaultState();
                    StorageManager.save(this.state);
                    this.activeSession = null;
                    if (this.timerInterval) clearInterval(this.timerInterval);
                    this.populateProjectSelects();
                    this.renderAll();
                    this.showToast('Workspace reset to clean default state.', 'info');
                }
            );
        });

        // Command Palette Trigger
        document.getElementById('cmdPaletteBtn')?.addEventListener('click', () => this.openCommandPalette());
        this.dom.cmdPaletteInput?.addEventListener('input', () => this.filterCommandPalette());
        this.dom.commandPaletteModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.commandPaletteModal) this.closeCommandPalette();
        });

        // Modal Close Triggers
        document.querySelectorAll('.modal-close-trigger').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Form Submissions
        this.dom.projectForm?.addEventListener('submit', (e) => this.handleProjectFormSubmit(e));
        this.dom.taskForm?.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));
        this.dom.manualSessionForm?.addEventListener('submit', (e) => this.handleManualSessionSubmit(e));
        this.dom.editSessionForm?.addEventListener('submit', (e) => this.handleEditSessionSubmit(e));

        document.getElementById('footerShortcutsBtn')?.addEventListener('click', () => {
            this.navigateTo('about');
        });
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Modal escape handler
            if (e.key === 'Escape') {
                if (this.dom.commandPaletteModal && !this.dom.commandPaletteModal.classList.contains('hidden')) {
                    this.closeCommandPalette();
                    return;
                }
                if (this.dom.focusModeOverlay && !this.dom.focusModeOverlay.classList.contains('hidden')) {
                    this.closeFocusMode();
                    return;
                }
                this.closeAllModals();
                return;
            }

            // Command palette (Ctrl+K / Cmd+K)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.openCommandPalette();
                return;
            }

            // Focus mode (Ctrl+B)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                this.toggleFocusMode();
                return;
            }

            // Stop session (Ctrl+Shift+S)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (this.activeSession) {
                    this.stopAndSaveSession();
                }
                return;
            }

            // Navigation shortcuts (Ctrl+1 .. Ctrl+5)
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                switch (e.key) {
                    case '1': e.preventDefault(); this.navigateTo('dashboard'); return;
                    case '2': e.preventDefault(); this.navigateTo('timer'); return;
                    case '3': e.preventDefault(); this.navigateTo('projects'); return;
                    case '4': e.preventDefault(); this.navigateTo('sessions'); return;
                    case '5': e.preventDefault(); this.navigateTo('reports'); return;
                }
            }

            // Space bar: Start / Pause / Resume timer when outside inputs
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            const isEditing = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
            if (e.code === 'Space' && !isEditing && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (!this.activeSession) {
                    this.startSession();
                } else {
                    this.togglePauseSession();
                }
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = this.dom.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    navigateTo(pageId) {
        this.currentPage = pageId;
        this.dom.pageViews.forEach(view => {
            view.classList.toggle('active', view.id === `${pageId}Page`);
        });
        this.dom.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-page') === pageId);
        });

        if (pageId === 'dashboard') this.renderDashboard();
        if (pageId === 'projects') this.renderProjects();
        if (pageId === 'sessions') this.applySessionFilters();
        if (pageId === 'reports') this.renderAnalytics('week');
        if (pageId === 'settings') this.renderSettings();
    }

    // Time Tracking Engine Logic
    startSession(overrideProjectId = null, overrideTaskTitle = null, overrideTag = null) {
        if (this.activeSession) {
            this.showToast('A session is already running. Pause or stop it first.', 'warning');
            return;
        }

        const projectId = overrideProjectId || this.dom.timerProjectSelect.value;
        const taskSelectVal = this.dom.timerTaskSelect.value;
        const taskTitle = overrideTaskTitle || taskSelectVal || 'General Development';
        const rawTags = overrideTag || this.dom.timerTagsInput.value;
        const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const billable = this.dom.timerBillableCheck.checked;
        const notes = this.dom.timerNotesInput.value.trim();

        const project = this.state.projects.find(p => p.id === projectId);
        const hourlyRate = (project && billable) ? (project.hourlyRate || 0) : 0;

        const now = Date.now();
        this.activeSession = {
            id: `sess_${now}_${Math.random().toString(36).substring(2, 7)}`,
            projectId: projectId,
            taskId: null,
            taskTitle: taskTitle,
            startTime: now,
            paused: false,
            lastPauseTime: null,
            pausedDuration: 0,
            pauses: [],
            tags: tags,
            billable: billable,
            hourlyRate: hourlyRate,
            notes: notes
        };

        StorageManager.saveActiveSession(this.activeSession);
        this.synth.playStart();
        this.startTimerTicker();
        this.updateTimerUIState();
        this.showToast('Session started.', 'success');
    }

    startPresetSession(taskTitle, tag) {
        if (this.activeSession) {
            this.openConfirmDialog(
                'Switch Active Session',
                'An active session is currently running. Do you want to save the current session and start this workflow preset?',
                () => {
                    this.stopAndSaveSession(false);
                    this.startSession(null, taskTitle, tag);
                }
            );
            return;
        }
        this.startSession(null, taskTitle, tag);
    }

    togglePauseSession() {
        if (!this.activeSession) return;
        const now = Date.now();
        if (this.activeSession.paused) {
            // Resume
            const pauseSpan = now - (this.activeSession.lastPauseTime || now);
            this.activeSession.pausedDuration += Math.max(0, pauseSpan);
            this.activeSession.pauses.push({
                start: this.activeSession.lastPauseTime || now,
                end: now
            });
            this.activeSession.paused = false;
            this.activeSession.lastPauseTime = null;
            this.synth.playStart();
            this.showToast('Session resumed.', 'info');
        } else {
            // Pause
            this.activeSession.paused = true;
            this.activeSession.lastPauseTime = now;
            this.synth.playPause();
            this.showToast('Session paused.', 'warning');
        }
        StorageManager.saveActiveSession(this.activeSession);
        this.updateTimerUIState();
    }

    stopAndSaveSession(showConfirm = true) {
        if (!this.activeSession) return;

        const action = () => {
            const now = Date.now();
            let finalPaused = this.activeSession.pausedDuration;
            if (this.activeSession.paused && this.activeSession.lastPauseTime) {
                finalPaused += (now - this.activeSession.lastPauseTime);
            }

            const duration = Math.max(0, now - this.activeSession.startTime - finalPaused);

            // Minimum 3-second threshold to save
            if (duration >= 3000) {
                const hours = duration / 3600000;
                const earned = this.activeSession.billable ? Math.round(hours * this.activeSession.hourlyRate * 100) / 100 : 0;

                const recordedSession = {
                    id: this.activeSession.id,
                    projectId: this.activeSession.projectId,
                    taskId: this.activeSession.taskId,
                    taskTitle: this.activeSession.taskTitle || 'General Coding',
                    startTime: new Date(this.activeSession.startTime).toISOString(),
                    endTime: new Date(now).toISOString(),
                    duration: duration,
                    pausedDuration: finalPaused,
                    pauses: this.activeSession.pauses,
                    tags: this.activeSession.tags,
                    billable: this.activeSession.billable,
                    hourlyRate: this.activeSession.hourlyRate,
                    earned: earned,
                    notes: this.dom.timerNotesInput.value.trim() || this.activeSession.notes || '',
                    createdAt: new Date().toISOString()
                };

                this.state.sessions.unshift(recordedSession);
                this.saveState();
                this.showToast(`Saved session: ${this.formatDuration(duration)}`, 'success');
            } else {
                this.showToast('Session was under 3 seconds; discarded.', 'info');
            }

            this.synth.playStop();
            this.activeSession = null;
            StorageManager.saveActiveSession(null);
            if (this.timerInterval) clearInterval(this.timerInterval);

            if (!this.dom.focusModeOverlay.classList.contains('hidden')) {
                this.closeFocusMode();
            }

            this.updateTimerUIState();
            this.renderAll();
        };

        if (showConfirm) {
            const currentElapsed = this.calcElapsed(this.activeSession);
            this.openConfirmDialog(
                'Complete Session',
                `Stop active session (${this.formatDuration(currentElapsed)}) and save to logs?`,
                action
            );
        } else {
            action();
        }
    }

    calcElapsed(session) {
        if (!session) return 0;
        const now = Date.now();
        const currentPause = session.paused && session.lastPauseTime ? (now - session.lastPauseTime) : 0;
        return Math.max(0, now - session.startTime - session.pausedDuration - currentPause);
    }

    startTimerTicker() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.tick();
        }, 250);
        this.tick();
    }

    tick() {
        if (!this.activeSession) return;
        const elapsed = this.calcElapsed(this.activeSession);
        const formatted = this.formatTimeDigital(elapsed);

        // Update displays
        if (this.dom.dashTimerClock) this.dom.dashTimerClock.textContent = formatted;
        if (this.dom.consoleMainClock) this.dom.consoleMainClock.textContent = formatted;
        if (this.dom.pillTimerDisplay) this.dom.pillTimerDisplay.textContent = formatted;
        if (this.dom.focusClock) this.dom.focusClock.textContent = formatted;

        // Elapsed paused update
        const pausedMs = this.activeSession.pausedDuration +
            (this.activeSession.paused && this.activeSession.lastPauseTime ? (Date.now() - this.activeSession.lastPauseTime) : 0);
        if (this.dom.consolePausedTimeText) this.dom.consolePausedTimeText.textContent = `${Math.floor(pausedMs / 60000)}m`;
    }

    restoreActiveSession() {
        const stored = StorageManager.loadActiveSession();
        if (stored && stored.startTime) {
            this.activeSession = stored;
            if (this.dom.timerProjectSelect) {
                this.dom.timerProjectSelect.value = stored.projectId || '';
            }
            if (this.dom.timerTagsInput) {
                this.dom.timerTagsInput.value = (stored.tags || []).join(', ');
            }
            if (this.dom.timerBillableCheck) {
                this.dom.timerBillableCheck.checked = !!stored.billable;
            }
            if (this.dom.timerNotesInput) {
                this.dom.timerNotesInput.value = stored.notes || '';
            }
            this.startTimerTicker();
            this.updateTimerUIState();
        }
    }

    updateTimerUIState() {
        const isRunning = !!this.activeSession;
        const isPaused = isRunning && this.activeSession.paused;

        // Header Pill
        this.dom.headerTimerPill?.classList.toggle('hidden', !isRunning);
        this.dom.headerTimerPill?.classList.toggle('paused', isPaused);
        if (isRunning) {
            const project = this.state.projects.find(p => p.id === this.activeSession.projectId);
            if (this.dom.pillProjectName) this.dom.pillProjectName.textContent = project ? project.name : (this.activeSession.taskTitle || 'Session');
            if (this.dom.pillPauseBtn) this.dom.pillPauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        }

        // Dashboard Card
        if (this.dom.dashTimerToggleBtn) {
            this.dom.dashTimerToggleBtn.innerHTML = isRunning ?
                (isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-arrow-right"></i> In Progress') :
                '<i class="fas fa-play"></i> Start Tracking';
            this.dom.dashTimerToggleBtn.disabled = isRunning && !isPaused;
        }
        if (this.dom.dashTimerPauseBtn) {
            this.dom.dashTimerPauseBtn.disabled = !isRunning;
            this.dom.dashTimerPauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
        }
        if (this.dom.dashTimerStopBtn) {
            this.dom.dashTimerStopBtn.disabled = !isRunning;
        }

        if (this.dom.dashActiveSessionStatus) {
            this.dom.dashActiveSessionStatus.className = `status-badge ${isRunning ? (isPaused ? 'paused' : 'running') : 'idle'}`;
            this.dom.dashActiveSessionStatus.textContent = isRunning ? (isPaused ? 'Paused' : 'Running') : 'Idle';
        }

        if (isRunning) {
            const proj = this.state.projects.find(p => p.id === this.activeSession.projectId);
            if (this.dom.dashMetaProject) this.dom.dashMetaProject.textContent = proj ? proj.name : 'No project selected';
            if (this.dom.dashMetaTask) this.dom.dashMetaTask.textContent = this.activeSession.taskTitle || 'General development';
        } else {
            if (this.dom.dashMetaProject) this.dom.dashMetaProject.textContent = 'None selected';
            if (this.dom.dashMetaTask) this.dom.dashMetaTask.textContent = 'General development';
            if (this.dom.dashTimerClock) this.dom.dashTimerClock.textContent = '00:00:00';
            if (this.dom.consoleMainClock) this.dom.consoleMainClock.textContent = '00:00:00';
            if (this.dom.pillTimerDisplay) this.dom.pillTimerDisplay.textContent = '00:00:00';
        }

        // Console Buttons
        if (this.dom.consoleStartBtn) this.dom.consoleStartBtn.disabled = isRunning;
        if (this.dom.consolePauseBtn) {
            this.dom.consolePauseBtn.disabled = !isRunning;
            this.dom.consolePauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
        }
        if (this.dom.consoleStopBtn) this.dom.consoleStopBtn.disabled = !isRunning;

        if (this.dom.consoleSessionStatusBadge) {
            this.dom.consoleSessionStatusBadge.className = `status-badge ${isRunning ? (isPaused ? 'paused' : 'running') : 'idle'}`;
            this.dom.consoleSessionStatusBadge.textContent = isRunning ? (isPaused ? 'Paused' : 'Active') : 'Ready';
        }

        if (isRunning) {
            const startTimeDate = new Date(this.activeSession.startTime);
            if (this.dom.consoleStartTimeText) this.dom.consoleStartTimeText.textContent = startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (this.dom.consoleBillableBadge) {
                this.dom.consoleBillableBadge.className = `badge-tag ${this.activeSession.billable ? 'billable' : ''}`;
                this.dom.consoleBillableBadge.textContent = this.activeSession.billable ? 'Billable Work' : 'Non-Billable';
            }

            const proj = this.state.projects.find(p => p.id === this.activeSession.projectId);
            if (this.dom.consoleCategoryBadge) this.dom.consoleCategoryBadge.textContent = proj ? proj.category : 'Development';

            // Focus mode
            if (this.dom.focusProjectPill) this.dom.focusProjectPill.textContent = proj ? proj.name : 'General Work';
            if (this.dom.focusTaskTitle) this.dom.focusTaskTitle.textContent = this.activeSession.taskTitle || 'Focused Coding';
            if (this.dom.focusSubStatus) this.dom.focusSubStatus.textContent = isPaused ? 'Session Paused' : 'Tracking in progress...';
            if (this.dom.focusTogglePauseBtn) this.dom.focusTogglePauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
        } else {
            if (this.dom.consoleStartTimeText) this.dom.consoleStartTimeText.textContent = '--:--';
            if (this.dom.consolePausedTimeText) this.dom.consolePausedTimeText.textContent = '0m';
        }
    }

    syncConsoleMetadataToActiveSession() {
        if (!this.activeSession) return;
        this.activeSession.projectId = this.dom.timerProjectSelect.value;
        const taskVal = this.dom.timerTaskSelect.value;
        if (taskVal) this.activeSession.taskTitle = taskVal;
        const rawTags = this.dom.timerTagsInput.value;
        this.activeSession.tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        this.activeSession.billable = this.dom.timerBillableCheck.checked;
        const project = this.state.projects.find(p => p.id === this.activeSession.projectId);
        this.activeSession.hourlyRate = (project && this.activeSession.billable) ? (project.hourlyRate || 0) : 0;
        this.activeSession.notes = this.dom.timerNotesInput.value.trim();

        StorageManager.saveActiveSession(this.activeSession);
        this.updateTimerUIState();
    }

    // Pomodoro Companion Timer
    togglePomodoro() {
        if (this.pomodoro.running) {
            this.pomodoro.running = false;
            if (this.pomodoro.interval) clearInterval(this.pomodoro.interval);
            this.dom.pomoToggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Interval';
        } else {
            this.pomodoro.running = true;
            this.dom.pomoToggleBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Interval';
            this.pomodoro.interval = setInterval(() => {
                this.pomodoro.timeLeft--;
                if (this.pomodoro.timeLeft <= 0) {
                    this.switchPomodoroPhase();
                }
                this.updatePomodoroDisplay();
            }, 1000);
        }
    }

    resetPomodoro() {
        this.pomodoro.running = false;
        if (this.pomodoro.interval) clearInterval(this.pomodoro.interval);
        this.pomodoro.phase = 'work';
        this.pomodoro.timeLeft = (this.state.settings.pomoWorkMinutes || 25) * 60;
        this.dom.pomoToggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Interval';
        this.updatePomodoroDisplay();
    }

    switchPomodoroPhase() {
        this.synth.playBreakChime();
        if (this.pomodoro.phase === 'work') {
            this.pomodoro.phase = 'break';
            this.pomodoro.timeLeft = (this.state.settings.pomoBreakMinutes || 5) * 60;
            this.showToast('Work interval complete! Take a short stretch.', 'info');
            if (this.state.settings.notificationsEnabled && Notification.permission === 'granted') {
                new Notification('Code Timer Tracker', { body: 'Interval finished! Time for a short break.' });
            }
        } else {
            this.pomodoro.phase = 'work';
            this.pomodoro.timeLeft = (this.state.settings.pomoWorkMinutes || 25) * 60;
            this.showToast('Break finished! Ready to code.', 'success');
            if (this.state.settings.notificationsEnabled && Notification.permission === 'granted') {
                new Notification('Code Timer Tracker', { body: 'Break finished! Resume your coding session.' });
            }
        }
    }

    updatePomodoroDisplay() {
        const mins = Math.floor(this.pomodoro.timeLeft / 60);
        const secs = this.pomodoro.timeLeft % 60;
        if (this.dom.pomoClock) this.dom.pomoClock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (this.dom.pomoPhase) {
            this.dom.pomoPhase.textContent = this.pomodoro.phase === 'work' ? 'Work Interval' : 'Rest Break';
            this.dom.pomoPhase.style.color = this.pomodoro.phase === 'work' ? 'var(--accent-cyan)' : 'var(--accent-amber)';
        }
    }

    // Distraction-Free Focus Mode
    openFocusMode() {
        this.dom.focusModeOverlay.classList.remove('hidden');
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        this.updateTimerUIState();
    }

    closeFocusMode() {
        this.dom.focusModeOverlay.classList.add('hidden');
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    toggleFocusMode() {
        if (this.dom.focusModeOverlay.classList.contains('hidden')) {
            this.openFocusMode();
        } else {
            this.closeFocusMode();
        }
    }

    // Projects & Tasks Logic
    populateProjectSelects() {
        const activeProjects = this.state.projects.filter(p => !p.archived);
        const optionsHtml = activeProjects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');

        this.dom.timerProjectSelect.innerHTML = `<option value="">-- Select Project --</option>${optionsHtml}`;
        this.dom.sessionFilterProject.innerHTML = `<option value="all">All Projects</option>${this.state.projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('')}`;

        const taskProjSelect = document.getElementById('taskProjectSelect');
        if (taskProjSelect) taskProjSelect.innerHTML = optionsHtml;

        const manualProjSelect = document.getElementById('manualProjectSelect');
        if (manualProjSelect) manualProjSelect.innerHTML = optionsHtml;

        const editProjSelect = document.getElementById('editSessionProjectSelect');
        if (editProjSelect) editProjSelect.innerHTML = `<option value="">-- No Project --</option>${optionsHtml}`;

        this.updateTaskSelectOptions();
        this.updateProjectSnapshot();
    }

    updateTaskSelectOptions() {
        const selectedProjId = this.dom.timerProjectSelect.value;
        const projectTasks = this.state.tasks.filter(t => t.projectId === selectedProjId && t.status !== 'done');
        const tasksHtml = projectTasks.map(t => `<option value="${this.escapeHtml(t.title)}">${this.escapeHtml(t.title)} (${t.priority})</option>`).join('');
        this.dom.timerTaskSelect.innerHTML = `<option value="">General Coding (No specific task)</option>${tasksHtml}`;
    }

    updateProjectSnapshot() {
        const selectedProjId = this.dom.timerProjectSelect.value;
        const project = this.state.projects.find(p => p.id === selectedProjId);
        if (!project) {
            this.dom.activeProjectDetailsBody.innerHTML = '<p class="text-muted">Select a project to inspect rates, total tracked time, and open tasks.</p>';
            return;
        }

        const projectSessions = this.state.sessions.filter(s => s.projectId === project.id);
        const totalDuration = projectSessions.reduce((sum, s) => sum + s.duration, 0);
        const billableEarned = projectSessions.filter(s => s.billable).reduce((sum, s) => sum + (s.earned || 0), 0);
        const openTasks = this.state.tasks.filter(t => t.projectId === project.id && t.status !== 'done');

        this.dom.activeProjectDetailsBody.innerHTML = `
            <div class="snapshot-detail-row">
                <span class="text-muted">Category:</span>
                <strong>${this.escapeHtml(project.category || 'General')}</strong>
            </div>
            <div class="snapshot-detail-row">
                <span class="text-muted">Hourly Rate:</span>
                <strong>$${project.hourlyRate || 0}/hr</strong>
            </div>
            <div class="snapshot-detail-row">
                <span class="text-muted">Total Time Logged:</span>
                <strong class="text-primary font-mono">${this.formatDuration(totalDuration)}</strong>
            </div>
            <div class="snapshot-detail-row">
                <span class="text-muted">Total Billable:</span>
                <strong class="text-primary">$${billableEarned.toFixed(2)}</strong>
            </div>
            <div class="snapshot-detail-row">
                <span class="text-muted">Open Tasks:</span>
                <strong>${openTasks.length} pending</strong>
            </div>
        `;
    }

    renderProjects() {
        const filter = this.dom.projectFilterStatus.value;
        let projects = this.state.projects;
        if (filter === 'active') projects = projects.filter(p => !p.archived);
        if (filter === 'archived') projects = projects.filter(p => p.archived);

        if (projects.length === 0) {
            this.dom.projectsContainer.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                    <i class="fas fa-folder-open" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <h3 style="font-size: 16px; margin-bottom: 6px;">No projects found</h3>
                    <p class="text-muted text-sm">Create your first repository or project to organize coding sessions.</p>
                    <button class="btn-primary mt-3" onclick="window.appEngine?.openProjectModal()">
                        <i class="fas fa-plus"></i> New Project
                    </button>
                </div>
            `;
            return;
        }

        this.dom.projectsContainer.innerHTML = projects.map(proj => {
            const projectSessions = this.state.sessions.filter(s => s.projectId === proj.id);
            const totalDuration = projectSessions.reduce((sum, s) => sum + s.duration, 0);
            const billableDuration = projectSessions.filter(s => s.billable).reduce((sum, s) => sum + s.duration, 0);
            const tasks = this.state.tasks.filter(t => t.projectId === proj.id);
            const doneTasks = tasks.filter(t => t.status === 'done');

            const techChips = (proj.techStack || []).map(t => `<span class="tech-chip">${this.escapeHtml(t)}</span>`).join('');

            const tasksListHtml = tasks.length === 0 ?
                '<div class="text-muted text-sm" style="padding: 6px 0;">No tasks yet</div>' :
                tasks.map(t => `
                    <div class="task-item-row">
                        <span class="task-priority-dot ${t.priority || 'medium'}" title="Priority: ${t.priority}"></span>
                        <span class="task-item-title ${t.status === 'done' ? 'done' : ''}">${this.escapeHtml(t.title)}</span>
                        <button class="btn-ghost btn-sm" onclick="window.appEngine?.trackTask('${proj.id}', '${this.escapeHtml(t.title)}')" title="Start timer on this task">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon-subtle" onclick="window.appEngine?.toggleTaskDone('${t.id}')" title="Toggle status">
                            <i class="fas ${t.status === 'done' ? 'fa-check-circle text-primary' : 'fa-circle'}"></i>
                        </button>
                    </div>
                `).join('');

            return `
                <div class="project-card-item">
                    <div class="project-card-top" style="border-left-color: ${proj.color || '#10b981'}">
                        <div class="project-card-header">
                            <h3 class="project-card-title">${this.escapeHtml(proj.name)}</h3>
                            <span class="project-card-category">${this.escapeHtml(proj.category || 'General')}</span>
                        </div>
                        <p class="project-card-desc">${this.escapeHtml(proj.description || 'No description provided.')}</p>
                        <div class="tech-stack-row">${techChips}</div>
                        <div class="project-stats-bar">
                            <div class="pstat-item">
                                <div class="pstat-val">${this.formatDuration(totalDuration)}</div>
                                <div class="pstat-label">Total Time</div>
                            </div>
                            <div class="pstat-item">
                                <div class="pstat-val">${this.formatDuration(billableDuration)}</div>
                                <div class="pstat-label">Billable</div>
                            </div>
                            <div class="pstat-item">
                                <div class="pstat-val">${doneTasks.length}/${tasks.length}</div>
                                <div class="pstat-label">Tasks Done</div>
                            </div>
                        </div>
                    </div>
                    <div class="project-tasks-section">
                        <div class="project-tasks-header">
                            <span>Tasks (${tasks.length})</span>
                            <button class="btn-text btn-sm" onclick="window.appEngine?.openTaskModal(null, '${proj.id}')">
                                <i class="fas fa-plus"></i> Add Task
                            </button>
                        </div>
                        <div class="tasks-list-mini">${tasksListHtml}</div>
                    </div>
                    <div class="project-card-footer">
                        <div class="btn-group-row">
                            <button class="btn-primary btn-sm" onclick="window.appEngine?.trackProject('${proj.id}')">
                                <i class="fas fa-play"></i> Track
                            </button>
                            <button class="btn-ghost btn-sm" onclick="window.appEngine?.openProjectModal('${proj.id}')">
                                <i class="fas fa-pencil"></i>
                            </button>
                            <button class="btn-ghost btn-sm" onclick="window.appEngine?.toggleArchiveProject('${proj.id}')" title="${proj.archived ? 'Unarchive' : 'Archive'}">
                                <i class="fas ${proj.archived ? 'fa-box-open' : 'fa-box-archive'}"></i>
                            </button>
                            <button class="btn-danger-outline btn-sm" onclick="window.appEngine?.deleteProject('${proj.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <span class="text-muted text-sm font-mono">$${proj.hourlyRate || 0}/h</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    trackProject(projectId) {
        if (this.activeSession) {
            this.openConfirmDialog(
                'Switch Session',
                'Save current active session and track this project?',
                () => {
                    this.stopAndSaveSession(false);
                    this.dom.timerProjectSelect.value = projectId;
                    this.updateTaskSelectOptions();
                    this.startSession(projectId);
                    this.navigateTo('timer');
                }
            );
            return;
        }
        this.dom.timerProjectSelect.value = projectId;
        this.updateTaskSelectOptions();
        this.startSession(projectId);
        this.navigateTo('timer');
    }

    trackTask(projectId, taskTitle) {
        if (this.activeSession) {
            this.openConfirmDialog(
                'Switch Session',
                'Save current active session and track this task?',
                () => {
                    this.stopAndSaveSession(false);
                    this.dom.timerProjectSelect.value = projectId;
                    this.updateTaskSelectOptions();
                    this.startSession(projectId, taskTitle);
                    this.navigateTo('timer');
                }
            );
            return;
        }
        this.dom.timerProjectSelect.value = projectId;
        this.updateTaskSelectOptions();
        this.startSession(projectId, taskTitle);
        this.navigateTo('timer');
    }

    toggleTaskDone(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;
        task.status = task.status === 'done' ? 'todo' : 'done';
        task.updatedAt = new Date().toISOString();
        this.saveState();
        this.renderProjects();
        this.updateTaskSelectOptions();
    }

    toggleArchiveProject(projectId) {
        const proj = this.state.projects.find(p => p.id === projectId);
        if (!proj) return;
        proj.archived = !proj.archived;
        this.saveState();
        this.populateProjectSelects();
        this.renderProjects();
        this.showToast(`Project ${proj.archived ? 'archived' : 'restored'}.`, 'info');
    }

    deleteProject(projectId) {
        const proj = this.state.projects.find(p => p.id === projectId);
        if (!proj) return;
        this.openConfirmDialog(
            'Delete Project',
            `Delete "${proj.name}"? Historical sessions will remain in your log.`,
            () => {
                this.state.projects = this.state.projects.filter(p => p.id !== projectId);
                this.state.tasks = this.state.tasks.filter(t => t.projectId !== projectId);
                this.saveState();
                this.populateProjectSelects();
                this.renderProjects();
                this.showToast('Project deleted.', 'info');
            }
        );
    }

    openProjectModal(editId = null) {
        const modal = this.dom.projectModal;
        const titleEl = document.getElementById('projectModalTitle');
        const idInput = document.getElementById('editProjectId');
        const nameInput = document.getElementById('projectNameInput');
        const descInput = document.getElementById('projectDescInput');
        const catSelect = document.getElementById('projectCategorySelect');
        const colorInput = document.getElementById('projectColorInput');
        const rateInput = document.getElementById('projectRateInput');
        const estInput = document.getElementById('projectEstimateInput');
        const techInput = document.getElementById('projectTechStackInput');

        if (editId) {
            const proj = this.state.projects.find(p => p.id === editId);
            if (!proj) return;
            titleEl.textContent = 'Edit Project';
            idInput.value = proj.id;
            nameInput.value = proj.name;
            descInput.value = proj.description || '';
            catSelect.value = proj.category || 'General';
            colorInput.value = proj.color || '#10b981';
            rateInput.value = proj.hourlyRate || '';
            estInput.value = proj.estimatedHours || '';
            techInput.value = (proj.techStack || []).join(', ');
        } else {
            titleEl.textContent = 'New Project';
            idInput.value = '';
            this.dom.projectForm.reset();
            colorInput.value = '#10b981';
        }
        modal.classList.remove('hidden');
        nameInput.focus();
    }

    handleProjectFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('editProjectId').value;
        const name = document.getElementById('projectNameInput').value.trim();
        const desc = document.getElementById('projectDescInput').value.trim();
        const cat = document.getElementById('projectCategorySelect').value;
        const color = document.getElementById('projectColorInput').value;
        const rate = parseFloat(document.getElementById('projectRateInput').value) || 0;
        const est = parseFloat(document.getElementById('projectEstimateInput').value) || 0;
        const rawTech = document.getElementById('projectTechStackInput').value;
        const techStack = rawTech ? rawTech.split(',').map(t => t.trim()).filter(Boolean) : [];

        if (id) {
            const proj = this.state.projects.find(p => p.id === id);
            if (proj) {
                proj.name = name;
                proj.description = desc;
                proj.category = cat;
                proj.color = color;
                proj.hourlyRate = rate;
                proj.estimatedHours = est;
                proj.techStack = techStack;
                proj.updatedAt = new Date().toISOString();
            }
        } else {
            const newProj = {
                id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: name,
                description: desc,
                category: cat,
                color: color,
                hourlyRate: rate,
                estimatedHours: est,
                techStack: techStack,
                archived: false,
                createdAt: new Date().toISOString()
            };
            this.state.projects.push(newProj);
        }

        this.saveState();
        this.populateProjectSelects();
        this.renderProjects();
        this.closeAllModals();
        this.showToast('Project saved successfully.', 'success');
    }

    openTaskModal(editId = null, defaultProjectId = null) {
        const modal = this.dom.taskModal;
        const titleEl = document.getElementById('taskModalTitle');
        const idInput = document.getElementById('editTaskId');
        const projSelect = document.getElementById('taskProjectSelect');
        const titleInput = document.getElementById('taskTitleInput');
        const prioSelect = document.getElementById('taskPrioritySelect');
        const statusSelect = document.getElementById('taskStatusSelect');
        const estInput = document.getElementById('taskEstimatedMins');
        const deadInput = document.getElementById('taskDeadlineInput');

        if (editId) {
            const task = this.state.tasks.find(t => t.id === editId);
            if (!task) return;
            titleEl.textContent = 'Edit Task';
            idInput.value = task.id;
            projSelect.value = task.projectId;
            titleInput.value = task.title;
            prioSelect.value = task.priority || 'medium';
            statusSelect.value = task.status || 'todo';
            estInput.value = task.estimatedMinutes || '';
            deadInput.value = task.deadline || '';
        } else {
            titleEl.textContent = 'New Task';
            idInput.value = '';
            this.dom.taskForm.reset();
            if (defaultProjectId) projSelect.value = defaultProjectId;
        }

        modal.classList.remove('hidden');
        titleInput.focus();
    }

    handleTaskFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('editTaskId').value;
        const projId = document.getElementById('taskProjectSelect').value;
        const title = document.getElementById('taskTitleInput').value.trim();
        const prio = document.getElementById('taskPrioritySelect').value;
        const status = document.getElementById('taskStatusSelect').value;
        const est = parseInt(document.getElementById('taskEstimatedMins').value) || 0;
        const deadline = document.getElementById('taskDeadlineInput').value;

        if (id) {
            const task = this.state.tasks.find(t => t.id === id);
            if (task) {
                task.projectId = projId;
                task.title = title;
                task.priority = prio;
                task.status = status;
                task.estimatedMinutes = est;
                task.deadline = deadline;
                task.updatedAt = new Date().toISOString();
            }
        } else {
            const newTask = {
                id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                projectId: projId,
                title: title,
                priority: prio,
                status: status,
                estimatedMinutes: est,
                deadline: deadline,
                createdAt: new Date().toISOString()
            };
            this.state.tasks.push(newTask);
        }

        this.saveState();
        this.renderProjects();
        this.updateTaskSelectOptions();
        this.closeAllModals();
        this.showToast('Task saved successfully.', 'success');
    }

    // Manual Session & Edit Sessions
    openManualSessionModal() {
        this.dom.manualSessionForm.reset();
        document.getElementById('manualDateInput').value = new Date().toISOString().split('T')[0];
        this.dom.manualSessionModal.classList.remove('hidden');
    }

    handleManualSessionSubmit(e) {
        e.preventDefault();
        const projId = document.getElementById('manualProjectSelect').value;
        const taskTitle = document.getElementById('manualTaskInput').value.trim() || 'General Work';
        const dateStr = document.getElementById('manualDateInput').value;
        const durationMins = parseInt(document.getElementById('manualDurationMins').value) || 0;
        const rawTags = document.getElementById('manualTagsInput').value;
        const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const billable = document.getElementById('manualBillableCheck').checked;
        const notes = document.getElementById('manualNotesInput').value.trim();

        if (durationMins <= 0) {
            this.showToast('Duration must be greater than 0 minutes.', 'error');
            return;
        }

        const project = this.state.projects.find(p => p.id === projId);
        const hourlyRate = (project && billable) ? (project.hourlyRate || 0) : 0;
        const durationMs = durationMins * 60000;
        const hours = durationMs / 3600000;
        const earned = billable ? Math.round(hours * hourlyRate * 100) / 100 : 0;

        const startTime = new Date(`${dateStr}T09:00:00`).toISOString();
        const endTime = new Date(new Date(startTime).getTime() + durationMs).toISOString();

        const session = {
            id: `sess_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: projId,
            taskId: null,
            taskTitle: taskTitle,
            startTime: startTime,
            endTime: endTime,
            duration: durationMs,
            pausedDuration: 0,
            pauses: [],
            tags: tags,
            billable: billable,
            hourlyRate: hourlyRate,
            earned: earned,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        this.state.sessions.unshift(session);
        this.saveState();
        this.closeAllModals();
        this.renderAll();
        this.showToast('Past session recorded successfully.', 'success');
    }

    openEditSessionModal(sessionId) {
        const sess = this.state.sessions.find(s => s.id === sessionId);
        if (!sess) return;

        document.getElementById('editSessionId').value = sess.id;
        document.getElementById('editSessionProjectSelect').value = sess.projectId || '';
        document.getElementById('editSessionTaskInput').value = sess.taskTitle || '';
        document.getElementById('editSessionDurationMins').value = Math.round(sess.duration / 60000);
        document.getElementById('editSessionBillableCheck').checked = !!sess.billable;
        document.getElementById('editSessionTagsInput').value = (sess.tags || []).join(', ');
        document.getElementById('editSessionNotesInput').value = sess.notes || '';

        this.dom.editSessionModal.classList.remove('hidden');
    }

    handleEditSessionSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('editSessionId').value;
        const sess = this.state.sessions.find(s => s.id === id);
        if (!sess) return;

        const projId = document.getElementById('editSessionProjectSelect').value;
        const taskTitle = document.getElementById('editSessionTaskInput').value.trim() || 'General Work';
        const durationMins = parseInt(document.getElementById('editSessionDurationMins').value) || 1;
        const billable = document.getElementById('editSessionBillableCheck').checked;
        const rawTags = document.getElementById('editSessionTagsInput').value;
        const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const notes = document.getElementById('editSessionNotesInput').value.trim();

        const project = this.state.projects.find(p => p.id === projId);
        const durationMs = durationMins * 60000;
        const hourlyRate = (project && billable) ? (project.hourlyRate || 0) : 0;
        const hours = durationMs / 3600000;
        const earned = billable ? Math.round(hours * hourlyRate * 100) / 100 : 0;

        sess.projectId = projId;
        sess.taskTitle = taskTitle;
        sess.duration = durationMs;
        sess.billable = billable;
        sess.hourlyRate = hourlyRate;
        sess.earned = earned;
        sess.tags = tags;
        sess.notes = notes;

        // Recalculate end time preserving start time
        const startMs = new Date(sess.startTime).getTime();
        sess.endTime = new Date(startMs + durationMs).toISOString();

        this.saveState();
        this.closeAllModals();
        this.renderAll();
        this.showToast('Session record updated.', 'success');
    }

    deleteSession(sessionId) {
        this.openConfirmDialog(
            'Delete Session',
            'Are you sure you want to delete this recorded session? This cannot be undone.',
            () => {
                this.state.sessions = this.state.sessions.filter(s => s.id !== sessionId);
                this.saveState();
                this.renderAll();
                this.showToast('Session record deleted.', 'info');
            }
        );
    }

    // Sessions View Filter & Render
    applySessionFilters() {
        const searchQuery = this.dom.sessionSearchInput.value.toLowerCase().trim();
        const projFilter = this.dom.sessionFilterProject.value;
        const periodFilter = this.dom.sessionFilterPeriod.value;
        const billFilter = this.dom.sessionFilterBillable.value;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const startOfWeek = this.getStartOfWeek(now, this.state.settings.weekStart);
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(startOfWeek.getDate() - 1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        this.sessionsPagination.filtered = this.state.sessions.filter(s => {
            // Search query
            if (searchQuery) {
                const proj = this.state.projects.find(p => p.id === s.projectId);
                const projName = proj ? proj.name.toLowerCase() : '';
                const taskName = (s.taskTitle || '').toLowerCase();
                const notes = (s.notes || '').toLowerCase();
                const tags = (s.tags || []).join(' ').toLowerCase();
                const matches = projName.includes(searchQuery) || taskName.includes(searchQuery) || notes.includes(searchQuery) || tags.includes(searchQuery);
                if (!matches) return false;
            }

            // Project filter
            if (projFilter !== 'all' && s.projectId !== projFilter) {
                return false;
            }

            // Billable filter
            if (billFilter === 'billable' && !s.billable) return false;
            if (billFilter === 'non_billable' && s.billable) return false;

            // Period filter
            const sessDate = new Date(s.startTime);
            const sessDateStr = s.startTime.split('T')[0];

            if (periodFilter === 'today' && sessDateStr !== todayStr) return false;
            if (periodFilter === 'yesterday' && sessDateStr !== yesterdayStr) return false;
            if (periodFilter === 'this_week' && sessDate < startOfWeek) return false;
            if (periodFilter === 'last_week' && (sessDate < startOfLastWeek || sessDate > endOfLastWeek)) return false;
            if (periodFilter === 'this_month' && sessDate < startOfMonth) return false;

            return true;
        });

        this.sessionsPagination.page = 1;
        this.renderSessionsTable();
    }

    renderSessionsTable() {
        const { page, perPage, filtered } = this.sessionsPagination;
        const total = filtered.length;
        const maxPage = Math.ceil(total / perPage) || 1;
        const startIdx = (page - 1) * perPage;
        const pagedSessions = filtered.slice(startIdx, startIdx + perPage);

        this.dom.sessionTableCount.textContent = `Showing ${Math.min(startIdx + 1, total)}-${Math.min(startIdx + perPage, total)} of ${total} sessions`;
        this.dom.sessionCurrentPageText.textContent = `Page ${page} of ${maxPage}`;
        this.dom.sessionPrevPageBtn.disabled = page <= 1;
        this.dom.sessionNextPageBtn.disabled = page >= maxPage;

        if (pagedSessions.length === 0) {
            this.dom.sessionsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-list-check" style="font-size: 28px; margin-bottom: 8px; display: block;"></i>
                        No recorded sessions matching your filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        this.dom.sessionsTableBody.innerHTML = pagedSessions.map(s => {
            const project = this.state.projects.find(p => p.id === s.projectId);
            const projectName = project ? project.name : '<span class="text-muted">No Project</span>';
            const projectColor = project ? project.color : '#64748b';

            const startObj = new Date(s.startTime);
            const dateStr = startObj.toLocaleDateString();
            const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const tagsHtml = (s.tags || []).map(t => `<span class="tech-chip">${this.escapeHtml(t)}</span>`).join('');
            const billableBadge = s.billable ?
                `<span class="badge-tag billable">$${(s.earned || 0).toFixed(2)}</span>` :
                '<span class="badge-tag">No</span>';

            return `
                <tr>
                    <td>
                        <div class="table-timestamp">${dateStr}</div>
                        <div class="text-muted text-sm">${timeStr}</div>
                    </td>
                    <td>
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${projectColor}; margin-right: 6px;"></span>
                        <strong>${projectName}</strong>
                    </td>
                    <td>${this.escapeHtml(s.taskTitle || 'General Coding')}</td>
                    <td class="table-duration">${this.formatDuration(s.duration)}</td>
                    <td>${tagsHtml}</td>
                    <td>${billableBadge}</td>
                    <td>
                        <div class="table-notes-preview" title="${this.escapeHtml(s.notes || '')}">
                            ${this.escapeHtml(s.notes || '--')}
                        </div>
                    </td>
                    <td class="text-right">
                        <button class="btn-ghost btn-sm" onclick="window.appEngine?.openEditSessionModal('${s.id}')" title="Edit">
                            <i class="fas fa-pencil"></i>
                        </button>
                        <button class="btn-ghost btn-sm text-danger" onclick="window.appEngine?.deleteSession('${s.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Dashboard Overview Rendering
    renderDashboard() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const startOfWeek = this.getStartOfWeek(now, this.state.settings.weekStart);

        const todaySessions = this.state.sessions.filter(s => s.startTime.split('T')[0] === todayStr);
        const weekSessions = this.state.sessions.filter(s => new Date(s.startTime) >= startOfWeek);

        const todayDuration = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        const weekDuration = weekSessions.reduce((sum, s) => sum + s.duration, 0);

        const dailyGoalMs = (this.state.settings.dailyGoalHours || 4) * 3600000;
        const weeklyGoalMs = (this.state.settings.weeklyGoalHours || 25) * 3600000;

        const todayPercent = Math.min(100, Math.round((todayDuration / dailyGoalMs) * 100));
        const weekPercent = Math.min(100, Math.round((weekDuration / weeklyGoalMs) * 100));

        if (this.dom.dashTodayTime) this.dom.dashTodayTime.textContent = this.formatDuration(todayDuration);
        if (this.dom.todayProgressBadge) this.dom.todayProgressBadge.textContent = `${todayPercent}% Goal`;
        if (this.dom.dailyGoalProgress) this.dom.dailyGoalProgress.style.width = `${todayPercent}%`;
        if (this.dom.dailyGoalText) this.dom.dailyGoalText.textContent = `Goal: ${this.state.settings.dailyGoalHours}h 0m`;

        if (this.dom.dashWeekTime) this.dom.dashWeekTime.textContent = this.formatDuration(weekDuration);
        if (this.dom.weekProgressBadge) this.dom.weekProgressBadge.textContent = `${weekPercent}% Goal`;
        if (this.dom.weeklyGoalProgress) this.dom.weeklyGoalProgress.style.width = `${weekPercent}%`;
        if (this.dom.weeklyGoalText) this.dom.weeklyGoalText.textContent = `Goal: ${this.state.settings.weeklyGoalHours}h 0m`;

        // Billable Stats (All Time)
        const totalBillableDuration = this.state.sessions.filter(s => s.billable).reduce((sum, s) => sum + s.duration, 0);
        const totalBillableEarned = this.state.sessions.filter(s => s.billable).reduce((sum, s) => sum + (s.earned || 0), 0);
        if (this.dom.dashBillableAmount) this.dom.dashBillableAmount.textContent = `$${totalBillableEarned.toFixed(2)}`;
        if (this.dom.dashBillableTime) this.dom.dashBillableTime.textContent = `${this.formatDuration(totalBillableDuration)} billable tracked`;

        // Streak & Active Projects
        const streak = this.calcActiveDayStreak();
        if (this.dom.dashActiveStreak) this.dom.dashActiveStreak.textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
        const activeProjectsCount = this.state.projects.filter(p => !p.archived).length;
        if (this.dom.dashActiveProjectsCount) this.dom.dashActiveProjectsCount.textContent = `${activeProjectsCount} Active Projects`;

        // Dashboard Recent Sessions (Last 5)
        const recents = this.state.sessions.slice(0, 5);
        if (recents.length === 0) {
            if (this.dom.dashRecentSessionsList) this.dom.dashRecentSessionsList.innerHTML = '<div class="text-muted text-sm" style="text-align: center; padding: 20px;">No sessions logged yet.</div>';
        } else {
            if (this.dom.dashRecentSessionsList) {
                this.dom.dashRecentSessionsList.innerHTML = recents.map(s => {
                    const proj = this.state.projects.find(p => p.id === s.projectId);
                    return `
                        <div class="recent-session-row">
                            <div class="recent-session-info">
                                <span class="recent-session-proj">${this.escapeHtml(proj ? proj.name : 'No Project')}</span>
                                <span class="recent-session-task">${this.escapeHtml(s.taskTitle || 'Coding')}</span>
                            </div>
                            <span class="recent-session-duration">${this.formatDuration(s.duration)}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // Dashboard Today's Projects Chart
        this.renderDashProjectsChart(todaySessions);
    }

    renderDashProjectsChart(todaySessions) {
        const ctx = document.getElementById('dashProjectsChart');
        if (!ctx) return;

        if (this.charts.dashProjects) {
            this.charts.dashProjects.destroy();
            this.charts.dashProjects = null;
        }

        if (todaySessions.length === 0) {
            if (this.dom.dashProjectsEmpty) this.dom.dashProjectsEmpty.style.display = 'flex';
            ctx.style.display = 'none';
            return;
        }

        if (typeof Chart === 'undefined') return;

        if (this.dom.dashProjectsEmpty) this.dom.dashProjectsEmpty.style.display = 'none';
        ctx.style.display = 'block';

        const projTimeMap = {};
        const projColorMap = {};

        todaySessions.forEach(s => {
            const proj = this.state.projects.find(p => p.id === s.projectId);
            const name = proj ? proj.name : 'Other / General';
            projTimeMap[name] = (projTimeMap[name] || 0) + s.duration;
            projColorMap[name] = proj ? proj.color : '#64748b';
        });

        const labels = Object.keys(projTimeMap);
        const dataHours = labels.map(l => (projTimeMap[l] / 3600000).toFixed(2));
        const colors = labels.map(l => projColorMap[l]);

        this.charts.dashProjects = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataHours,
                    backgroundColor: colors,
                    borderColor: 'var(--bg-card)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: 'var(--text-secondary)' } },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${context.raw}h`
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }

    // Analytics View: All 4 Real Data Charts
    renderAnalytics(period = 'week') {
        const now = new Date();
        let periodStart = new Date(0); // all time fallback

        if (period === 'week') {
            periodStart = this.getStartOfWeek(now, this.state.settings.weekStart);
        } else if (period === 'month') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === '30days') {
            periodStart = new Date(now.getTime() - (30 * 24 * 3600000));
        }

        const filteredSessions = this.state.sessions.filter(s => new Date(s.startTime) >= periodStart);

        const totalMs = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
        const billableMs = filteredSessions.filter(s => s.billable).reduce((sum, s) => sum + s.duration, 0);
        const billableEarned = filteredSessions.filter(s => s.billable).reduce((sum, s) => sum + (s.earned || 0), 0);
        const avgSessionMs = filteredSessions.length > 0 ? Math.round(totalMs / filteredSessions.length) : 0;

        // Top active project
        const projectTotals = {};
        filteredSessions.forEach(s => {
            projectTotals[s.projectId] = (projectTotals[s.projectId] || 0) + s.duration;
        });

        let topProjId = null;
        let topProjDuration = 0;
        Object.entries(projectTotals).forEach(([pId, dur]) => {
            if (dur > topProjDuration) {
                topProjDuration = dur;
                topProjId = pId;
            }
        });

        const topProjectObj = this.state.projects.find(p => p.id === topProjId);

        this.dom.analyticsTotalTime.textContent = this.formatDuration(totalMs);
        this.dom.analyticsAvgSession.textContent = this.formatDuration(avgSessionMs);
        this.dom.analyticsTotalSessionsCount.textContent = `${filteredSessions.length} total sessions`;
        this.dom.analyticsBillableEarned.textContent = `$${billableEarned.toFixed(2)}`;
        this.dom.analyticsBillableHours.textContent = `${this.formatDuration(billableMs)} billable`;
        this.dom.analyticsTopProject.textContent = topProjectObj ? topProjectObj.name : (filteredSessions.length ? 'General Work' : '--');
        this.dom.analyticsTopProjectHours.textContent = `${this.formatDuration(topProjDuration)} logged`;

        // Render the 4 Chart.js charts
        this.renderChartProjectsDistribution(filteredSessions);
        this.renderChartDailyVolume(filteredSessions, period);
        this.renderChartCumulativeTrend(filteredSessions, period);
        this.renderChartCategoryBreakdown(filteredSessions);
    }

    renderChartProjectsDistribution(sessions) {
        const ctx = document.getElementById('chartProjectsDistribution');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.projectsDistribution) this.charts.projectsDistribution.destroy();

        const map = {};
        const colors = {};
        sessions.forEach(s => {
            const p = this.state.projects.find(proj => proj.id === s.projectId);
            const name = p ? p.name : 'Unassigned';
            map[name] = (map[name] || 0) + s.duration;
            colors[name] = p ? p.color : '#64748b';
        });

        const labels = Object.keys(map);
        const data = labels.map(l => (map[l] / 3600000).toFixed(2));

        this.charts.projectsDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    data: data.length ? data : [0],
                    backgroundColor: labels.length ? labels.map(l => colors[l]) : ['#334155'],
                    borderColor: 'var(--bg-card)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: 'var(--text-secondary)' } }
                },
                cutout: '60%'
            }
        });
    }

    renderChartDailyVolume(sessions, period) {
        const ctx = document.getElementById('chartDailyVolume');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.dailyVolume) this.charts.dailyVolume.destroy();

        // Group into days
        const daysMap = {};
        const daysCount = period === 'week' ? 7 : (period === 'month' ? 30 : 14);
        const now = new Date();

        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split('T')[0];
            daysMap[key] = 0;
        }

        sessions.forEach(s => {
            const dayKey = s.startTime.split('T')[0];
            if (daysMap[dayKey] !== undefined) {
                daysMap[dayKey] += s.duration / 3600000;
            }
        });

        const labels = Object.keys(daysMap).map(d => {
            const parts = d.split('-');
            return `${parts[1]}/${parts[2]}`;
        });
        const values = Object.values(daysMap).map(v => v.toFixed(2));

        this.charts.dailyVolume = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Hours',
                    data: values,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: 'var(--accent-primary)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { color: 'var(--border-subtle)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    renderChartCumulativeTrend(sessions, period) {
        const ctx = document.getElementById('chartCumulativeTrend');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.cumulativeTrend) this.charts.cumulativeTrend.destroy();

        const sorted = [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        const cumulativeMap = {};
        let runningTotal = 0;

        sorted.forEach(s => {
            const day = s.startTime.split('T')[0];
            runningTotal += s.duration / 3600000;
            cumulativeMap[day] = runningTotal;
        });

        const labels = Object.keys(cumulativeMap).map(d => {
            const parts = d.split('-');
            return `${parts[1]}/${parts[2]}`;
        });
        const values = Object.values(cumulativeMap).map(v => v.toFixed(2));

        this.charts.cumulativeTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Cumulative Hours',
                    data: values.length ? values : [0],
                    borderColor: 'var(--accent-cyan)',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { color: 'var(--border-subtle)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    renderChartCategoryBreakdown(sessions) {
        const ctx = document.getElementById('chartCategoryBreakdown');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.categoryBreakdown) this.charts.categoryBreakdown.destroy();

        const catMap = {};
        sessions.forEach(s => {
            const proj = this.state.projects.find(p => p.id === s.projectId);
            const cat = proj ? (proj.category || 'General') : 'General';
            catMap[cat] = (catMap[cat] || 0) + (s.duration / 3600000);
        });

        const labels = Object.keys(catMap);
        const data = labels.map(l => catMap[l].toFixed(2));

        this.charts.categoryBreakdown = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    axis: 'y',
                    label: 'Hours',
                    data: data.length ? data : [0],
                    backgroundColor: 'rgba(59, 130, 246, 0.75)',
                    borderColor: 'var(--accent-blue)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { color: 'var(--border-subtle)' }
                    },
                    y: {
                        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Settings View
    renderSettings() {
        if (this.dom.settingDailyGoalHours) this.dom.settingDailyGoalHours.value = this.state.settings.dailyGoalHours || 4;
        if (this.dom.settingWeeklyGoalHours) this.dom.settingWeeklyGoalHours.value = this.state.settings.weeklyGoalHours || 25;
        if (this.dom.settingWeekStart) this.dom.settingWeekStart.value = this.state.settings.weekStart || 'sunday';
        if (this.dom.settingTimeFormat) this.dom.settingTimeFormat.value = this.state.settings.timeFormat || '24h';
        if (this.dom.settingSoundToggle) this.dom.settingSoundToggle.checked = !!this.state.settings.soundEnabled;
        if (this.dom.settingNotificationsToggle) this.dom.settingNotificationsToggle.checked = !!this.state.settings.notificationsEnabled;

        if (this.dom.storageSessionsCount) this.dom.storageSessionsCount.textContent = `${this.state.sessions.length} sessions`;
        if (this.dom.storageProjectsCount) this.dom.storageProjectsCount.textContent = `${this.state.projects.length} projects (${this.state.tasks.length} tasks)`;
    }

    // Export & Backup
    exportCsv() {
        if (this.state.sessions.length === 0) {
            this.showToast('No recorded sessions to export.', 'warning');
            return;
        }

        const headers = [
            'Session_ID', 'Date', 'Start_Time', 'End_Time',
            'Duration_Minutes', 'Duration_Hours', 'Duration_Formatted',
            'Project_Name', 'Project_Category', 'Task_Title',
            'Tags', 'Billable', 'Hourly_Rate_USD', 'Total_Earned_USD', 'Notes'
        ];

        const escapeCell = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val);
            if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return `"${str}"`;
        };

        const rows = this.state.sessions.map(s => {
            const proj = this.state.projects.find(p => p.id === s.projectId);
            const projName = proj ? proj.name : '';
            const projCat = proj ? (proj.category || '') : '';
            const durationMins = Math.round(s.duration / 60000);
            const durationHours = (s.duration / 3600000).toFixed(2);
            const durationFmt = this.formatDuration(s.duration);
            const dateStr = s.startTime.split('T')[0];
            const tagsStr = (s.tags || []).join(', ');

            return [
                escapeCell(s.id),
                escapeCell(dateStr),
                escapeCell(s.startTime),
                escapeCell(s.endTime),
                escapeCell(durationMins),
                escapeCell(durationHours),
                escapeCell(durationFmt),
                escapeCell(projName),
                escapeCell(projCat),
                escapeCell(s.taskTitle),
                escapeCell(tagsStr),
                escapeCell(s.billable ? 'YES' : 'NO'),
                escapeCell(s.hourlyRate || 0),
                escapeCell((s.earned || 0).toFixed(2)),
                escapeCell(s.notes || '')
            ].join(',');
        });

        // Add UTF-8 BOM so Excel opens Arabic and special symbols properly
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-timer-sessions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('CSV export downloaded.', 'success');
    }

    exportJsonBackup() {
        const backupData = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            author: 'Mohammad Abu Khashreef',
            organization: 'Code Elta6ur',
            projects: this.state.projects,
            tasks: this.state.tasks,
            sessions: this.state.sessions,
            settings: this.state.settings
        };

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('JSON backup exported.', 'success');
    }

    handleBackupImport(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.projects) || !Array.isArray(parsed.sessions)) {
                    throw new Error('Invalid schema: Missing projects or sessions array.');
                }

                this.openConfirmDialog(
                    'Restore JSON Backup',
                    `Found ${parsed.projects.length} projects and ${parsed.sessions.length} sessions. Replace current workspace data with this backup?`,
                    () => {
                        this.state = StorageManager.normalizeState(parsed);
                        this.saveState();
                        this.populateProjectSelects();
                        this.renderAll();
                        this.showToast('Backup restored successfully!', 'success');
                    }
                );
            } catch (err) {
                this.showToast(`Import error: ${err.message}`, 'danger');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // Command Palette (Ctrl+K)
    openCommandPalette() {
        this.dom.commandPaletteModal.classList.remove('hidden');
        this.dom.cmdPaletteInput.value = '';
        this.filterCommandPalette();
        this.dom.cmdPaletteInput.focus();
    }

    closeCommandPalette() {
        this.dom.commandPaletteModal.classList.add('hidden');
    }

    filterCommandPalette() {
        const query = this.dom.cmdPaletteInput.value.toLowerCase().trim();
        const commands = [
            // Navigation
            { group: 'Navigation', icon: 'fa-chart-line', label: 'Go to Developer Dashboard', action: () => this.navigateTo('dashboard') },
            { group: 'Navigation', icon: 'fa-stopwatch', label: 'Go to Timer Console', action: () => this.navigateTo('timer') },
            { group: 'Navigation', icon: 'fa-folder-tree', label: 'Go to Projects & Tasks', action: () => this.navigateTo('projects') },
            { group: 'Navigation', icon: 'fa-list-check', label: 'Go to Session History Logs', action: () => this.navigateTo('sessions') },
            { group: 'Navigation', icon: 'fa-chart-pie', label: 'Go to Productivity Analytics', action: () => this.navigateTo('reports') },
            { group: 'Navigation', icon: 'fa-sliders', label: 'Go to Settings & Storage', action: () => this.navigateTo('settings') },
            { group: 'Navigation', icon: 'fa-circle-info', label: 'About Code Timer Tracker & Ecosystem', action: () => this.navigateTo('about') },

            // Timer Actions
            { group: 'Timer Actions', icon: 'fa-play', label: 'Start / Resume Active Timer', action: () => { if (!this.activeSession) this.startSession(); else if (this.activeSession.paused) this.togglePauseSession(); } },
            { group: 'Timer Actions', icon: 'fa-pause', label: 'Pause Active Timer', action: () => { if (this.activeSession && !this.activeSession.paused) this.togglePauseSession(); } },
            { group: 'Timer Actions', icon: 'fa-stop', label: 'Stop & Save Active Session', action: () => { if (this.activeSession) this.stopAndSaveSession(); } },
            { group: 'Timer Actions', icon: 'fa-expand', label: 'Toggle Distraction-Free Focus Mode', action: () => this.toggleFocusMode() },
            { group: 'Timer Actions', icon: 'fa-calendar-plus', label: 'Log Past Coding Session', action: () => this.openManualSessionModal() },

            // Projects & Workflows
            { group: 'Projects & Tasks', icon: 'fa-plus', label: 'Create New Project', action: () => this.openProjectModal() },
            { group: 'Projects & Tasks', icon: 'fa-list-check', label: 'Create New Task', action: () => this.openTaskModal() },

            // Export & Data
            { group: 'Data & Utilities', icon: 'fa-file-csv', label: 'Export Sessions to CSV', action: () => this.exportCsv() },
            { group: 'Data & Utilities', icon: 'fa-file-code', label: 'Download JSON Full Backup', action: () => this.exportJsonBackup() },
            { group: 'Data & Utilities', icon: 'fa-moon', label: 'Toggle Theme (Dark / Light)', action: () => {
                const next = this.state.settings.theme === 'dark' ? 'light' : 'dark';
                this.state.settings.theme = next;
                this.applyTheme(next);
                this.saveState();
            }},

            // External Links
            { group: 'Code Elta6ur Ecosystem', icon: 'fa-graduation-cap', label: 'Code Elta6ur — Educational Platform', action: () => window.open('https://code-elta6ur.com/', '_blank') },
            { group: 'Code Elta6ur Ecosystem', icon: 'fa-building', label: 'Code Elta6ur — Software Company', action: () => window.open('https://code-elta6ur.net/', '_blank') },
            { group: 'Code Elta6ur Ecosystem', icon: 'fa-id-card', label: 'Code Elta6ur — Portfolio Builder', action: () => window.open('https://portfolio.code-elta6ur.net/', '_blank') },
            { group: 'Code Elta6ur Ecosystem', icon: 'fa-user-tie', label: 'Mohammad Abu Khashreef — Portfolio', action: () => window.open('https://mohammad.code-elta6ur.com/', '_blank') }
        ];

        // Also dynamically add quick track commands for each project
        this.state.projects.filter(p => !p.archived).forEach(proj => {
            commands.push({
                group: 'Quick Track Project',
                icon: 'fa-code-branch',
                label: `Track Project: ${proj.name}`,
                action: () => this.trackProject(proj.id)
            });
        });

        const filtered = query ? commands.filter(c => c.label.toLowerCase().includes(query) || c.group.toLowerCase().includes(query)) : commands;

        if (filtered.length === 0) {
            this.dom.cmdPaletteResults.innerHTML = '<div class="text-muted text-sm" style="padding: 16px; text-align: center;">No matching commands found.</div>';
            return;
        }

        // Group commands
        let lastGroup = '';
        let html = '';
        filtered.forEach((cmd, idx) => {
            if (cmd.group !== lastGroup) {
                lastGroup = cmd.group;
                html += `<div class="cmd-group-label">${lastGroup}</div>`;
            }
            html += `
                <div class="cmd-item" data-cmd-idx="${idx}">
                    <div class="cmd-item-left">
                        <i class="fas ${cmd.icon}"></i>
                        <span>${this.escapeHtml(cmd.label)}</span>
                    </div>
                    <kbd class="kbd-hint">&crarr;</kbd>
                </div>
            `;
        });

        this.dom.cmdPaletteResults.innerHTML = html;

        // Click handlers on items
        this.dom.cmdPaletteResults.querySelectorAll('.cmd-item').forEach((el, index) => {
            el.addEventListener('click', () => {
                const targetCmd = filtered[index];
                if (targetCmd) {
                    this.closeCommandPalette();
                    targetCmd.action();
                }
            });
        });
    }

    // Modal Helpers
    openConfirmDialog(title, message, onConfirm) {
        const modal = this.dom.confirmModal;
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;
        const okBtn = document.getElementById('confirmOkBtn');

        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        newOkBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (typeof onConfirm === 'function') onConfirm();
        });

        modal.classList.remove('hidden');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    }

    // Notification Toasts
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            success: 'fa-check-circle',
            info: 'fa-info-circle',
            warning: 'fa-triangle-exclamation',
            danger: 'fa-circle-xmark'
        };
        toast.innerHTML = `<i class="fas ${icons[type] || 'fa-bell'}"></i> <span>${this.escapeHtml(message)}</span>`;
        this.dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    // Date & Math Utilities
    getStartOfWeek(date, weekStartDay = 'sunday') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay(); // 0 is Sunday
        let diff = 0;

        if (weekStartDay === 'monday') {
            diff = (day === 0 ? -6 : 1) - day;
        } else if (weekStartDay === 'saturday') {
            diff = (day === 6 ? 0 : -(day + 1));
        } else {
            // sunday
            diff = -day;
        }

        d.setDate(d.getDate() + diff);
        return d;
    }

    calcActiveDayStreak() {
        if (!this.state.sessions.length) return 0;
        const activeDays = new Set(this.state.sessions.map(s => s.startTime.split('T')[0]));
        const sortedDays = Array.from(activeDays).sort().reverse();
        if (!sortedDays.length) return 0;

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // If today or yesterday is not in the set, streak broken
        if (!sortedDays.includes(todayStr) && !sortedDays.includes(yesterdayStr)) {
            return 0;
        }

        let streak = 0;
        let checkDate = new Date();
        if (!sortedDays.includes(todayStr)) {
            checkDate = yesterday;
        }

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (activeDays.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    formatTimeDigital(ms) {
        if (!ms || ms < 0) ms = 0;
        const totalSecs = Math.floor(ms / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    formatDuration(ms) {
        if (!ms || ms < 0) return '0m';
        const totalSecs = Math.floor(ms / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    saveState() {
        StorageManager.save(this.state);
    }

    renderAll() {
        this.renderDashboard();
        this.renderProjects();
        this.applySessionFilters();
        this.updateProjectSnapshot();
        this.renderSettings();
    }
}

// Bootstrap Application
function initCodeTimerTracker() {
    if (!window.appEngine) {
        window.appEngine = new AppEngine();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeTimerTracker);
} else {
    initCodeTimerTracker();
}
