window.SettingsModule = {
  state: { activeEvent: null },

  initSettingsView(activeEvent) {
    this.state.activeEvent = activeEvent || this.getActiveEvent() || null;
    this.attachHandlers();
    this.renderEventInfo();
    this.renderEventHistory();
  },

  getActiveEvent() {
    const raw = localStorage.getItem('bpms_active_event');
    try { return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
  },
  setActiveEvent(ev) {
    localStorage.setItem('bpms_active_event', JSON.stringify(ev || {}));
    this.state.activeEvent = ev || null;
    if (window.EventManagerDashboard && window.EventManagerDashboard.state) {
      window.EventManagerDashboard.state.activeEvent = this.state.activeEvent;
    }
  },
  getEventsHistory() {
    const raw = localStorage.getItem('bpms_events');
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },
  saveEventsHistory(list) {
    localStorage.setItem('bpms_events', JSON.stringify(list || []));
  },
  upsertEventHistory(ev) {
    if (!ev || !ev.id) return;
    const list = this.getEventsHistory();
    const idx = list.findIndex(x => x.id === ev.id);
    if (idx >= 0) list[idx] = ev; else list.push(ev);
    this.saveEventsHistory(list);
  },

  attachHandlers() {
    const toggleBtn = document.getElementById('toggleEventActivationBtn');
    const editBtn = document.getElementById('editCurrentEventBtn');
    const addBtn = document.getElementById('addNewEventBtn');
    const editForm = document.getElementById('editEventForm');
    const cancelEdit = document.getElementById('cancelEditEvent');
    const addModal = document.getElementById('addEventModal');
    const overlay = addModal ? addModal.querySelector('.modal-overlay') : null;
    const addForm = document.getElementById('addEventForm');
    const cancelAdd = document.getElementById('cancelAddEvent');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleActivation());
    if (editBtn) editBtn.addEventListener('click', () => this.startEdit());
    if (addBtn) addBtn.addEventListener('click', () => this.openAddModal());
    if (editForm) editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    if (cancelEdit) cancelEdit.addEventListener('click', () => this.cancelEdit());
    if (overlay) overlay.addEventListener('click', () => this.closeAddModal());
    if (addForm) addForm.addEventListener('submit', (e) => this.handleAddSubmit(e));
    if (cancelAdd) cancelAdd.addEventListener('click', () => this.closeAddModal());
    const histTbody = document.getElementById('eventsHistoryTbody');
    if (histTbody) histTbody.addEventListener('click', (e) => this.handleHistoryClick(e));
    const genBtn = document.getElementById('generateTicketsBtn');
    if (genBtn) genBtn.addEventListener('click', () => this.generateTickets());
  },

  renderEventInfo() {
    const ev = this.state.activeEvent || this.getActiveEvent();
    const nameEl = document.getElementById('settingsEventName');
    const dateEl = document.getElementById('settingsEventDate');
    const timeEl = document.getElementById('settingsEventTime');
    const venueEl = document.getElementById('settingsEventVenue');
    const badge = document.getElementById('settingsEventStatusBadge');
    const toggleBtn = document.getElementById('toggleEventActivationBtn');
    const editBtn = document.getElementById('editCurrentEventBtn');
    const wrapper = document.getElementById('editEventFormWrapper');
    const warning = document.getElementById('editEventWarning');
    if (!ev) {
      if (nameEl) nameEl.textContent = '-';
      if (dateEl) dateEl.textContent = '-';
      if (timeEl) timeEl.textContent = '-';
      if (venueEl) venueEl.textContent = '-';
      if (badge) { badge.textContent = 'No Event'; badge.className = 'status-badge pending'; }
      if (toggleBtn) toggleBtn.disabled = true;
      if (editBtn) editBtn.disabled = true;
      if (wrapper) wrapper.style.display = 'none';
      if (warning) warning.style.display = 'none';
      return;
    }
    const status = (ev.status || 'draft').toLowerCase();
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const badgeClass = status === 'active' ? 'approved' : (status === 'completed' ? 'approved' : 'pending');
    if (nameEl) nameEl.textContent = ev.name || '-';
    if (dateEl) dateEl.textContent = ev.date || '-';
    if (timeEl) timeEl.textContent = ev.time || '-';
    if (venueEl) venueEl.textContent = ev.venue || '-';
    if (badge) { badge.textContent = statusText; badge.className = 'status-badge ' + badgeClass; }
    if (toggleBtn) toggleBtn.textContent = status === 'active' ? 'Set Draft' : 'Activate';
    if (editBtn) editBtn.disabled = status !== 'draft';
    if (wrapper && status !== 'draft') wrapper.style.display = 'none';
    if (warning && status !== 'draft') warning.style.display = 'none';
  },

  renderEventHistory() {
    const list = this.getEventsHistory();
    const tbody = document.getElementById('eventsHistoryTbody');
    if (!tbody) return;
    // Exclude current active event from history list display
    const activeId = (this.state.activeEvent || this.getActiveEvent() || {}).id;
    const filtered = (list||[]).filter(ev => ev.id !== activeId);
    // Show only the most recent previous event
    const show = filtered
      .slice()
      .sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))
      .slice(0, 1);
    if (!show || show.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="empty-state-text">No previous events</div></td></tr>';
      return;
    }
    const rows = show.map(ev => {
        const status = (ev.status||'draft');
        const badgeClass = status === 'active' ? 'approved' : (status === 'completed' ? 'approved' : 'pending');
        const badge = '<span class="status-badge ' + badgeClass + '">' + (status.charAt(0).toUpperCase()+status.slice(1)) + '</span>';
        return (
          '<tr data-id="' + ev.id + '">' +
          '<td>' + (ev.name||'-') + '</td>' +
          '<td>' + (ev.date||'-') + '</td>' +
          '<td>' + (ev.venue||'-') + '</td>' +
          '<td>' + badge + '</td>' +
          '<td>' +
            '<button class="table-action-btn view" data-action="open">Open Event</button>' +
          '</td>' +
          '</tr>'
        );
      }).join('');
    tbody.innerHTML = rows;
    this.renderTicketsTable();
  },

  handleHistoryClick(e) {
    const btn = e.target.closest('button');
    const row = e.target.closest('tr');
    if (!btn || !row) return;
    const id = row.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'open') {
      const ok = window.confirm('Open this event? This will set it as Active and archive any currently active event as Completed.');
      if (!ok) return;
      this.setActiveEventExclusive(id);
      this.cancelEdit();
      this.renderEventInfo();
      this.renderEventHistory();
    }
  },

  setActiveEventExclusive(id) {
    const list = this.getEventsHistory();
    const target = list.find(x => x.id === id);
    if (!target) return;
    // Deactivate any currently active event in history
    const updated = list.map(ev => {
      if (ev.id === id) {
        return { ...ev, status: 'active', updated_at: new Date().toISOString() };
      }
      if ((ev.status||'').toLowerCase() === 'active') {
        return { ...ev, status: 'completed', updated_at: new Date().toISOString() };
      }
      return ev;
    });
    this.saveEventsHistory(updated);
    this.setActiveEvent({ ...target, status: 'active', updated_at: new Date().toISOString() });
    if (window.EventManagerDashboard && typeof window.EventManagerDashboard.goToDashboard === 'function') {
      window.EventManagerDashboard.goToDashboard();
    }
  },

  toggleActivation() {
    const ev = this.state.activeEvent || this.getActiveEvent();
    if (!ev) return;
    const status = (ev.status || 'draft').toLowerCase();
    ev.status = status === 'active' ? 'draft' : 'active';
    ev.updated_at = new Date().toISOString();
    this.setActiveEvent(ev);
    if ((ev.status || 'draft').toLowerCase() !== 'draft') this.cancelEdit();
    this.renderEventInfo();
  },

  startEdit() {
    const ev = this.state.activeEvent || this.getActiveEvent();
    if (!ev) return;
    if ((ev.status || 'draft').toLowerCase() !== 'draft') return;
    const wrapper = document.getElementById('editEventFormWrapper');
    const warning = document.getElementById('editEventWarning');
    const f = {
      name: document.getElementById('editEventName'),
      date: document.getElementById('editEventDate'),
      time: document.getElementById('editEventTime'),
      venue: document.getElementById('editEventVenue')
    };
    if (f.name) f.name.value = ev.name || '';
    if (f.date) f.date.value = ev.date || '';
    if (f.time) f.time.value = ev.time || '';
    if (f.venue) f.venue.value = ev.venue || '';
    if (wrapper) wrapper.style.display = '';
    if (warning) warning.style.display = '';
  },

  cancelEdit() {
    const wrapper = document.getElementById('editEventFormWrapper');
    const warning = document.getElementById('editEventWarning');
    if (wrapper) wrapper.style.display = 'none';
    if (warning) warning.style.display = 'none';
    const form = document.getElementById('editEventForm');
    if (form) form.reset();
  },

  handleEditSubmit(e) {
    e.preventDefault();
    const ev = this.state.activeEvent || this.getActiveEvent();
    if (!ev) return;
    if ((ev.status || 'draft').toLowerCase() !== 'draft') return;
    const name = document.getElementById('editEventName')?.value.trim() || '';
    const date = document.getElementById('editEventDate')?.value || '';
    const time = document.getElementById('editEventTime')?.value || '';
    const venue = document.getElementById('editEventVenue')?.value.trim() || '';
    ev.name = name;
    ev.date = date;
    ev.time = time;
    ev.venue = venue;
    ev.updated_at = new Date().toISOString();
    this.setActiveEvent(ev);
    this.cancelEdit();
    this.renderEventInfo();
  },

  openAddModal() {
    const modal = document.getElementById('addEventModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    const nameEl = document.getElementById('newEventName');
    if (nameEl) nameEl.focus();
  },
  closeAddModal() {
    const modal = document.getElementById('addEventModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const form = document.getElementById('addEventForm');
    if (form) form.reset();
  },

  handleAddSubmit(e) {
    e.preventDefault();
    const prev = this.state.activeEvent || this.getActiveEvent();
    if (prev && prev.id) {
      const archived = { ...prev, status: 'completed', updated_at: new Date().toISOString() };
      this.upsertEventHistory(archived);
    }
    const name = document.getElementById('newEventName')?.value.trim() || '';
    const date = document.getElementById('newEventDate')?.value || '';
    const time = document.getElementById('newEventTime')?.value || '';
    const venue = document.getElementById('newEventVenue')?.value.trim() || '';
    const id = 'event_' + Date.now();
    const ev = { id, name, date, time, venue, created_at: new Date().toISOString(), status: 'draft' };
    this.setActiveEvent(ev);
    this.closeAddModal();
    this.renderEventInfo();
    this.renderEventHistory();
    if (window.EventManagerDashboard && typeof window.EventManagerDashboard.goToDashboard === 'function') {
      window.EventManagerDashboard.goToDashboard();
    }
  },

  getTicketsKey(eventId) {
    return 'bpms_tickets_' + (eventId || 'default');
  },
  loadTicketsRaw(key) {
    const raw = localStorage.getItem(key);
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },
  saveTicketsRaw(key, list) {
    localStorage.setItem(key, JSON.stringify(list || []));
  },
  renderTicketsTable() {
    const tbody = document.getElementById('ticketsTbody');
    if (!tbody) return;
    const ev = this.state.activeEvent || this.getActiveEvent();
    if (!ev || !ev.id) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><div class="empty-state-text">No tickets generated</div></td></tr>';
      const btn = document.getElementById('generateTicketsBtn');
      if (btn) btn.disabled = true;
      return;
    }
    const btn = document.getElementById('generateTicketsBtn');
    if (btn) btn.disabled = false;
    const key = this.getTicketsKey(ev.id);
    const list = this.loadTicketsRaw(key);
    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><div class="empty-state-text">No tickets generated</div></td></tr>';
      return;
    }
    const now = new Date();
    const rows = list.map(t => {
      const used = !!t.usedAt;
      const expired = t.expiresAt ? (new Date(t.expiresAt).getTime() < now.getTime() && !used) : false;
      const status = used ? 'Used' : (expired ? 'Expired' : 'Unused');
      const usedAt = t.usedAt ? new Date(t.usedAt).toLocaleString() : '-';
      return '<tr>' +
        '<td>' + (t.code || '-') + '</td>' +
        '<td>' + status + '</td>' +
        '<td>' + usedAt + '</td>' +
      '</tr>';
    }).join('');
    tbody.innerHTML = rows;
  },
  generateTickets() {
    const ev = this.state.activeEvent || this.getActiveEvent();
    if (!ev || !ev.id) return;
    const countEl = document.getElementById('ticketCount');
    const n = parseInt(countEl && countEl.value ? countEl.value : '0', 10);
    if (!n || n <= 0) return;
    const key = this.getTicketsKey(ev.id);
    const list = this.loadTicketsRaw(key);
    const now = new Date();
    let expiry = null;
    if (ev.date) {
      const d = new Date(ev.date);
      d.setHours(23,59,59,999);
      expiry = d;
    } else {
      const d = new Date(now.getTime() + 30*24*60*60*1000);
      expiry = d;
    }
    const existingCodes = new Set(list.map(t => t.code));
    const gen = (len) => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let s = '';
      for (let i=0;i<len;i++) s += chars.charAt(Math.floor(Math.random()*chars.length));
      return s;
    };
    for (let i=0;i<n;i++) {
      let code = gen(8);
      while (existingCodes.has(code)) code = gen(8);
      existingCodes.add(code);
      list.push({ code, status: 'unused', usedAt: null, expiresAt: expiry.toISOString(), createdAt: now.toISOString() });
    }
    this.saveTicketsRaw(key, list);
    this.renderTicketsTable();
  }
};
