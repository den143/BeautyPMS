'use strict';

/**
 * Event Manager Dashboard Object
 * Handles event creation and dashboard display
 */
const EventManagerDashboard = {
    // Application state
    state: {
        isFormSubmitting: false,
        activeEvent: null,
        dashboardData: {
            stats: null,
            activities: [],
            recentRegistrations: [],
            judges: [],
            tasks: []
        },
        refreshInterval: null,
        isLoading: false
    },

    // DOM element cache
    elements: {},

    /**
     * Initialize the dashboard
     */
    init() {
        this.cacheElements();
        this.checkForActiveEvent();
        this.attachEventListeners();
        this.setupDataRefresh();
        console.log('Event Manager Dashboard Initialized');
    },

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements = {
            // Modal elements
            eventCreationModal: document.getElementById('eventCreationModal'),
            eventCreationForm: document.getElementById('eventCreationForm'),
            eventCreationSuccess: document.getElementById('eventCreationSuccess'),
            createEventButton: document.getElementById('createEventButton'),
            
            // Form inputs
            eventNameInput: document.getElementById('eventName'),
            eventDateInput: document.getElementById('eventDate'),
            eventVenueInput: document.getElementById('eventVenue'),
            
            // Error messages
            eventNameError: document.getElementById('eventNameError'),
            eventDateError: document.getElementById('eventDateError'),
            eventVenueError: document.getElementById('eventVenueError'),
            
            // Dashboard elements
            mainDashboard: document.getElementById('mainDashboard'),
            dashboardEventName: document.getElementById('dashboardEventName'),
            dashboardEventDate: document.getElementById('dashboardEventDate'),
            dashboardEventVenue: document.getElementById('dashboardEventVenue'),
            statStatus: document.getElementById('statStatus'),
            statContestants: document.getElementById('statContestants'),
            statJudges: document.getElementById('statJudges'),
            
            // Sidebar and navigation
            sidebar: document.getElementById('sidebar'),
            navItems: document.querySelectorAll('.nav-item[data-nav]'),
            logoutButton: document.getElementById('logoutButton'),
            settingsButton: document.querySelector('.nav-item[data-nav="settings"]'),
            
            // Header elements
            notificationIcon: document.getElementById('notificationIcon'),
            profileIcon: document.getElementById('profileIcon'),
            
            // Dashboard views
            dashboardView: document.getElementById('dashboardView'),
            otherViews: document.getElementById('otherViews'),
            statActiveJudges: document.getElementById('statActiveJudges'),
            statRegisteredJudges: document.getElementById('statRegisteredJudges'),
            
            // Enhanced dashboard elements
            daysUntilEvent: document.getElementById('daysUntilEvent'),
            daysCount: document.getElementById('daysCount'),
            eventStatusBadge: document.getElementById('eventStatusBadge'),
            statRounds: document.getElementById('statRounds'),
            statSegments: document.getElementById('statSegments'),
            statAwards: document.getElementById('statAwards'),
            statOrganizers: document.getElementById('statOrganizers'),
            statCompletionRate: document.getElementById('statCompletionRate'),
            
            // Progress checklist
            progressPercentage: document.getElementById('progressPercentage'),
            progressBarFill: document.getElementById('progressBarFill'),
            checkEventDetails: document.getElementById('checkEventDetails'),
            checkOrganizers: document.getElementById('checkOrganizers'),
            checkRounds: document.getElementById('checkRounds'),
            checkSegments: document.getElementById('checkSegments'),
            checkAwards: document.getElementById('checkAwards'),
            checkContestants: document.getElementById('checkContestants'),
            checkJudges: document.getElementById('checkJudges'),
            
            // Activity feed
            activityFeedContainer: document.getElementById('activityFeedContainer'),
            refreshActivityBtn: document.getElementById('refreshActivityBtn'),
            
            // Recent registrations
            recentRegistrationsBody: document.getElementById('recentRegistrationsBody'),
            
            // Judge status
            judgeStatusContainer: document.getElementById('judgeStatusContainer'),
            
            // Upcoming tasks
            upcomingTasksContainer: document.getElementById('upcomingTasksContainer'),
            
            // Quick actions
            quickActionButtons: document.querySelectorAll('.quick-action-btn')
        };

        // Diagnostics: log missing elements to console for debugging
        const missing = Object.entries(this.elements).filter(([k, v]) => !v).map(([k]) => k);
        if (missing.length) {
            console.warn('Event Manager Dashboard: Some elements could not be found during cache:', missing.join(', '));
        } else {
            console.log('Event Manager Dashboard: All key elements cached successfully');
        }
    },

    /**
     * Check for active event on page load
     */
    checkForActiveEvent() {
        const activeEventData = localStorage.getItem('bpms_active_event');
        
        if (activeEventData) {
            try {
                this.state.activeEvent = JSON.parse(activeEventData);
                this.showDashboard();
            } catch (error) {
                console.error('Error parsing active event data:', error);
                this.showEventCreationModal();
            }
        } else {
            this.showEventCreationModal();
        }
    },

    /**
     * Show event creation modal
     */
    showEventCreationModal() {
        if (this.elements.eventCreationModal) {
            this.elements.eventCreationModal.classList.remove('hidden');
            this.elements.eventCreationModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            if (this.elements.eventNameInput) {
                setTimeout(() => this.elements.eventNameInput.focus(), 100);
            }
        }
    },

    /**
     * Hide event creation modal
     */
    hideEventCreationModal() {
        if (this.elements.eventCreationModal) {
            this.elements.eventCreationModal.classList.add('hidden');
            this.elements.eventCreationModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    },

    /**
     * Show main dashboard
     */
    showDashboard() {
        if (this.elements.mainDashboard && this.state.activeEvent) {
            // Hide modal if visible
            this.hideEventCreationModal();
            
            // Show dashboard
            this.elements.mainDashboard.classList.remove('hidden');
            
            // Populate dashboard with event data
            this.populateDashboard();
        }
    },

    /**
     * Populate dashboard with event information
     */
    populateDashboard() {
        if (!this.state.activeEvent) return;

        const event = this.state.activeEvent;
        
        // Format date for display
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update dashboard elements
        if (this.elements.dashboardEventName) {
            this.elements.dashboardEventName.textContent = event.name;
        }
        
        if (this.elements.dashboardEventDate) {
            this.elements.dashboardEventDate.textContent = formattedDate;
        }
        
        if (this.elements.dashboardEventVenue) {
            this.elements.dashboardEventVenue.textContent = event.venue;
        }
        
        if (this.elements.statStatus) {
            this.elements.statStatus.textContent = event.status.charAt(0).toUpperCase() + event.status.slice(1);
        }

        // Update event status badge
        if (this.elements.eventStatusBadge) {
            this.elements.eventStatusBadge.textContent = event.status.charAt(0).toUpperCase() + event.status.slice(1);
            this.elements.eventStatusBadge.className = 'event-status-badge ' + event.status.toLowerCase();
        }

        // Set dashboard as default view
        this.showDashboardView();

        // Calculate days until event
        this.calculateDaysUntilEvent();

        // Load dashboard data
        this.loadDashboardData();
    },

    /**
     * Calculate days until event
     */
    calculateDaysUntilEvent() {
        if (!this.state.activeEvent || !this.elements.daysCount) return;

        const eventDate = new Date(this.state.activeEvent.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (this.elements.daysCount) {
            if (diffDays < 0) {
                this.elements.daysCount.textContent = Math.abs(diffDays);
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>' + Math.abs(diffDays) + '</strong> days since event';
                }
            } else if (diffDays === 0) {
                this.elements.daysCount.textContent = '0';
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>Today</strong> is the event day!';
                }
            } else {
                this.elements.daysCount.textContent = diffDays;
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>' + diffDays + '</strong> days until event';
                }
            }
        }
    },

    /**
     * Load dashboard data
     */
    loadDashboardData() {
        this.state.isLoading = true;
        
        // For now, use mock data since backend is not ready
        // This will be replaced with API calls later
        this.loadMockDashboardData();
        
        // Update UI with data
        this.updateDashboardUI();
        
        this.state.isLoading = false;
    },

    /**
     * Load mock dashboard data (temporary until backend is ready)
     */
    loadMockDashboardData() {
        // Mock statistics
        this.state.dashboardData.stats = {
            totalContestants: 0,
            totalJudges: 0,
            activeJudges: 0,
            registeredJudges: 0,
            totalRounds: 0,
            totalSegments: 0,
            totalAwards: 0,
            totalOrganizers: 0,
            completionRate: 0
        };

        // Mock activities
        this.state.dashboardData.activities = [];

        // Mock recent registrations
        this.state.dashboardData.recentRegistrations = [];

        // Mock judges
        this.state.dashboardData.judges = [];

        // Mock tasks
        this.state.dashboardData.tasks = [];
    },

    /**
     * Update dashboard UI with loaded data
     */
    updateDashboardUI() {
        // Update statistics
        this.updateStatistics();
        
        // Update progress checklist
        this.updateProgressChecklist();
        
        // Update activity feed
        this.updateActivityFeed();
        
        // Update recent registrations
        this.updateRecentRegistrations();
        
        // Update judge status
        this.updateJudgeStatus();
        
        // Update upcoming tasks
        this.updateUpcomingTasks();
    },

    /**
     * Update statistics display
     */
    updateStatistics() {
        const stats = this.state.dashboardData.stats;
        
        if (this.elements.statContestants) {
            this.elements.statContestants.textContent = stats.totalContestants || 0;
        }
        if (this.elements.statJudges) {
            this.elements.statJudges.textContent = stats.totalJudges || 0;
        }
        if (this.elements.statActiveJudges) {
            this.elements.statActiveJudges.textContent = stats.activeJudges || 0;
        }
        if (this.elements.statRegisteredJudges) {
            this.elements.statRegisteredJudges.textContent = stats.registeredJudges || 0;
        }
        if (this.elements.statRounds) {
            this.elements.statRounds.textContent = stats.totalRounds || 0;
        }
        if (this.elements.statSegments) {
            this.elements.statSegments.textContent = stats.totalSegments || 0;
        }
        if (this.elements.statAwards) {
            this.elements.statAwards.textContent = stats.totalAwards || 0;
        }
        if (this.elements.statOrganizers) {
            this.elements.statOrganizers.textContent = stats.totalOrganizers || 0;
        }
        if (this.elements.statCompletionRate) {
            this.elements.statCompletionRate.textContent = (stats.completionRate || 0) + '%';
        }
    },

    /**
     * Update progress checklist
     */
    updateProgressChecklist() {
        const stats = this.state.dashboardData.stats;
        const event = this.state.activeEvent;
        
        // Check each item
        const checks = {
            eventDetails: !!event,
            organizers: (stats.totalOrganizers || 0) > 0,
            rounds: (stats.totalRounds || 0) > 0,
            segments: (stats.totalSegments || 0) > 0,
            awards: (stats.totalAwards || 0) > 0,
            contestants: (stats.totalContestants || 0) > 0,
            judges: (stats.totalJudges || 0) > 0
        };

        // Update checkmarks
        this.updateCheckmark('checkEventDetails', checks.eventDetails);
        this.updateCheckmark('checkOrganizers', checks.organizers);
        this.updateCheckmark('checkRounds', checks.rounds);
        this.updateCheckmark('checkSegments', checks.segments);
        this.updateCheckmark('checkAwards', checks.awards);
        this.updateCheckmark('checkContestants', checks.contestants);
        this.updateCheckmark('checkJudges', checks.judges);

        // Calculate completion percentage
        const totalChecks = Object.keys(checks).length;
        const completedChecks = Object.values(checks).filter(Boolean).length;
        const percentage = Math.round((completedChecks / totalChecks) * 100);

        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = percentage + '%';
        }
        if (this.elements.progressBarFill) {
            this.elements.progressBarFill.style.width = percentage + '%';
        }
    },

    /**
     * Update checkmark status
     */
    updateCheckmark(elementId, isComplete) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isComplete) {
                element.textContent = '✓';
                element.classList.remove('incomplete');
                element.classList.add('complete');
            } else {
                element.textContent = '✗';
                element.classList.remove('complete');
                element.classList.add('incomplete');
            }
        }
    },

    /**
     * Update activity feed
     */
    updateActivityFeed() {
        if (!this.elements.activityFeedContainer) return;

        const activities = this.state.dashboardData.activities;

        if (activities.length === 0) {
            this.elements.activityFeedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No recent activity</div>
                </div>
            `;
            return;
        }

        let html = '';
        activities.forEach(activity => {
            const iconClass = activity.type === 'contestant' ? 'contestant' : 
                            activity.type === 'judge' ? 'judge' : 'system';
            const iconSvg = this.getActivityIcon(activity.type);
            
            html += `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        ${iconSvg}
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.message}</div>
                        <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
                    </div>
                </div>
            `;
        });

        this.elements.activityFeedContainer.innerHTML = html;
    },

    /**
     * Get activity icon SVG
     */
    getActivityIcon(type) {
        const icons = {
            contestant: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
            judge: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
        };
        return icons[type] || icons.system;
    },

    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
    },

    /**
     * Update recent registrations table
     */
    updateRecentRegistrations() {
        if (!this.elements.recentRegistrationsBody) return;

        const registrations = this.state.dashboardData.recentRegistrations;

        if (registrations.length === 0) {
            this.elements.recentRegistrationsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-state-text">No recent registrations</div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        registrations.forEach(reg => {
            const statusClass = reg.status.toLowerCase();
            html += `
                <tr>
                    <td>${reg.name}</td>
                    <td>${new Date(reg.registrationDate).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${reg.status}</span></td>
                    <td>
                        <button class="table-action-btn view" onclick="EventManagerDashboard.viewContestant('${reg.id}')">View</button>
                    </td>
                </tr>
            `;
        });

        this.elements.recentRegistrationsBody.innerHTML = html;
    },

    /**
     * Update judge status
     */
    updateJudgeStatus() {
        if (!this.elements.judgeStatusContainer) return;

        const judges = this.state.dashboardData.judges;

        if (judges.length === 0) {
            this.elements.judgeStatusContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No judges assigned yet</div>
                </div>
            `;
            return;
        }

        let html = '';
        judges.forEach(judge => {
            const initials = judge.name.split(' ').map(n => n[0]).join('').toUpperCase();
            html += `
                <div class="judge-status-item">
                    <div class="judge-info">
                        <div class="judge-avatar">${initials}</div>
                        <div class="judge-details">
                            <div class="judge-name">${judge.name}</div>
                            <div class="judge-meta">${judge.status} • Last active: ${this.formatTimeAgo(judge.lastActivity)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        this.elements.judgeStatusContainer.innerHTML = html;
    },

    /**
     * Update upcoming tasks
     */
    updateUpcomingTasks() {
        if (!this.elements.upcomingTasksContainer) return;

        const tasks = this.state.dashboardData.tasks;

        if (tasks.length === 0) {
            this.elements.upcomingTasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No upcoming tasks</div>
                </div>
            `;
            return;
        }

        let html = '';
        tasks.forEach(task => {
            html += `
                <div class="task-item">
                    <div class="task-priority ${task.priority}"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-due-date">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        });

        this.elements.upcomingTasksContainer.innerHTML = html;
    },

    /**
     * Handle quick action
     */
    handleQuickAction(action) {
        // Navigate to appropriate section
        const navItem = document.querySelector(`[data-nav="${action}"]`);
        if (navItem) {
            navItem.click();
        } else {
            console.log('Quick action:', action);
            // TODO: Implement action handlers
        }
    },

    /**
     * Refresh dashboard data
     */
    refreshDashboardData() {
        if (this.elements.refreshActivityBtn) {
            this.elements.refreshActivityBtn.classList.add('refreshing');
        }
        
        this.loadDashboardData();
        
        setTimeout(() => {
            if (this.elements.refreshActivityBtn) {
                this.elements.refreshActivityBtn.classList.remove('refreshing');
            }
        }, 1000);
    },

    /**
     * Setup auto-refresh
     */
    setupDataRefresh() {
        // Auto-refresh every 60 seconds
        this.state.refreshInterval = setInterval(() => {
            this.refreshDashboardData();
        }, 60000);
    },

    /**
     * View contestant (placeholder)
     */
    viewContestant(id) {
        console.log('View contestant:', id);
        // TODO: Implement view contestant functionality
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Form submission
        if (this.elements.eventCreationForm) {
            this.elements.eventCreationForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Real-time validation
        if (this.elements.eventNameInput) {
            this.elements.eventNameInput.addEventListener('blur', () => this.validateEventName());
            this.elements.eventNameInput.addEventListener('input', () => this.clearError('eventName'));
        }
        
        if (this.elements.eventDateInput) {
            this.elements.eventDateInput.addEventListener('blur', () => this.validateEventDate());
            this.elements.eventDateInput.addEventListener('change', () => this.clearError('eventDate'));
        }
        
        if (this.elements.eventVenueInput) {
            this.elements.eventVenueInput.addEventListener('blur', () => this.validateEventVenue());
            this.elements.eventVenueInput.addEventListener('input', () => this.clearError('eventVenue'));
        }

        // Navigation items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(navItem => {
                navItem.addEventListener('click', (e) => this.handleNavigationClick(e, navItem));
            });
        }

        // Logout button
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', (e) => this.handleSettings(e));
        }

        // Notification icon
        if (this.elements.notificationIcon) {
            this.elements.notificationIcon.addEventListener('click', () => this.handleNotificationClick());
        }

        // Profile icon
        if (this.elements.profileIcon) {
            this.elements.profileIcon.addEventListener('click', () => this.handleProfileClick());
        }

        // Refresh activity button
        if (this.elements.refreshActivityBtn) {
            this.elements.refreshActivityBtn.addEventListener('click', () => {
                this.refreshDashboardData();
            });
        }

        // Quick action buttons
        if (this.elements.quickActionButtons && this.elements.quickActionButtons.length > 0) {
            this.elements.quickActionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = btn.getAttribute('data-action');
                    this.handleQuickAction(action);
                });
            });
        }

        // Prevent Escape key from closing non-dismissible modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.eventCreationModal && 
                !this.elements.eventCreationModal.classList.contains('hidden')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();

        // Validate all fields
        const isNameValid = this.validateEventName();
        const isDateValid = this.validateEventDate();
        const isVenueValid = this.validateEventVenue();

        if (!isNameValid || !isDateValid || !isVenueValid) {
            // Shake animation on form
            if (this.elements.eventCreationForm) {
                this.elements.eventCreationForm.classList.add('shake-animation');
                setTimeout(() => {
                    this.elements.eventCreationForm.classList.remove('shake-animation');
                }, 500);
            }
            return;
        }

        // Prevent double submission
        if (this.state.isFormSubmitting) {
            return;
        }

        this.createEvent();
    },

    /**
     * Create event and save to localStorage
     */
    createEvent() {
        this.state.isFormSubmitting = true;
        
        if (this.elements.createEventButton) {
            this.elements.createEventButton.disabled = true;
            this.elements.createEventButton.textContent = 'Creating...';
        }

        // Get form values
        const eventName = this.elements.eventNameInput.value.trim();
        const eventDate = this.elements.eventDateInput.value;
        const eventVenue = this.elements.eventVenueInput.value.trim();

        // Generate unique event ID
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create event object
        const newEvent = {
            id: eventId,
            name: eventName,
            date: eventDate,
            venue: eventVenue,
            created_at: new Date().toISOString(),
            status: 'active'
        };

        // Handle previous active event
        const previousActiveEvent = localStorage.getItem('bpms_active_event');
        if (previousActiveEvent) {
            try {
                const previousEvent = JSON.parse(previousActiveEvent);
                previousEvent.status = 'completed';
                this.updateEventInHistory(previousEvent);
            } catch (error) {
                console.error('Error updating previous event:', error);
            }
        }

        // Save active event
        localStorage.setItem('bpms_active_event', JSON.stringify(newEvent));

        // Save to event history
        this.addEventToHistory(newEvent);

        // Update state
        this.state.activeEvent = newEvent;

        // Show success message
        if (this.elements.eventCreationSuccess) {
            this.elements.eventCreationSuccess.classList.add('show');
        }

        // Reset form state after delay
        setTimeout(() => {
            this.state.isFormSubmitting = false;
            
            if (this.elements.createEventButton) {
                this.elements.createEventButton.disabled = false;
                this.elements.createEventButton.textContent = 'Create Event';
            }

            // Hide success message and show dashboard
            if (this.elements.eventCreationSuccess) {
                this.elements.eventCreationSuccess.classList.remove('show');
            }

            // Clear form
            if (this.elements.eventCreationForm) {
                this.elements.eventCreationForm.reset();
            }

            // Show dashboard
            this.showDashboard();
        }, 2500);
    },

    /**
     * Add event to history
     */
    addEventToHistory(event) {
        let events = [];
        const eventsData = localStorage.getItem('bpms_events');
        
        if (eventsData) {
            try {
                events = JSON.parse(eventsData);
            } catch (error) {
                console.error('Error parsing events history:', error);
                events = [];
            }
        }

        // Check if event already exists (by ID) and update it, otherwise add it
        const existingIndex = events.findIndex(e => e.id === event.id);
        if (existingIndex >= 0) {
            events[existingIndex] = event;
        } else {
            events.push(event);
        }

        localStorage.setItem('bpms_events', JSON.stringify(events));
    },

    /**
     * Update event in history
     */
    updateEventInHistory(event) {
        let events = [];
        const eventsData = localStorage.getItem('bpms_events');
        
        if (eventsData) {
            try {
                events = JSON.parse(eventsData);
            } catch (error) {
                console.error('Error parsing events history:', error);
                events = [];
            }
        }

        const index = events.findIndex(e => e.id === event.id);
        if (index >= 0) {
            events[index] = event;
        } else {
            events.push(event);
        }

        localStorage.setItem('bpms_events', JSON.stringify(events));
    },

    /**
     * Validate event name
     */
    validateEventName() {
        const input = this.elements.eventNameInput;
        const errorElement = this.elements.eventNameError;
        const value = input.value.trim();

        if (!value) {
            this.showError('eventName', 'Event name is required');
            return false;
        }

        if (value.length < 3) {
            this.showError('eventName', 'Event name must be at least 3 characters');
            return false;
        }

        if (value.length > 100) {
            this.showError('eventName', 'Event name must not exceed 100 characters');
            return false;
        }

        this.clearError('eventName');
        return true;
    },

    /**
     * Validate event date
     */
    validateEventDate() {
        const input = this.elements.eventDateInput;
        const errorElement = this.elements.eventDateError;
        const value = input.value;

        if (!value) {
            this.showError('eventDate', 'Event date is required');
            return false;
        }

        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime())) {
            this.showError('eventDate', 'Please enter a valid date');
            return false;
        }

        // Optional: Prevent past dates (commented out for flexibility)
        // if (selectedDate < today) {
        //     this.showError('eventDate', 'Event date cannot be in the past');
        //     return false;
        // }

        this.clearError('eventDate');
        return true;
    },

    /**
     * Validate event venue
     */
    validateEventVenue() {
        const input = this.elements.eventVenueInput;
        const errorElement = this.elements.eventVenueError;
        const value = input.value.trim();

        if (!value) {
            this.showError('eventVenue', 'Venue/Location is required');
            return false;
        }

        if (value.length < 5) {
            this.showError('eventVenue', 'Venue/Location must be at least 5 characters');
            return false;
        }

        if (value.length > 200) {
            this.showError('eventVenue', 'Venue/Location must not exceed 200 characters');
            return false;
        }

        this.clearError('eventVenue');
        return true;
    },

    /**
     * Show error message for a field
     */
    showError(field, message) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            return;
        }

        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'true');
    },

    /**
     * Clear error message for a field
     */
    clearError(field) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            return;
        }

        input.classList.remove('error');
        errorElement.textContent = '';
        errorElement.removeAttribute('role');

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'false');
    },

    /**
     * Handle navigation item click
     */
    handleNavigationClick(e, navItem) {
        e.preventDefault();
        
        const navTarget = navItem.getAttribute('data-nav');
        
        // Remove active class from all nav items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Add active class to clicked item
        navItem.classList.add('active');
        
        // Handle navigation based on target
        console.log('Navigation clicked:', navTarget);
        
        // Show dashboard view or other views
        if (navTarget === 'dashboard') {
            this.showDashboardView();
        } else {
            this.showOtherView(navTarget);
        }
        
        // Placeholder for future navigation functionality
        // This will be replaced with actual page routing/content loading
        switch(navTarget) {
            case 'dashboard':
                // Dashboard view is already shown above
                break;
            case 'manage-organizers':
                console.log('Navigate to: Manage Organizers');
                // TODO: Load manage organizers content
                break;
            case 'manage-activities':
                console.log('Navigate to: Manage Activities');
                // TODO: Load manage activities content
                break;
            case 'manage-rounds':
                console.log('Navigate to: Manage Rounds');
                // TODO: Load manage rounds content
                break;
            case 'manage-segments':
                console.log('Navigate to: Manage Segments and Criteria');
                // TODO: Load manage segments content
                break;
            case 'manage-awards':
                console.log('Navigate to: Manage Awards');
                // TODO: Load manage awards content
                break;
            case 'register-contestant':
                console.log('Navigate to: Register Contestant');
                // TODO: Load register contestant form
                break;
            case 'register-judge':
                console.log('Navigate to: Register Judge');
                // TODO: Load register judge form
                break;
            case 'result-panel':
                console.log('Navigate to: Result Panel');
                // TODO: Load result panel content
                break;
            default:
                console.log('Unknown navigation target:', navTarget);
        }
    },

    /**
     * Show dashboard view
     */
    showDashboardView() {
        if (this.elements.dashboardView) {
            this.elements.dashboardView.classList.remove('hidden');
        }
        if (this.elements.otherViews) {
            this.elements.otherViews.classList.add('hidden');
        }
    },

    /**
     * Show other view (non-dashboard)
     */
    showOtherView(viewName) {
        if (this.elements.dashboardView) {
            this.elements.dashboardView.classList.add('hidden');
        }
        if (this.elements.otherViews) {
            this.elements.otherViews.classList.remove('hidden');
        }
    },

    /**
     * Handle logout
     */
    handleLogout(e) {
        e.preventDefault();
        
        // Confirm logout
        if (confirm('Are you sure you want to logout?')) {
            // Clear session data
            localStorage.removeItem('bpms_session');
            localStorage.removeItem('bpms_active_event');
            
            // Redirect to login page
            window.location.href = '../../index.html';
        }
    },

    /**
     * Handle settings click
     */
    handleSettings(e) {
        e.preventDefault();
        
        // Remove active class from all nav items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Add active class to settings
        if (this.elements.settingsButton) {
            this.elements.settingsButton.classList.add('active');
        }
        
        // Show other view for settings
        this.showOtherView('settings');
        
        console.log('Settings clicked');
        // TODO: Load settings page/content
    },

    /**
     * Handle notification icon click
     */
    handleNotificationClick() {
        console.log('Notification icon clicked');
        // TODO: Show notification dropdown/panel
        // This will be implemented when notification system is ready
    },

    /**
     * Handle profile icon click
     */
    handleProfileClick() {
        console.log('Profile icon clicked');
        // TODO: Show profile dropdown menu
        // This will be implemented when user profile system is ready
    },

};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EventManagerDashboard.init());
} else {
    EventManagerDashboard.init();
}

