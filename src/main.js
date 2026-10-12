/**
 * Epoché (Ἐποχή) — Academic Research Command & Peer-Review War Room
 * Main Application Controller (v2.5 Role-Based & Strict Client Reality)
 */

import { StorageService } from './services/storage.js';
import { AuthService } from './services/auth.js';
import { ReviewerParser } from './services/parser.js';
import { RebuttalGenerator } from './services/rebuttalGenerator.js';
import { InquiryTemplates } from './services/inquiryTemplates.js';
import { AudioSynthesizer } from './services/audio.js';
import { GLOBAL_PORTALS, SAMPLE_RAW_REVIEWS } from './data/seedData.js';

class EpocheApp {
  constructor() {
    // Initialize or restore session
    this.currentUser = AuthService.getSession();
    if (!this.currentUser) {
      this.currentUser = AuthService.loginClient({
        name: "Saran Boddu",
        email: "saran@amrita.edu",
        institution: "Amrita Vishwa Vidyapeetham",
        domain: "Power Electronics & Renewable Energy"
      });
    }

    // Load papers strictly from user's storage (Default is empty [] if none entered)
    this.papers = StorageService.getPapers();
    this.activeTab = 'tab-pipeline';
    this.selectedRebuttalPaperId = this.papers[0]?.id || null;
    this.currentReviewerFilter = 'all';

    // Pomodoro Sprint State
    this.timerDuration = 25 * 60;
    this.timerRemaining = 25 * 60;
    this.timerRunning = false;
    this.timerInterval = null;
    this.sprintPhase = 1;

    // View state
    this.activePipelineView = 'kanban';

    this.init();
  }

  init() {
    this.bindEvents();
    this.syncUserRoleUI();
    this.renderAll();
    this.startGlobalTimerLoop();
  }

  // =========================================================================
  // Role & Authentication UI Sync
  // =========================================================================
  syncUserRoleUI() {
    const isDev = this.currentUser.role === 'developer';
    const profilePill = document.getElementById('btn-user-profile');
    const nameDisplay = document.getElementById('user-name-display');
    const roleLabel = document.getElementById('user-role-label');
    const roleIcon = document.getElementById('user-role-icon');
    const devTab = document.getElementById('nav-tab-developer');
    const modeChip = document.getElementById('pipeline-user-chip');

    if (profilePill) {
      profilePill.classList.toggle('role-dev', isDev);
    }

    if (nameDisplay) {
      nameDisplay.textContent = isDev ? "Developer (Admin)" : "Client (Researcher)";
    }

    if (roleLabel) {
      roleLabel.textContent = this.currentUser.name;
    }

    if (roleIcon) {
      roleIcon.textContent = isDev ? "💻" : "🎓";
    }

    if (devTab) {
      devTab.classList.toggle('hidden', !isDev);
    }

    if (modeChip) {
      modeChip.innerHTML = isDev 
        ? `<span class="dot dot-amber"></span> Mode: Developer (Admin Root)` 
        : `<span class="dot dot-cyan"></span> Mode: Researcher Client (${this.currentUser.name})`;
    }
  }

  // =========================================================================
  // Event Binding
  // =========================================================================
  bindEvents() {
    // Tab Switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    // View Toggle in Pipeline
    document.getElementById('btn-view-kanban')?.addEventListener('click', () => {
      this.switchPipelineView('kanban');
    });
    document.getElementById('btn-view-timeline')?.addEventListener('click', () => {
      this.switchPipelineView('timeline');
    });

    // Search & Publisher Filter
    document.getElementById('filter-search')?.addEventListener('input', () => this.renderPipeline());
    document.getElementById('filter-publisher')?.addEventListener('change', () => this.renderPipeline());

    // User Profile Pill -> Open Auth Modal
    document.getElementById('btn-user-profile')?.addEventListener('click', () => {
      this.openModal('modal-auth');
    });
    document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
      this.closeModal('modal-auth');
    });

    // Auth Modal Role Tabs
    document.getElementById('btn-auth-tab-client')?.addEventListener('click', () => {
      document.getElementById('btn-auth-tab-client').classList.add('active');
      document.getElementById('btn-auth-tab-dev').classList.remove('active');
      document.getElementById('form-auth-client').classList.remove('hidden');
      document.getElementById('form-auth-dev').classList.add('hidden');
    });

    document.getElementById('btn-auth-tab-dev')?.addEventListener('click', () => {
      document.getElementById('btn-auth-tab-dev').classList.add('active');
      document.getElementById('btn-auth-tab-client').classList.remove('active');
      document.getElementById('form-auth-dev').classList.remove('hidden');
      document.getElementById('form-auth-client').classList.add('hidden');
    });

    // Client Login Submit
    document.getElementById('form-auth-client')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('auth-client-name').value;
      const email = document.getElementById('auth-client-email').value;
      const institution = document.getElementById('auth-client-inst').value;
      const domain = document.getElementById('auth-client-domain').value;

      this.currentUser = AuthService.loginClient({ name, email, institution, domain });
      this.syncUserRoleUI();
      this.closeModal('modal-auth');
      this.showToast(`Logged in as Researcher: ${this.currentUser.name}`, 'success');
      this.renderAll();
    });

    // Developer Login Submit
    document.getElementById('form-auth-dev')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('auth-dev-name').value;
      const pass = document.getElementById('auth-dev-pass').value;

      if (pass !== 'dev123' && pass.trim().length === 0) {
        this.showToast('Invalid Developer Passcode. Use "dev123"', 'error');
        return;
      }

      this.currentUser = AuthService.loginDeveloper({ name });
      this.syncUserRoleUI();
      this.closeModal('modal-auth');
      this.showToast(`Developer Console Unlocked for ${this.currentUser.name}!`, 'success');
      this.switchTab('tab-developer');
    });

    // Hero Strip actions
    document.getElementById('btn-dismiss-hero')?.addEventListener('click', () => {
      document.getElementById('hero-strip').classList.add('hidden');
    });
    document.getElementById('hero-btn-dissect')?.addEventListener('click', () => {
      this.switchTab('tab-rebuttal');
    });
    document.getElementById('hero-btn-demo')?.addEventListener('click', () => {
      this.loadBenchmarkDemo();
    });

    // Global Action Buttons
    document.getElementById('btn-export-ical')?.addEventListener('click', () => {
      if (this.papers.length === 0) {
        this.showToast('No active submissions to export. Add a paper first.', 'info');
        return;
      }
      StorageService.exportICalendar();
      this.showToast('iCalendar (.ics) downloaded! Sync with Google/Apple Calendar.', 'success');
    });

    document.getElementById('btn-vault-manager')?.addEventListener('click', () => {
      this.openModal('modal-vault');
    });
    document.getElementById('btn-close-vault-modal')?.addEventListener('click', () => {
      this.closeModal('modal-vault');
    });

    document.getElementById('btn-download-vault')?.addEventListener('click', () => {
      StorageService.exportVault();
      this.showToast('Lab Vault (.epoche) successfully exported!', 'success');
    });

    document.getElementById('btn-upload-vault-trigger')?.addEventListener('click', () => {
      document.getElementById('input-vault-file').click();
    });

    document.getElementById('input-vault-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = StorageService.importVault(evt.target.result);
          if (res.success) {
            this.papers = StorageService.getPapers();
            this.selectedRebuttalPaperId = this.papers[0]?.id || null;
            this.renderAll();
            this.closeModal('modal-vault');
            this.showToast(`Imported ${res.count} research manuscripts from vault!`, 'success');
          } else {
            this.showToast(`Import failed: ${res.error}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    });

    // New Paper Modal
    document.getElementById('btn-new-paper')?.addEventListener('click', () => {
      this.openModal('modal-new-paper');
    });
    document.getElementById('btn-close-new-paper-modal')?.addEventListener('click', () => {
      this.closeModal('modal-new-paper');
    });
    document.getElementById('btn-cancel-new-paper')?.addEventListener('click', () => {
      this.closeModal('modal-new-paper');
    });
    document.getElementById('form-new-paper')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreatePaper();
    });

    // Paper Details Modal Close
    document.getElementById('btn-close-paper-modal')?.addEventListener('click', () => {
      this.closeModal('modal-paper-details');
    });

    // Rebuttal Tab Actions
    document.getElementById('rebuttal-paper-select')?.addEventListener('change', (e) => {
      this.selectedRebuttalPaperId = e.target.value;
      this.renderRebuttalSection();
    });

    document.getElementById('btn-dissect-comments')?.addEventListener('click', () => {
      this.handleDissectComments();
    });

    document.getElementById('btn-load-sample-review')?.addEventListener('click', () => {
      const txt = document.getElementById('raw-review-input');
      if (txt) txt.value = SAMPLE_RAW_REVIEWS;
    });

    document.getElementById('btn-add-custom-comment')?.addEventListener('click', () => {
      this.handleAddCustomComment();
    });

    document.getElementById('btn-export-latex')?.addEventListener('click', () => {
      this.exportRebuttal('latex');
    });
    document.getElementById('btn-export-markdown')?.addEventListener('click', () => {
      this.exportRebuttal('markdown');
    });
    document.getElementById('btn-preview-formal-letter')?.addEventListener('click', () => {
      this.previewRebuttalLetter();
    });
    document.getElementById('btn-close-rebuttal-preview')?.addEventListener('click', () => {
      this.closeModal('modal-rebuttal-preview');
    });
    document.getElementById('btn-print-rebuttal')?.addEventListener('click', () => {
      window.print();
    });
    document.getElementById('btn-copy-preview-text')?.addEventListener('click', () => {
      const content = document.getElementById('academic-letter-preview-content')?.innerText;
      if (content) {
        navigator.clipboard.writeText(content);
        this.showToast('Rebuttal letter copied to clipboard!', 'success');
      }
    });

    // Journal Oracle Tab
    document.getElementById('inquiry-template-select')?.addEventListener('change', () => {
      this.updateInquiryLetter();
    });
    document.getElementById('inquiry-paper-select')?.addEventListener('change', () => {
      this.updateInquiryLetter();
    });
    document.getElementById('btn-copy-inquiry')?.addEventListener('click', () => {
      const text = document.getElementById('inquiry-output-text')?.value;
      if (text) {
        navigator.clipboard.writeText(text);
        this.showToast('Correspondence letter copied to clipboard!', 'success');
      }
    });

    // Memory Capsules search
    document.getElementById('capsule-search-box')?.addEventListener('input', (e) => {
      this.renderMemoryCapsules(e.target.value);
    });

    // Revision Sprint & Pomodoro Controls
    document.querySelectorAll('.btn-timer-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-timer-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mins = parseInt(btn.dataset.minutes, 10);
        this.setTimerPreset(mins);
      });
    });

    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => {
      this.toggleTimer();
    });

    document.getElementById('btn-timer-reset')?.addEventListener('click', () => {
      this.resetTimer();
    });

    document.querySelectorAll('.sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const soundType = btn.dataset.sound;
        AudioSynthesizer.playSound(soundType);
        if (soundType !== 'off') {
          this.showToast(`Synthesizing ${soundType} acoustic waves (Offline)`, 'info');
        }
      });
    });

    const scratchpad = document.getElementById('sprint-notes');
    if (scratchpad) {
      scratchpad.value = StorageService.getSprintNotes();
      scratchpad.addEventListener('input', (e) => {
        StorageService.saveSprintNotes(e.target.value);
      });
    }

    // Developer Console Actions
    document.getElementById('dev-btn-inject-benchmark')?.addEventListener('click', () => {
      this.loadBenchmarkDemo();
    });

    document.getElementById('dev-btn-purge-storage')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to purge all submissions? This resets storage to a clean slate.")) {
        this.papers = StorageService.clearAllPapers();
        this.selectedRebuttalPaperId = null;
        this.renderAll();
        this.showToast("All submissions purged. Clean slate active.", "info");
      }
    });

    document.getElementById('dev-btn-export-telemetry')?.addEventListener('click', () => {
      const tel = StorageService.getStorageTelemetry();
      const blob = new Blob([JSON.stringify(tel, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `epoche_telemetry_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast("Telemetry diagnostic report exported!", "success");
    });

    document.getElementById('dev-btn-copy-json')?.addEventListener('click', () => {
      const txt = document.getElementById('dev-raw-json-viewer')?.value;
      if (txt) {
        navigator.clipboard.writeText(txt);
        this.showToast("Raw JSON copied to clipboard!", "success");
      }
    });

    // Modal backdrop click to close
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  // =========================================================================
  // Navigation & View Switching
  // =========================================================================
  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    if (tabId === 'tab-pipeline') this.renderPipeline();
    if (tabId === 'tab-rebuttal') this.renderRebuttalSection();
    if (tabId === 'tab-oracle') this.renderOracleSection();
    if (tabId === 'tab-capsule') this.renderMemoryCapsules();
    if (tabId === 'tab-developer') this.renderDeveloperConsole();
  }

  switchPipelineView(viewName) {
    this.activePipelineView = viewName;
    document.getElementById('btn-view-kanban')?.classList.toggle('active', viewName === 'kanban');
    document.getElementById('btn-view-timeline')?.classList.toggle('active', viewName === 'timeline');

    document.getElementById('kanban-view')?.classList.toggle('hidden', viewName !== 'kanban');
    document.getElementById('timeline-view')?.classList.toggle('hidden', viewName !== 'timeline');

    if (viewName === 'timeline') {
      this.renderTimelineRadar();
    } else {
      this.renderPipeline();
    }
  }

  // =========================================================================
  // Render Engine: Full Application Sync
  // =========================================================================
  renderAll() {
    this.renderPulseBar();
    this.renderPipeline();
    this.renderRebuttalSection();
    this.renderOracleSection();
    this.renderMemoryCapsules();
    this.updateBadges();
    if (this.currentUser.role === 'developer') {
      this.renderDeveloperConsole();
    }
  }

  updateBadges() {
    const pipelineCount = this.papers.length;
    const rebuttalActive = this.papers.filter(p => p.stage === 'revision_war_room').length;

    const bPipeline = document.getElementById('tab-badge-pipeline');
    if (bPipeline) bPipeline.textContent = pipelineCount;

    const bRebuttal = document.getElementById('tab-badge-rebuttal');
    if (bRebuttal) bRebuttal.textContent = rebuttalActive;

    const bCapsules = document.getElementById('tab-badge-capsules');
    if (bCapsules) bCapsules.textContent = pipelineCount;
  }

  renderPulseBar() {
    const total = this.papers.length;
    const underReview = this.papers.filter(p => p.stage === 'under_review').length;
    const activeDeadlines = this.papers.filter(p => {
      if (!p.deadline) return false;
      const d = new Date(p.deadline);
      return !isNaN(d.getTime()) && (d - new Date()) > 0;
    }).length;
    const accepted = this.papers.filter(p => p.stage === 'accepted').length;

    const elTotal = document.getElementById('metric-total-papers');
    const elReview = document.getElementById('metric-under-review');
    const elDeadlines = document.getElementById('metric-urgent-deadlines');
    const elAccepted = document.getElementById('metric-accepted');

    if (elTotal) elTotal.textContent = total;
    if (elReview) elReview.textContent = underReview;
    if (elDeadlines) elDeadlines.textContent = activeDeadlines;
    if (elAccepted) elAccepted.textContent = accepted;

    const urgentBox = document.getElementById('metric-urgent-box');
    if (urgentBox) {
      urgentBox.classList.toggle('pulse-alarm', activeDeadlines > 0);
    }
  }

  // =========================================================================
  // Tab 1: Mission Control & Kanban Pipeline
  // =========================================================================
  renderPipeline() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    // STRICT REALITY: If user has 0 papers, render the welcoming Empty Slate
    if (this.papers.length === 0) {
      board.innerHTML = `
        <div class="empty-pipeline-slate">
          <div class="empty-slate-icon">📑</div>
          <h3 class="empty-slate-title">Your Research Pipeline is Clean</h3>
          <p class="empty-slate-desc">
            No papers have been entered yet. Epoché respects your academic privacy: zero fake submissions are stored on this device until you register them.
          </p>
          <div class="empty-slate-actions">
            <button class="btn btn-primary" onclick="window.epoche.openModal('modal-new-paper')">
              + Register Your First Submission
            </button>
            <button class="btn btn-outline" onclick="window.epoche.openModal('modal-vault')">
              📥 Import .epoche Vault
            </button>
          </div>
          <button class="demo-benchmark-link" onclick="window.epoche.loadBenchmarkDemo()">
            Want to test features first? Click here to load 3 sample benchmark papers (IEEE, Elsevier, ACM)
          </button>
        </div>
      `;
      return;
    }

    const searchQuery = (document.getElementById('filter-search')?.value || '').toLowerCase();
    const publisherFilter = document.getElementById('filter-publisher')?.value || 'all';

    const filteredPapers = this.papers.filter(p => {
      const matchPub = publisherFilter === 'all' || p.publisher === publisherFilter;
      const matchSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery) ||
        p.journal.toLowerCase().includes(searchQuery) ||
        (p.trackingId && p.trackingId.toLowerCase().includes(searchQuery)) ||
        p.authors.some(a => a.name.toLowerCase().includes(searchQuery));
      return matchPub && matchSearch;
    });

    const columns = [
      { id: 'drafting', title: 'Drafting & Lab Prep', color: '#64748b' },
      { id: 'submitted', title: 'Submitted & Queued', color: '#38bdf8' },
      { id: 'under_review', title: 'Under Review', color: '#f59e0b' },
      { id: 'revision_war_room', title: 'Revision War Room', color: '#f43f5e' },
      { id: 'camera_ready', title: 'Camera-Ready & Proofs', color: '#a78bfa' },
      { id: 'accepted', title: 'Accepted & Published', color: '#10b981' }
    ];

    board.innerHTML = '';

    columns.forEach(col => {
      const colPapers = filteredPapers.filter(p => p.stage === col.id);

      const colEl = document.createElement('div');
      colEl.className = 'kanban-column';
      colEl.innerHTML = `
        <div class="kanban-column-header">
          <div class="column-title-group">
            <span class="column-color-bar" style="background-color: ${col.color};"></span>
            <span class="column-title">${col.title}</span>
          </div>
          <span class="column-count">${colPapers.length}</span>
        </div>
        <div class="kanban-column-cards" data-stage="${col.id}">
          ${colPapers.length > 0 
            ? colPapers.map(p => this.createPaperCardHTML(p)).join('')
            : `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 11px;">No papers in this stage</div>`}
        </div>
      `;

      board.appendChild(colEl);
    });

    // Attach click handlers to cards
    board.querySelectorAll('.paper-card').forEach(card => {
      card.addEventListener('click', () => {
        const paperId = card.dataset.id;
        this.openPaperDetailsModal(paperId);
      });
    });
  }

  createPaperCardHTML(p) {
    const isUrgent = this.isUrgentDeadline(p.deadline);
    const timingHTML = this.calculateTimingDisplay(p);

    const commentsTotal = p.reviewerComments?.length || 0;
    const commentsApproved = p.reviewerComments?.filter(c => c.status === 'approved').length || 0;

    return `
      <div class="paper-card ${isUrgent ? 'urgent-card' : ''}" data-id="${p.id}">
        <div class="paper-card-top">
          <span class="publisher-badge">${p.publisher || 'SCI'}</span>
          <span class="tracking-id">${p.trackingId || 'Unassigned ID'}</span>
        </div>
        
        <h4 class="paper-title" title="${p.title}">${p.title}</h4>
        <div class="journal-name" title="${p.journal}">${p.journal}</div>

        <div class="authors-pill-row">
          ${p.authors.slice(0, 3).map(a => `
            <span class="author-chip ${a.isLead ? 'lead' : ''}">${a.name}</span>
          `).join('')}
          ${p.authors.length > 3 ? `<span class="author-chip">+${p.authors.length - 3}</span>` : ''}
        </div>

        <div class="card-timing-box">
          <span class="timing-label">${timingHTML.label}</span>
          <span class="timing-value ${timingHTML.cssClass}">${timingHTML.value}</span>
        </div>

        <div class="card-footer-indicators">
          <div class="card-capsule-icons">
            ${p.memoryCapsule?.overleafUrl ? '<span class="capsule-badge-icon" title="Overleaf Linked">🌿</span>' : ''}
            ${p.memoryCapsule?.gitBranch ? '<span class="capsule-badge-icon" title="Git Commit Anchored">💻</span>' : ''}
            ${p.memoryCapsule?.datasetUrl ? '<span class="capsule-badge-icon" title="Dataset Attached">📊</span>' : ''}
          </div>
          ${commentsTotal > 0 ? `
            <span class="chip ${commentsApproved === commentsTotal ? 'chip-emerald' : 'chip-amber'}">
              ${commentsApproved}/${commentsTotal} Resolved
            </span>
          ` : `
            <span class="chip chip-neutral">${p.impactFactor ? `IF: ${p.impactFactor}` : 'Peer Track'}</span>
          `}
        </div>
      </div>
    `;
  }

  isUrgentDeadline(deadlineStr) {
    if (!deadlineStr) return false;
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return false;
    const diffDays = (d - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 7;
  }

  calculateTimingDisplay(paper) {
    const now = new Date();

    if (paper.stage === 'under_review') {
      if (paper.submissionDate) {
        const sub = new Date(paper.submissionDate);
        const days = Math.floor((now - sub) / (1000 * 60 * 60 * 24));
        return {
          label: 'In Review',
          value: `Day ${days} elapsed`,
          cssClass: days > 90 ? 'ticking-red' : 'ticking-amber'
        };
      }
      return { label: 'In Review', value: 'Active', cssClass: 'ticking-amber' };
    }

    if (paper.deadline) {
      const deadline = new Date(paper.deadline);
      const diffMs = deadline - now;
      if (diffMs <= 0) {
        return { label: 'Deadline', value: 'EXPIRED', cssClass: 'ticking-red' };
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return {
        label: 'Time Left',
        value: `${days}d ${hours}h left`,
        cssClass: days <= 5 ? 'ticking-red' : 'ticking-cyan'
      };
    }

    if (paper.stage === 'accepted') {
      return { label: 'Status', value: 'Published 🎉', cssClass: 'ticking-cyan' };
    }

    return { label: 'Stage', value: paper.stage.replace('_', ' '), cssClass: '' };
  }

  // =========================================================================
  // Timeline / Radar View
  // =========================================================================
  renderTimelineRadar() {
    const container = document.getElementById('timeline-cards-list');
    if (!container) return;

    if (this.papers.length === 0) {
      container.innerHTML = `
        <div class="empty-pipeline-slate">
          <p>No manuscripts to display on the deadline radar. Register a submission to track cycle times.</p>
        </div>
      `;
      return;
    }

    const underReviewOrActive = this.papers.filter(p => p.stage !== 'drafting');

    container.innerHTML = underReviewOrActive.map(p => {
      const timing = this.calculateTimingDisplay(p);
      const portalInfo = GLOBAL_PORTALS.find(portal => portal.publisher === p.publisher) || GLOBAL_PORTALS[0];
      const benchmarkDays = portalInfo.avgFirstDecisionDays;
      const daysIn = p.submissionDate ? Math.max(0, Math.floor((new Date() - new Date(p.submissionDate)) / (1000 * 60 * 60 * 24))) : 0;
      const progressPercent = Math.min(100, Math.round((daysIn / benchmarkDays) * 100));

      return `
        <div class="section-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="publisher-badge">${p.publisher}</span>
              <span class="tracking-id" style="margin-left: 8px;">${p.trackingId || 'N/A'}</span>
              <h3 style="font-size: 15px; margin-top: 6px;">${p.title}</h3>
              <p style="font-size: 12px; color: var(--text-secondary);">${p.journal}</p>
            </div>
            <div style="text-align: right;">
              <span class="chip ${timing.cssClass ? 'chip-amber' : 'chip-neutral'}">${timing.value}</span>
              ${p.deadline ? `<p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Deadline: ${p.deadline}</p>` : ''}
            </div>
          </div>

          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Peer-Review Turnaround Progress (vs ${p.publisher} ${benchmarkDays}-day benchmark)</span>
              <span><strong>${daysIn}</strong> of ${benchmarkDays} days (${progressPercent}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progressPercent}%; ${progressPercent >= 100 ? 'background: var(--rose-primary);' : ''}"></div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <button class="btn btn-outline btn-xs" onclick="window.epoche.openPaperDetailsModal('${p.id}')">View Details</button>
            ${p.portalUrl ? `<a href="${p.portalUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-xs">Open Journal Portal ↗</a>` : ''}
            ${daysIn > portalInfo.inquiryWindowDays ? `
              <button class="btn btn-accent btn-xs" onclick="window.epoche.jumpToInquiryLetter('${p.id}')">
                ✉️ Recommended: Send Inquiry Letter
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  jumpToInquiryLetter(paperId) {
    this.switchTab('tab-oracle');
    const select = document.getElementById('inquiry-paper-select');
    if (select) {
      select.value = paperId;
      this.updateInquiryLetter();
    }
  }

  // =========================================================================
  // Tab 2: Rebuttal War Room & Comment Dissector
  // =========================================================================
  renderRebuttalSection() {
    const select = document.getElementById('rebuttal-paper-select');

    if (this.papers.length === 0) {
      if (select) {
        select.innerHTML = `<option value="">No papers registered yet</option>`;
      }
      const titleEl = document.getElementById('rebuttal-paper-title-display');
      if (titleEl) titleEl.textContent = "No Submissions Registered Yet";

      const list = document.getElementById('comments-card-list');
      if (list) {
        list.innerHTML = `
          <div class="empty-pipeline-slate" style="padding: 40px 20px;">
            <div class="empty-slate-icon">⚔️</div>
            <h4>Rebuttal Room Awaiting Submissions</h4>
            <p>Register your manuscript to parse reviewer feedback, delegate tasks to co-authors, and generate response letters.</p>
            <button class="btn btn-primary btn-sm" onclick="window.epoche.openModal('modal-new-paper')">+ Register Submission</button>
          </div>
        `;
      }
      return;
    }

    if (select) {
      select.innerHTML = this.papers.map(p => `
        <option value="${p.id}" ${p.id === this.selectedRebuttalPaperId ? 'selected' : ''}>
          ${p.title.length > 60 ? p.title.substring(0, 60) + '...' : p.title} (${p.reviewerComments?.length || 0} comments)
        </option>
      `).join('');
    }

    const currentPaper = this.papers.find(p => p.id === this.selectedRebuttalPaperId) || this.papers[0];
    if (!currentPaper) return;

    this.selectedRebuttalPaperId = currentPaper.id;

    const titleEl = document.getElementById('rebuttal-paper-title-display');
    if (titleEl) titleEl.textContent = currentPaper.title;

    const comments = currentPaper.reviewerComments || [];
    const total = comments.length;
    const resolved = comments.filter(c => c.status === 'approved').length;
    const pct = total === 0 ? 0 : Math.round((resolved / total) * 100);

    const statsCounter = document.getElementById('rebuttal-stats-counter');
    if (statsCounter) statsCounter.textContent = `${resolved} of ${total} Comments Resolved (${pct}%)`;

    const progFill = document.getElementById('rebuttal-progress-fill');
    if (progFill) progFill.style.width = `${pct}%`;

    const urgencyChip = document.getElementById('rebuttal-urgency-chip');
    if (urgencyChip) {
      if (pct === 100 && total > 0) {
        urgencyChip.className = 'chip chip-emerald';
        urgencyChip.textContent = 'Ready to Submit!';
      } else if (currentPaper.deadline && this.isUrgentDeadline(currentPaper.deadline)) {
        urgencyChip.className = 'chip chip-rose';
        urgencyChip.textContent = 'Critical Sprint';
      } else {
        urgencyChip.className = 'chip chip-amber';
        urgencyChip.textContent = 'In Progress';
      }
    }

    this.renderCommentCards(currentPaper);
  }

  renderCommentCards(paper) {
    const list = document.getElementById('comments-card-list');
    if (!list) return;

    let comments = paper.reviewerComments || [];
    if (this.currentReviewerFilter !== 'all') {
      comments = comments.filter(c => c.reviewer === this.currentReviewerFilter);
    }

    if (comments.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-surface-elevated); border-radius: var(--radius-md);">
          <p style="font-size: 15px; margin-bottom: 8px;">No reviewer comments recorded for this paper.</p>
          <p style="font-size: 12px;">Paste your raw review email in the left box and click <strong>"Parse & Distribute"</strong> to auto-generate the action matrix.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-item-card status-${c.status}" data-comment-id="${c.id}">
        <div class="comment-card-header">
          <div class="comment-tag-row">
            <span class="reviewer-id-badge">${c.reviewer} • Point ${c.point}</span>
            <select class="select-severity" data-comment-id="${c.id}">
              <option value="major" ${c.severity === 'major' ? 'selected' : ''}>Major Flaw</option>
              <option value="minor" ${c.severity === 'minor' ? 'selected' : ''}>Minor Issue</option>
            </select>
          </div>
          <div class="comment-meta-controls">
            <label style="font-size: 11px; color: var(--text-muted);">Assignee:</label>
            <select class="select-assignee" data-comment-id="${c.id}">
              ${paper.authors.map(a => `
                <option value="${a.name}" ${c.assignee === a.name ? 'selected' : ''}>${a.name}</option>
              `).join('')}
              <option value="Unassigned" ${c.assignee === 'Unassigned' ? 'selected' : ''}>Unassigned</option>
            </select>

            <select class="select-status" data-comment-id="${c.id}">
              <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="in_progress" ${c.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="drafted" ${c.status === 'drafted' ? 'selected' : ''}>Drafted</option>
              <option value="approved" ${c.status === 'approved' ? 'selected' : ''}>Approved by PI</option>
            </select>

            <button class="btn btn-ghost btn-xs btn-delete-comment" data-comment-id="${c.id}" title="Remove comment">✕</button>
          </div>
        </div>

        <div class="comment-quote-box">
          "${c.quote}"
        </div>

        <div class="response-draft-area">
          <span class="response-label">Team Rebuttal Response:</span>
          <textarea class="comment-response-textarea" data-comment-id="${c.id}" placeholder="Draft response to the reviewer...">${c.response || ''}</textarea>
        </div>

        <div class="manuscript-changes-row">
          <span style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">Manuscript Changes:</span>
          <input type="text" class="manuscript-changes-input" data-comment-id="${c.id}" value="${c.manuscriptChange || ''}" placeholder="e.g. Added Figure 8(c) and updated Section IV-B on Page 6.">
        </div>
      </div>
    `).join('');

    // Attach listeners
    list.querySelectorAll('.comment-response-textarea').forEach(tx => {
      tx.addEventListener('change', (e) => {
        this.updateCommentField(paper.id, e.target.dataset.commentId, 'response', e.target.value);
      });
    });

    list.querySelectorAll('.manuscript-changes-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        this.updateCommentField(paper.id, e.target.dataset.commentId, 'manuscriptChange', e.target.value);
      });
    });

    list.querySelectorAll('.select-assignee').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this.updateCommentField(paper.id, e.target.dataset.commentId, 'assignee', e.target.value);
      });
    });

    list.querySelectorAll('.select-status').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this.updateCommentField(paper.id, e.target.dataset.commentId, 'status', e.target.value);
        this.renderRebuttalSection();
      });
    });

    list.querySelectorAll('.select-severity').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this.updateCommentField(paper.id, e.target.dataset.commentId, 'severity', e.target.value);
      });
    });

    list.querySelectorAll('.btn-delete-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteComment(paper.id, btn.dataset.commentId);
      });
    });

    document.querySelectorAll('.comment-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comment-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentReviewerFilter = btn.dataset.reviewer;
        this.renderCommentCards(paper);
      });
    });
  }

  updateCommentField(paperId, commentId, field, value) {
    const paper = this.papers.find(p => p.id === paperId);
    if (!paper) return;
    const comment = paper.reviewerComments?.find(c => c.id === commentId);
    if (!comment) return;

    comment[field] = value;
    StorageService.savePaper(paper);
  }

  deleteComment(paperId, commentId) {
    const paper = this.papers.find(p => p.id === paperId);
    if (!paper) return;
    paper.reviewerComments = paper.reviewerComments.filter(c => c.id !== commentId);
    StorageService.savePaper(paper);
    this.renderRebuttalSection();
    this.showToast('Comment removed from rebuttal matrix', 'info');
  }

  handleDissectComments() {
    const rawText = document.getElementById('raw-review-input')?.value;
    if (!rawText || !rawText.trim()) {
      this.showToast('Please paste reviewer feedback text first.', 'error');
      return;
    }

    const paper = this.papers.find(p => p.id === this.selectedRebuttalPaperId);
    if (!paper) {
      this.showToast('Please select or register a paper first.', 'error');
      return;
    }

    const parsed = ReviewerParser.dissect(rawText, paper.authors);
    if (parsed.length === 0) {
      this.showToast('Could not detect distinct comments. Try checking the format.', 'error');
      return;
    }

    paper.reviewerComments = [...(paper.reviewerComments || []), ...parsed];
    StorageService.savePaper(paper);

    this.renderRebuttalSection();
    this.renderPipeline();
    this.showToast(`⚡ Dissected and created ${parsed.length} actionable cards!`, 'success');

    document.getElementById('raw-review-input').value = '';
  }

  handleAddCustomComment() {
    const paper = this.papers.find(p => p.id === this.selectedRebuttalPaperId);
    if (!paper) {
      this.showToast('Please select or create a submission first.', 'error');
      return;
    }

    const newComment = {
      id: `c-custom-${Date.now()}`,
      reviewer: 'Reviewer 1',
      point: (paper.reviewerComments?.length || 0) + 1,
      severity: 'minor',
      assignee: paper.authors[0]?.name || 'Unassigned',
      status: 'pending',
      quote: 'New custom reviewer remark or editor query.',
      response: 'In response...',
      manuscriptChange: 'Revised in manuscript.'
    };

    paper.reviewerComments = [...(paper.reviewerComments || []), newComment];
    StorageService.savePaper(paper);
    this.renderRebuttalSection();
    this.showToast('New comment card added', 'info');
  }

  exportRebuttal(format) {
    const paper = this.papers.find(p => p.id === this.selectedRebuttalPaperId);
    if (!paper || !paper.reviewerComments || paper.reviewerComments.length === 0) {
      this.showToast('No comments available to export.', 'error');
      return;
    }

    if (format === 'latex') {
      const tex = RebuttalGenerator.toLaTeX(paper, paper.reviewerComments);
      const blob = new Blob([tex], { type: 'text/x-tex;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rebuttal_${paper.trackingId || 'Response'}.tex`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('LaTeX (.tex) response document downloaded!', 'success');
    } else if (format === 'markdown') {
      const md = RebuttalGenerator.toMarkdown(paper, paper.reviewerComments);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rebuttal_${paper.trackingId || 'Response'}.md`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Markdown (.md) response downloaded!', 'success');
    }
  }

  previewRebuttalLetter() {
    const paper = this.papers.find(p => p.id === this.selectedRebuttalPaperId);
    if (!paper) return;

    const html = RebuttalGenerator.toHTMLPreview(paper, paper.reviewerComments || []);
    const previewEl = document.getElementById('academic-letter-preview-content');
    if (previewEl) previewEl.innerHTML = html;

    this.openModal('modal-rebuttal-preview');
  }

  // =========================================================================
  // Tab 3: Journal Oracle & Inquiry Kit
  // =========================================================================
  renderOracleSection() {
    const grid = document.getElementById('portals-directory-grid');
    if (grid) {
      grid.innerHTML = GLOBAL_PORTALS.map(portal => `
        <div class="portal-entry-card">
          <div class="portal-entry-top">
            <span class="portal-name">${portal.name}</span>
            <span class="publisher-badge">${portal.publisher}</span>
          </div>

          <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">${portal.description}</p>

          <div class="portal-meta-stats">
            <div class="portal-stat-line">
              <span>Avg 1st Decision:</span>
              <strong style="color: var(--cyan-light);">${portal.avgFirstDecisionDays} Days</strong>
            </div>
            <div class="portal-stat-line">
              <span>Inquiry Grace Window:</span>
              <span>${portal.inquiryWindowDays} Days</span>
            </div>
            <div class="portal-stat-line">
              <span>Standard Rebuttal Window:</span>
              <span>${portal.typicalRebuttalDays} Days</span>
            </div>
          </div>

          <a href="${portal.url}" target="_blank" rel="noopener" class="portal-link-btn">
            Access Portal Gateway ↗
          </a>
        </div>
      `).join('');
    }

    const paperSelect = document.getElementById('inquiry-paper-select');
    if (paperSelect) {
      if (this.papers.length === 0) {
        paperSelect.innerHTML = `<option value="">No registered papers</option>`;
      } else {
        paperSelect.innerHTML = this.papers.map(p => `
          <option value="${p.id}">${p.title} (${p.trackingId || 'No ID'})</option>
        `).join('');
      }
    }

    this.updateInquiryLetter();
  }

  updateInquiryLetter() {
    const templateType = document.getElementById('inquiry-template-select')?.value || 'status_inquiry';
    const paperId = document.getElementById('inquiry-paper-select')?.value || this.papers[0]?.id;
    const paper = this.papers.find(p => p.id === paperId);

    const letter = InquiryTemplates.generateLetter(templateType, paper);
    const output = document.getElementById('inquiry-output-text');
    if (output) output.value = letter;
  }

  // =========================================================================
  // Tab 4: Memory Capsules (Anti-Amnesia)
  // =========================================================================
  renderMemoryCapsules(searchFilter = '') {
    const grid = document.getElementById('capsules-grid');
    if (!grid) return;

    if (this.papers.length === 0) {
      grid.innerHTML = `
        <div class="empty-pipeline-slate" style="grid-column: 1 / -1;">
          <div class="empty-slate-icon">🧠</div>
          <h3>No Memory Capsules Saved</h3>
          <p>Memory Capsules anchor Overleaf URLs, Git commits, and experiment setups so you never suffer from post-submission amnesia.</p>
          <button class="btn btn-primary btn-sm" onclick="window.epoche.openModal('modal-new-paper')">+ Create Submission</button>
        </div>
      `;
      return;
    }

    const q = searchFilter.toLowerCase();
    const filtered = this.papers.filter(p => {
      const cap = p.memoryCapsule || {};
      return !q ||
        p.title.toLowerCase().includes(q) ||
        (cap.gitBranch && cap.gitBranch.toLowerCase().includes(q)) ||
        (cap.modelNotes && cap.modelNotes.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">No memory capsules match query.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const cap = p.memoryCapsule || {};
      return `
        <div class="capsule-card">
          <div class="capsule-card-top">
            <span class="publisher-badge">${p.publisher}</span>
            <span class="tracking-id">${p.trackingId || 'N/A'}</span>
          </div>

          <h3>${p.title}</h3>

          <div class="capsule-key-anchors">
            <div class="anchor-row">
              <span class="anchor-title">🌿 Overleaf Project:</span>
              ${cap.overleafUrl ? `
                <a href="${cap.overleafUrl}" target="_blank" rel="noopener" class="anchor-val-link">${cap.overleafUrl}</a>
              ` : '<span style="color: var(--text-muted);">None</span>'}
            </div>

            <div class="anchor-row">
              <span class="anchor-title">💻 Git Checkpoint:</span>
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-main);">${cap.gitBranch || 'None'}</span>
            </div>

            <div class="anchor-row">
              <span class="anchor-title">📊 Dataset / Drive:</span>
              ${cap.datasetUrl ? `
                <a href="${cap.datasetUrl}" target="_blank" rel="noopener" class="anchor-val-link">View Files ↗</a>
              ` : '<span style="color: var(--text-muted);">None</span>'}
            </div>
          </div>

          <div class="capsule-notes-box">
            <strong>Lab Bench / Solver Configuration:</strong><br>
            ${cap.modelNotes || 'No specific experiment notes recorded.'}
          </div>

          <button class="btn btn-outline btn-xs btn-block" onclick="window.epoche.openPaperDetailsModal('${p.id}')">
            Edit Memory Capsule Details
          </button>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // Tab 5: Revision Sprint & Deep Focus Timer
  // =========================================================================
  setTimerPreset(minutes) {
    this.timerDuration = minutes * 60;
    this.timerRemaining = this.timerDuration;
    this.updateTimerDisplay();
  }

  toggleTimer() {
    if (this.timerRunning) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      document.getElementById('timer-btn-text').textContent = '▶ Resume Sprint';
    } else {
      this.timerRunning = true;
      document.getElementById('timer-btn-text').textContent = '⏸ Pause Sprint';
      this.timerInterval = setInterval(() => {
        this.timerRemaining--;
        if (this.timerRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.timerRunning = false;
          AudioSynthesizer.playBellChime();
          this.showToast('🔔 Revision Sprint Complete! Take a 5m break.', 'success');
          this.sprintPhase++;
          document.getElementById('timer-phase-lbl').textContent = `Round ${this.sprintPhase} Complete`;
          this.resetTimer();
        }
        this.updateTimerDisplay();
      }, 1000);
    }
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.timerRunning = false;
    this.timerRemaining = this.timerDuration;
    document.getElementById('timer-btn-text').textContent = '▶ Start Sprint';
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timerRemaining / 60);
    const secs = this.timerRemaining % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const display = document.getElementById('timer-display');
    if (display) display.textContent = str;

    const ring = document.getElementById('timer-progress-ring');
    if (ring) {
      const circumference = 2 * Math.PI * 90;
      const progress = 1 - (this.timerRemaining / this.timerDuration);
      ring.style.strokeDashoffset = circumference * progress;
    }
  }

  // =========================================================================
  // Tab 6: Developer Console (Admin Diagnostics)
  // =========================================================================
  renderDeveloperConsole() {
    const telemetry = StorageService.getStorageTelemetry();

    // Telemetry Grid
    const telGrid = document.getElementById('dev-telemetry-grid');
    if (telGrid) {
      telGrid.innerHTML = `
        <div class="telemetry-item">
          <span class="telemetry-val">${telemetry.paperCount}</span>
          <span class="telemetry-lbl">Active Submissions</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-val">${telemetry.totalKb} KB</span>
          <span class="telemetry-lbl">Local Storage Footprint</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-val">0.00 KB</span>
          <span class="telemetry-lbl">Cloud Leakage (Zero)</span>
        </div>
      `;
    }

    // Session inspector
    const authBox = document.getElementById('dev-auth-inspector');
    if (authBox) {
      authBox.innerHTML = `
        <div><strong>Session ID:</strong> ${this.currentUser.id}</div>
        <div><strong>Active Role:</strong> <span style="color: var(--violet-light); font-weight: bold;">${this.currentUser.role.toUpperCase()}</span></div>
        <div><strong>User Name:</strong> ${this.currentUser.name}</div>
        <div><strong>Scopes:</strong> ${(this.currentUser.permissions || []).join(', ')}</div>
        <div><strong>Login Timestamp:</strong> ${this.currentUser.loginTime}</div>
      `;
    }

    // Raw JSON Viewer
    const jsonViewer = document.getElementById('dev-raw-json-viewer');
    if (jsonViewer) {
      jsonViewer.value = JSON.stringify(this.papers, null, 2);
    }
  }

  // =========================================================================
  // Paper Creation & Editing Modals
  // =========================================================================
  handleCreatePaper() {
    const title = document.getElementById('new-paper-title')?.value;
    const journal = document.getElementById('new-paper-journal')?.value;
    const publisher = document.getElementById('new-paper-publisher')?.value;
    const trackingId = document.getElementById('new-paper-tracking-id')?.value;
    const stage = document.getElementById('new-paper-stage')?.value;
    const authorsStr = document.getElementById('new-paper-authors')?.value;
    const subDate = document.getElementById('new-paper-sub-date')?.value;
    const deadline = document.getElementById('new-paper-deadline')?.value;
    const portalUrl = document.getElementById('new-paper-portal-url')?.value;

    const overleafUrl = document.getElementById('new-paper-overleaf')?.value;
    const gitBranch = document.getElementById('new-paper-git')?.value;
    const datasetUrl = document.getElementById('new-paper-dataset')?.value;
    const modelNotes = document.getElementById('new-paper-notes')?.value;

    const parsedAuthors = authorsStr.split(',').map((item, idx) => ({
      name: item.trim(),
      role: idx === 0 ? 'Lead Author' : 'Co-Author',
      email: '',
      isLead: idx === 0
    }));

    const newPaper = {
      id: `epoche-paper-${Date.now()}`,
      title,
      journal,
      publisher,
      trackingId,
      stage,
      submissionDate: subDate || new Date().toISOString().split('T')[0],
      deadline: deadline || null,
      portalUrl: portalUrl || '',
      impactFactor: '3.5+',
      quartile: 'Q1',
      authors: parsedAuthors,
      memoryCapsule: {
        overleafUrl,
        gitBranch,
        datasetUrl,
        modelNotes,
        zenodoDoi: ''
      },
      reviewerComments: []
    };

    StorageService.savePaper(newPaper);
    this.papers = StorageService.getPapers();
    this.selectedRebuttalPaperId = newPaper.id;
    this.closeModal('modal-new-paper');
    document.getElementById('form-new-paper').reset();

    this.renderAll();
    this.showToast('Manuscript registered successfully!', 'success');
  }

  openPaperDetailsModal(paperId) {
    const paper = this.papers.find(p => p.id === paperId);
    if (!paper) return;

    const modal = document.getElementById('modal-paper-details');
    const titleEl = document.getElementById('modal-paper-title');
    const badgeEl = document.getElementById('modal-paper-stage-badge');
    const bodyEl = document.getElementById('modal-paper-body');

    if (titleEl) titleEl.textContent = paper.title;
    if (badgeEl) badgeEl.textContent = paper.stage.toUpperCase().replace('_', ' ');

    bodyEl.innerHTML = `
      <div class="app-form">
        <div class="form-grid-2">
          <div class="form-group span-2">
            <label class="form-label">Manuscript Title</label>
            <input type="text" id="edit-paper-title" class="form-input" value="${paper.title}">
          </div>

          <div class="form-group">
            <label class="form-label">Journal / Conference</label>
            <input type="text" id="edit-paper-journal" class="form-input" value="${paper.journal}">
          </div>

          <div class="form-group">
            <label class="form-label">Publisher</label>
            <select id="edit-paper-publisher" class="form-input">
              ${['IEEE', 'Elsevier', 'Springer', 'ACM', 'OpenReview', 'arXiv'].map(pub => `
                <option value="${pub}" ${paper.publisher === pub ? 'selected' : ''}>${pub}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Manuscript Tracking ID</label>
            <input type="text" id="edit-paper-tracking" class="form-input" value="${paper.trackingId || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">Current Stage</label>
            <select id="edit-paper-stage" class="form-input">
              <option value="drafting" ${paper.stage === 'drafting' ? 'selected' : ''}>Drafting & Lab Prep</option>
              <option value="submitted" ${paper.stage === 'submitted' ? 'selected' : ''}>Submitted & Queued</option>
              <option value="under_review" ${paper.stage === 'under_review' ? 'selected' : ''}>Under Review</option>
              <option value="revision_war_room" ${paper.stage === 'revision_war_room' ? 'selected' : ''}>Revision War Room</option>
              <option value="camera_ready" ${paper.stage === 'camera_ready' ? 'selected' : ''}>Camera-Ready & Proofs</option>
              <option value="accepted" ${paper.stage === 'accepted' ? 'selected' : ''}>Accepted & Published</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Submission Date</label>
            <input type="date" id="edit-paper-sub-date" class="form-input" value="${paper.submissionDate || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">Critical Deadline (Rebuttal / Camera Ready)</label>
            <input type="date" id="edit-paper-deadline" class="form-input" value="${paper.deadline || ''}">
          </div>

          <div class="form-group span-2">
            <label class="form-label">Portal Tracking URL</label>
            <input type="url" id="edit-paper-portal-url" class="form-input" value="${paper.portalUrl || ''}">
          </div>

          <!-- Memory Capsule Edit -->
          <div class="form-group span-2 memory-group-header">
            <span class="badge-pill">🧠 Memory Capsule (6-Month Amnesia Anchor)</span>
          </div>

          <div class="form-group">
            <label class="form-label">Overleaf Project URL</label>
            <input type="url" id="edit-paper-overleaf" class="form-input" value="${paper.memoryCapsule?.overleafUrl || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">Git Branch / Commit Hash</label>
            <input type="text" id="edit-paper-git" class="form-input" value="${paper.memoryCapsule?.gitBranch || ''}">
          </div>

          <div class="form-group span-2">
            <label class="form-label">Dataset / Drive Link</label>
            <input type="text" id="edit-paper-dataset" class="form-input" value="${paper.memoryCapsule?.datasetUrl || ''}">
          </div>

          <div class="form-group span-2">
            <label class="form-label">Lab Experiment & Hardware Notes</label>
            <textarea id="edit-paper-notes" class="form-input" rows="3">${paper.memoryCapsule?.modelNotes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" class="btn btn-outline" style="color: var(--rose-light);" id="btn-delete-paper-trigger">
            Delete Paper
          </button>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-ghost" onclick="window.epoche.closeModal('modal-paper-details')">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-save-paper-changes">Save Updates</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-save-paper-changes')?.addEventListener('click', () => {
      paper.title = document.getElementById('edit-paper-title').value;
      paper.journal = document.getElementById('edit-paper-journal').value;
      paper.publisher = document.getElementById('edit-paper-publisher').value;
      paper.trackingId = document.getElementById('edit-paper-tracking').value;
      paper.stage = document.getElementById('edit-paper-stage').value;
      paper.submissionDate = document.getElementById('edit-paper-sub-date').value;
      paper.deadline = document.getElementById('edit-paper-deadline').value || null;
      paper.portalUrl = document.getElementById('edit-paper-portal-url').value;

      paper.memoryCapsule = {
        ...paper.memoryCapsule,
        overleafUrl: document.getElementById('edit-paper-overleaf').value,
        gitBranch: document.getElementById('edit-paper-git').value,
        datasetUrl: document.getElementById('edit-paper-dataset').value,
        modelNotes: document.getElementById('edit-paper-notes').value
      };

      StorageService.savePaper(paper);
      this.papers = StorageService.getPapers();
      this.closeModal('modal-paper-details');
      this.renderAll();
      this.showToast('Paper details updated!', 'success');
    });

    document.getElementById('btn-delete-paper-trigger')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete "${paper.title}" from Epoché Command?`)) {
        this.papers = StorageService.deletePaper(paper.id);
        this.selectedRebuttalPaperId = this.papers[0]?.id || null;
        this.closeModal('modal-paper-details');
        this.renderAll();
        this.showToast('Paper deleted from database.', 'info');
      }
    });

    this.openModal('modal-paper-details');
  }

  // =========================================================================
  // Modal & Toast Utilities
  // =========================================================================
  openModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  }

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  loadBenchmarkDemo() {
    this.papers = StorageService.loadBenchmarkDemoPapers();
    this.selectedRebuttalPaperId = this.papers[0]?.id;
    this.renderAll();
    this.showToast('Injected 3 verified benchmark papers (IEEE, Elsevier, ACM)!', 'success');
  }

  startGlobalTimerLoop() {
    setInterval(() => {
      if (this.activeTab === 'tab-pipeline') {
        this.renderPipeline();
      }
    }, 60000);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.epoche = new EpocheApp();
});
