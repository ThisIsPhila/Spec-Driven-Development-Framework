import { renderProjectOverview, renderDecisionOverview } from './views/projectOverviewView.js';
import { renderProfiles } from './views/profilesView.js';
import { PROFILES, INSTALL_COMMAND } from './catalog.js';
import { sanitizeUi, escapeHtml, escapeDisplayModel } from './sanitize.js';
import { renderMarkdown } from './markdown.js';
import { renderMermaidBlocks } from './diagrams.js';
import { generateTraceabilitySvg, generateTraceabilityList } from './traceability.js';
import { renderLandingView } from './views/landingView.js';
import { renderPhaseExplorerView } from './views/phaseExplorerView.js';
import { renderGovernanceView } from './views/governanceView.js';
import { renderReportsView } from './views/reportsView.js';
import { renderAutomationView } from './views/automationView.js';
import { renderKnowledgeView } from './views/knowledgeView.js';
import { ICONS } from './icons.js';
import demoSnapshot from '../demo/demo-project.json';

export class SDDWorkspaceApp {
  constructor(containerId = 'app') {
    this.container = document.getElementById(containerId);
    this.token = this._resolveToken();
    this.projects = [];
    this.currentProjectId = null;
    this.snapshot = null;

    // View Routing:
    // 'landing'  -> Tier 1: Public Framework Landing Page (skills.sh style, zero private data)
    // 'projects' -> Tier 2: Logged In Account Multi-Project Dashboard (all user projects)
    // 'project'  -> Tier 3: Direct Project SDD Page
    // 'profiles' -> Composable Profiles Catalog
    this.currentView = this.token ? 'project' : 'landing';

    // Domain Sections inside 'project' view:
    // 'phases'     -> Phase Explorer & Sprints (handles 50+ phases without header clutter!)
    // 'governance' -> Memory & Rules (Active Context, Project Overview, Decisions, Rules Engine, Exceptions)
    // 'reports'    -> Reports & Audits (Closeout Assessments, Product Roadmap Audits)
    // 'automation' -> Scripts & Hooks (Framework scripts, Git hook status & telemetry)
    // 'knowledge'  -> Docs & Templates & Graphify (Templates, Docs library, Graphify network)
    // 'metrics'    -> Project Engineering Metrics & Assurance Matrix
    this.projectSection = 'overview';

    this.activePhaseId = null; // null = All Sprints Overview, string = specific phase ID
    this.phaseTab = 'overview'; // 'overview' | 'requirements' | 'design' | 'tasks' | 'evidence' | 'remediations' | 'traceability'
    this.phaseScopeFilter = 'all'; // 'all' | 'active' | 'backlog' | 'archive'
    this.phaseSearchQuery = '';

    this.activeGovTab = 'summary';
    this.activeReportId = null;
    this.activeScriptName = 'doctor.sh';
    this.activeKnowledgeSection = 'templates';
    this.selectedKnowledgeItemId = null;

    const route = new URLSearchParams(location.search);
    this.selectedProfileId = route.get('profile');
    this.activePhaseId = route.get('phase') || this.activePhaseId;
    this.phaseTab = route.get('tab') || this.phaseTab;
    this.projectSection = route.get('domain') || this.projectSection;
    this.taskFilter = route.get('filter') || 'all';
    window.addEventListener('popstate', () => { const route = new URLSearchParams(location.search); this.activePhaseId = route.get('phase'); this.phaseTab = route.get('tab') || 'overview'; this.projectSection = route.get('domain') || 'overview'; this.currentView = route.get('view') || (route.get('project') ? 'project' : 'landing'); this.selectedProfileId = route.get('profile'); this.taskFilter = route.get('filter') || 'all'; this.render(); });

    this.connectionStatus = this.token ? 'connecting' : 'public';
    this.sseSource = null;
    this.pollTimer = null;
  }

  _resolveToken() {
    const hash = window.location.hash;
    const hashMatch = hash.match(/token=([a-f0-9]+)/i);
    if (hashMatch) {
      const token = hashMatch[1];
      sessionStorage.setItem('sdd_token', token);
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return token;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    if (queryToken) {
      sessionStorage.setItem('sdd_token', queryToken);
      urlParams.delete('token'); history.replaceState(null, '', location.pathname + (urlParams.size ? '?' + urlParams : ''));
      return queryToken;
    }

    return sessionStorage.getItem('sdd_token') || '';
  }

  async init() {
    const bootstrap = /bootstrap=([a-f0-9]+)/.exec(location.hash)?.[1];
    if (bootstrap) { sessionStorage.setItem('sdd_bootstrap', bootstrap); history.replaceState(null, '', location.pathname + location.search); }
    try {
      const response = await fetch('/api/account/me');
      this.accountsAvailable = response.status === 200 || response.status === 401;
      if (response.ok) { this.accountSession = await response.json(); this.connectionStatus = 'account'; this._setupGlobalKeyboardShortcuts(); const demoIndex=['demo-orbit-notes','demo-harbor-api','demo-meadow-mobile'].indexOf(new URLSearchParams(location.search).get('project')); if (demoIndex>=0) this._loadStaticDemo(demoIndex); else await this._loadProjects(); this._setupVisibilityListener(); return; }
    } catch {}
    this._setupGlobalKeyboardShortcuts();
    if (this.token) {
      await this._loadProjects();
    } else {
      const demoIndex = ['demo-orbit-notes','demo-harbor-api','demo-meadow-mobile'].indexOf(new URLSearchParams(location.search).get('project'));
      if (demoIndex >= 0) this._loadStaticDemo(demoIndex);
      else if (new URLSearchParams(location.search).get('view') === 'profiles') { this.currentView='profiles'; this.render(); }
      else this._loadPublicLanding();
    }
    this._setupVisibilityListener();
  }

  _loadPublicLanding() {
    this.connectionStatus = 'public';
    this.currentView = 'landing';
    this.snapshot = null;
    this.render();
  }

  async _loadProjects() {
    this.projectListError='';
    if (this.token || this.accountSession) {
      try {
        const res = await fetch('/api/projects', this._requestOptions());
        if (res.ok) {
          this.projects = await res.json();
          if (this.accountSession && !new URLSearchParams(location.search).get('project')) { this.currentView = ['landing','profiles','account'].includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'projects'; this.render(); return; }
          if (this.projects.length > 0) {
            await this.selectProject(this.projects.find(project => project.id === new URLSearchParams(location.search).get('project'))?.id || this.projects[0].id);
            return;
          }
        }
      } catch {
        // Fall back to demo
      }
    }

    if (this.accountSession) { this.projects = []; this.currentView = 'projects'; this.render(); return; }
    if (this.token) { this.connectionStatus = 'offline'; this.currentView = 'projects'; this.render(); return; }
    this._loadStaticDemo();
  }

  _loadStaticDemo(index = 0) {
    const examples = [{id:'demo-orbit-notes',name:'Orbit Notes',profile:'web'}, {id:'demo-harbor-api',name:'Harbor API',profile:'api'}, {id:'demo-meadow-mobile',name:'Meadow Mobile',profile:'mobile'}];
    const example = examples[index] || examples[0];
    if (!this.accountSession) this.projects = examples.map(project => ({...project,phasesCount:demoSnapshot.phases.length,metrics:demoSnapshot.metrics}));
    this.currentProjectId = example.id;
    this.snapshot = structuredClone(demoSnapshot);
    this.snapshot.projectId = example.name; this.snapshot.profile = example.profile;
    const route = new URLSearchParams(location.search);
    this.activePhaseId = route.get('project') === example.id && this.snapshot.phases.some(phase => phase.id === route.get('phase')) ? route.get('phase') : this.snapshot.activePhaseId;
    for (const phase of this.snapshot.phases) {
      for (const [type, artifact] of Object.entries(phase.artifacts || {})) if (artifact && typeof artifact.content === 'string') artifact.path ||= `.sdd/specs/${phase.category || 'active'}/${phase.id}/${type}.md`;
      for (const record of phase.artifacts?.evidence || []) record.path ||= `.sdd/evidence/${phase.id}/${record.filename}`;
    }
    if (route.get('project') !== example.id) this.projectSection = 'overview';
    this.connectionStatus = 'demo'; this.currentView = 'project'; this.render();
  }

  async _showProjects() {
    this.projectListError = '';
    if (this.token || this.accountSession) {
      try {
        const response=await fetch('/api/projects',this._requestOptions());
        if (response.status===401 && this.accountSession) {this.accountSession=null;this.projects=[];this.snapshot=null;}
        if (!response.ok) throw new Error(response.status===401?'Your session expired. Sign in again to view your projects.':'Projects could not be loaded. Try again.');
        this.projects=await response.json();
      } catch(error) { this.projectListError=error.message; }
    }
    this.currentView='projects'; this._syncRoute(true); this.render();
  }

  async selectProject(projectId) {
    if (projectId.startsWith('demo-')) { const index = ['demo-orbit-notes','demo-harbor-api','demo-meadow-mobile'].indexOf(projectId); this._loadStaticDemo(index); return; }
    this.connectionStatus = this.accountSession ? 'account' : 'connecting';
    const changed = this.currentProjectId !== projectId;
    this.currentProjectId = projectId;
    this.currentView = 'project';
    if (changed) { this.snapshot = null; this.activePhaseId = null; this.phaseTab = 'overview'; }
    await this._fetchSnapshot();
    const route = new URLSearchParams(location.search);
    if (route.get('project') !== projectId) this.projectSection = 'overview';
    this.phaseTab = route.get('project') === projectId ? route.get('tab') || 'overview' : 'overview';
    this.activePhaseId = this.snapshot?.phases?.some(p => p.id === route.get('phase')) && route.get('project') === projectId ? route.get('phase') : this.snapshot?.activePhaseId;
    if (!this.snapshot?.phases?.some(p => p.id === this.activePhaseId)) this.activePhaseId = null;
    this._connectSSE();
    this._startPolling();
    this.render();
  }

  async _fetchSnapshot() {
    if (this.connectionStatus === 'demo' || this.connectionStatus === 'public') return;
    try {
      const res = await fetch(`/api/project/${this.currentProjectId}/snapshot`, { ...this._requestOptions(), headers: { ...this._requestOptions().headers, ...(this.snapshot?.contentRevision ? {'If-None-Match':this.snapshot.contentRevision} : {}) } });
      if (res.status === 304) { this.connectionStatus = this.snapshot?.readStatus === 'stale' ? 'stale' : this.accountSession ? 'account' : 'live'; return; }
      if (res.ok) {
        const data = await res.json();
        const prevRev = this.snapshot?.contentRevision;
        this.snapshot = data;
        this.connectionStatus = data.readStatus === 'stale' ? 'stale' : this.accountSession ? 'account' : 'live';

        if (prevRev && prevRev !== data.contentRevision) {
          const scroll = window.scrollY;
          this.render();
          window.scrollTo(0, scroll);
        }
      } else {
        this.connectionStatus = 'offline';
        this._updateStatusBar();
      }
    } catch {
      this.connectionStatus = 'offline';
      this._updateStatusBar();
    }
  }

  async _connectSSE() {
    if (this.accountSession || !this.token) return;
    this.sseSource?.close();
    const controller = new AbortController(); this.sseSource = { close: () => controller.abort() };
    try {
      const response = await fetch(`/api/project/${this.currentProjectId}/events`, { ...this._requestOptions(), signal: controller.signal });
      if (!response.ok) throw new Error('Stream unavailable');
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          const data = event.split('\n').find(line => line.startsWith('data: '));
          if (!data) continue;
          const message = JSON.parse(data.slice(6));
          if (message.type === 'update' && message.snapshot) { this.snapshot = message.snapshot; this.connectionStatus = message.snapshot.readStatus === 'stale' ? 'stale' : 'live'; this.render(); }
        }
      }
    } catch { if (!controller.signal.aborted) { this.connectionStatus = 'polling'; this._updateStatusBar(); } }
  }

  _startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && (this.token || this.accountSession)) {
        this._fetchSnapshot();
      }
    }, 2000);
  }

  _setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && (this.token || this.accountSession)) {
        this._fetchSnapshot();
      }
    });
  }

  _setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchEl = document.getElementById('skills-search-input');
        if (searchEl) searchEl.focus();
      }
    });
  }

  render() {
    if (!this.container) return;
    this._syncRoute();
    const navigationKey = [this.currentView,this.currentProjectId,this.projectSection,this.activePhaseId,this.phaseTab,this.selectedProfileId].join(':');
    const changedView = this.renderedNavigationKey !== navigationKey;
    this.renderedNavigationKey = navigationKey;

    const previousFocus = document.activeElement?.id;
    const readingPositions = [...this.container.querySelectorAll('[class]')].filter(el => el.scrollTop || el.scrollLeft).map(el => ({ key: el.className, top: el.scrollTop, left: el.scrollLeft }));
    const openDetails = [...this.container.querySelectorAll('details')].map(el => el.open);
    this.container.innerHTML = sanitizeUi(`
      <div class="skills-layout">
        <!-- Clean, Un-cluttered Header -->
        <header class="skills-header">
          ${this._renderHeaderContent()}
        </header>

        <!-- Main Page Container -->
        <main class="page-container">
          ${this.snapshot?.readStatus === 'stale' ? `<div class="domain-content-card" role="status">${escapeHtml(this.snapshot.readError)}</div>` : ''}
          ${this.currentView==='project'?`<p class="workspace-location">Projects / ${escapeHtml(this.snapshot?.projectId || 'Project')} / ${escapeHtml(({overview:'Overview',phases:'Phases',governance:'Decisions & context',reports:'Reviews',automation:'Checks & automation',knowledge:'Resources & graphs'})[this.projectSection] || 'Overview')}</p><div class="project-shell">${this._renderProjectRail()}<div class="project-content">${this._renderCurrentView()}</div></div>`:this._renderCurrentView()}
          ${this.currentView==='landing'?this._renderFooter():''}
        </main>
      </div>
    `);

    const accountButton = document.createElement('button'); accountButton.className = 'btn btn-secondary';
    accountButton.textContent = 'Sign in';
    if (this.accountsAvailable && !this.accountSession) { this.container.querySelector('.header-right').append(accountButton); accountButton.addEventListener('click', () => this._showAccountDialog()); }
    if (this.accountSession) {
      const logout = document.createElement('button'); logout.className = 'btn btn-secondary'; logout.textContent = 'Sign out';
      logout.onclick = async () => { await fetch('/api/account/logout', {method:'POST'}); this.accountSession = null; this.snapshot = null; this.projects = []; this._loadPublicLanding(); };
      this.container.querySelector('#account-settings-actions')?.append(logout);
    }
    this._bindEvents();
    if (changedView) window.scrollTo(0,0);
    for (const position of readingPositions) {
      const el = [...this.container.querySelectorAll('[class]')].find(el => el.className === position.key);
      if (el) { el.scrollTop = position.top; el.scrollLeft = position.left; }
    }
    this.container.querySelectorAll('details').forEach((el, i) => { el.open = openDetails[i] || false; });
    if (previousFocus) document.getElementById(previousFocus)?.focus({ preventScroll: true });

    if (this.currentView === 'project') {
      renderMermaidBlocks(this.container);
    }
  }

  _syncRoute(push = false) {
    const url = new URL(location.href);
    url.searchParams.set('view',this.currentView);
    if (this.currentView==='profiles' && this.selectedProfileId) url.searchParams.set('profile',this.selectedProfileId); else url.searchParams.delete('profile');
    if (this.currentView !== 'project') { for (const key of ['project','phase','tab','domain','filter']) url.searchParams.delete(key); if (url.href !== location.href) history.replaceState(null,'',url); return; }
    for (const [key, value] of Object.entries({project:this.currentProjectId,phase:this.activePhaseId,tab:this.phaseTab,domain:this.projectSection,filter:this.taskFilter})) { if (value) url.searchParams.set(key,value); else url.searchParams.delete(key); }
    if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
  }

  _requestOptions() { return this.accountSession ? { credentials: 'same-origin' } : { headers: { Authorization: `Bearer ${this.token}` } }; }

  async _showAccountDialog() {
    const dialog = document.createElement('dialog'); dialog.className = 'source-dialog account-dialog';
    dialog.innerHTML = sanitizeUi(`<h2>Sign in or create an account</h2><p>This account is stored by this SDD service. It is not a Google or GitHub login.</p><p>${sessionStorage.getItem('sdd_bootstrap') ? 'Your private setup link will connect the configured projects after you sign in or create an account.' : 'New accounts start empty. Connect your projects after signing in.'}</p><label for="account-email">Email</label><input id="account-email" type="email" autocomplete="username" required maxlength="254"><label for="account-password">Password</label><input id="account-password" type="password" autocomplete="current-password" required maxlength="256" aria-describedby="account-password-help"><p id="account-password-help">Creating an account requires 12–256 characters. To sign in, use the password you previously chose.</p><label class="account-show-password"><input id="account-show-password" type="checkbox"> Show password</label><p id="account-error" role="alert" aria-live="assertive"></p><div class="account-actions"><button class="btn btn-primary" id="account-login">Sign in</button><button class="btn btn-secondary" id="account-register">Create account</button><button class="btn btn-secondary" id="account-close">Cancel</button></div>`);
    const emailField = dialog.querySelector('#account-email'), passwordField = dialog.querySelector('#account-password'), feedback = dialog.querySelector('#account-error');
    const actionButtons = [...dialog.querySelectorAll('#account-login, #account-register')];
    let busy = false;
    dialog.querySelector('#account-show-password').addEventListener('change', e => { passwordField.type = e.target.checked ? 'text' : 'password'; });
    const submit = async action => {
      if (busy) return;
      const email = emailField.value.trim(), password = passwordField.value;
      emailField.removeAttribute('aria-invalid'); passwordField.removeAttribute('aria-invalid');
      if (!email || !emailField.checkValidity()) { feedback.textContent = 'Enter a valid email address, such as name@example.com.'; emailField.setAttribute('aria-invalid','true'); emailField.focus(); return; }
      if (!password || password.length > 256 || (action === 'register' && password.length < 12)) { feedback.textContent = action === 'register' ? 'Choose a password of 12–256 characters to create your account.' : 'Enter your account password.'; passwordField.setAttribute('aria-invalid','true'); passwordField.focus(); return; }
      busy = true; dialog.setAttribute('aria-busy','true'); actionButtons.forEach(button => {button.disabled = true;});
      feedback.textContent = action === 'register' ? 'Creating your account…' : 'Signing in…';
      try {
        const response = await fetch('/api/account/' + action, { method: 'POST', signal: AbortSignal.timeout(15000), headers: {'Content-Type':'application/json', ...(sessionStorage.getItem('sdd_bootstrap') ? {'X-SDD-Bootstrap':sessionStorage.getItem('sdd_bootstrap')} : {})}, body: JSON.stringify({ email, password }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) { feedback.textContent = result.error || 'The account service could not complete the request. Try again.'; return; }
        sessionStorage.removeItem('sdd_bootstrap'); this.accountSession = result; this.connectionStatus = 'account'; dialog.close(); this.currentView='projects'; this._syncRoute(); await this._loadProjects();
        const notice = document.createElement('p'); notice.className = 'account-success'; notice.setAttribute('role','status'); notice.textContent = action === 'register' ? 'Account created. You are signed in.' : 'You are signed in.'; this.container.prepend(notice);
      } catch { feedback.textContent = 'Could not reach the account service. Your entries are preserved; check the connection and try again.'; }
      finally { busy = false; dialog.removeAttribute('aria-busy'); actionButtons.forEach(button => {button.disabled = false;}); }
    };
    for (const action of ['login','register']) dialog.querySelector('#account-' + action).addEventListener('click', () => submit(action));
    passwordField.addEventListener('keydown', e => {if (e.key === 'Enter') {e.preventDefault(); submit('login');}});
    dialog.querySelector('#account-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove()); document.body.append(dialog); dialog.showModal(); emailField.focus();
  }

  async _showConnectorDialog() {
    const response = await fetch('/api/account/connector', { method: 'POST' });
    if (!response.ok) return;
    const { token } = await response.json();
    const dialog = document.createElement('dialog'); dialog.className = 'source-dialog';
    dialog.innerHTML = sanitizeUi(`<h2>Connect a machine</h2><p>This credential grants publishing access to your account for 30 days. Keep it private. Add the URL and credential to your workspace process environment, then launch with the project paths you want to share.</p><pre><code>SDD_SYNC_URL=${escapeHtml(location.origin)}
SDD_SYNC_TOKEN=${escapeHtml(token)}
SDD_DEVICE_ID=choose-a-stable-machine-name

npm --prefix visual run workspace -- --project /path/to/project --project /path/to/another</code></pre>`);
    const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = () => dialog.close(); dialog.prepend(close);
    const revoke = document.createElement('button'); revoke.textContent = 'Revoke all machine credentials';
    revoke.onclick = async () => { const response = await fetch('/api/account/connector/revoke',{method:'POST'}); if (response.ok) { dialog.querySelector('pre').textContent = 'All connector credentials revoked. Issue a new credential to reconnect a machine.'; revoke.disabled = true; } }; dialog.append(revoke);
    dialog.addEventListener('close', () => dialog.remove()); document.body.append(dialog); dialog.showModal();
  }

  async _openArtifact(sourcePath) {
    let response;
    if (this.connectionStatus === 'demo') {
      const find = value => {
        if (!value || typeof value !== 'object') return null;
        if (value.path === sourcePath && typeof value.content === 'string') return value.content;
        for (const child of Object.values(value)) { const result = find(child); if (result !== null) return result; }
        return null;
      };
      const content = find(this.snapshot);
      response = new Response(content || '', {status:content === null ? 404 : 200});
    } else {
      if (!this.token && !this.accountSession) return;
      response = await fetch(`/api/project/${this.currentProjectId}/artifact?path=${encodeURIComponent(sourcePath)}`, this._requestOptions());
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'source-dialog';
    if (!response.ok) { dialog.textContent = 'Source unavailable or outside permitted scope.'; }
    else if (response.headers.get('Content-Type')?.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(await response.blob());
      const image = document.createElement('img'); image.src = objectUrl; image.alt = sourcePath; image.style.maxWidth = '100%'; dialog.append(image);
      dialog.addEventListener('close', () => URL.revokeObjectURL(objectUrl));
    } else {
      const content = await response.text();
      dialog.innerHTML = sanitizeUi(`<h2>${escapeHtml(sourcePath)}</h2><pre><code>${escapeHtml(content)}</code></pre>`);
    }
    const close = document.createElement('button'); close.textContent = 'Close';
    close.addEventListener('click', () => { dialog.close(); dialog.remove(); });
    dialog.prepend(close); dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog); dialog.showModal();
  }

  _renderHeaderContent() {
    return `<div class="header-brand" id="brand-home-btn"><span class="font-mono font-bold">▲ / SDD</span></div>
      <nav class="global-nav" aria-label="Main navigation">
        ${this.token || this.accountSession ? `<button class="nav-link ${this.currentView==='projects'?'active':''}" id="nav-projects-dashboard-btn">Projects</button>` : `<button class="nav-link" id="connect-workspace-header-btn">Open local project</button>`}
        <button class="nav-link ${this.currentView==='profiles'?'active':''}" id="nav-profiles-btn">Skills & Profiles</button>
        <button class="nav-link ${this.currentView==='landing'?'active':''}" id="nav-landing-page-btn">About</button>
      </nav><div class="header-right">${this.accountSession?`<button class="nav-link" id="nav-account-btn">Account</button>`:''}</div>`;
  }

  _renderProjectRail() {
    const sections=[['overview','Project overview'],['phases','Phases'],['governance','Decisions & context'],['reports','Reviews'],['automation','Checks & automation'],['knowledge','Resources & graphs']];
    return `<nav class="project-section-rail" aria-label="Project sections"><p class="eyebrow">${escapeHtml(this.snapshot?.projectId || 'Project')}</p>${sections.map(([id,label])=>`<button class="nav-domain-btn ${this.projectSection===id?'active':''}" data-domain="${id}">${label}</button>`).join('')}<p class="rail-status">${this.connectionStatus==='demo'?'Synthetic demo':this.accountSession?'Private account project':'Connected locally'}</p></nav>`;
  }

  _updateStatusBar() {
    const pill = document.querySelector('.sync-status-pill');
    if (pill) {
      const isSynced = this.connectionStatus === 'live';
      pill.innerHTML = `
        <span class="sync-dot ${isSynced ? 'live' : 'standalone'}"></span>
        <span class="sync-text">${isSynced ? 'LOCAL CONNECTED' : this.connectionStatus.toUpperCase()}</span>
      `;
    }
  }

  _renderCurrentView() {
    if (this.currentView === 'landing') {
      return `${this.accountSession?`<section class="account-shortcuts"><h2>Your workspace</h2><p>${this.projects.filter(p=>!p.id.startsWith('demo-')).length} connected projects · <button class="nav-link" id="landing-your-projects">View all projects</button></p><div>${this.projects.filter(p=>!p.id.startsWith('demo-')).map(p=>`<button class="btn btn-secondary" data-account-project="${escapeHtml(p.id)}">${escapeHtml(p.name || p.id)}</button>`).join('')}</div></section>`:''}${renderLandingView()}`;
    }
    if (this.currentView === 'projects') {
      return this._renderAccountProjectsView();
    }
    if (this.currentView === 'profiles') {
      return this._renderProfilesView();
    }

    if (this.currentView === 'account') return `<section class="insight-panel account-settings"><h1>Account & connections</h1><p>${escapeHtml(this.accountSession?.email || 'Local workspace')}</p><p>Projects are connected explicitly from your machines. Your email is your login identifier; it does not discover folders.</p><div id="account-settings-actions"><button class="btn btn-secondary" id="account-connect-machine">Connect another machine</button></div><p>Manage machine credentials here. To open an existing project, choose Projects in the navigation.</p></section>`;
    if (this.projectSection === 'overview') return renderProjectOverview(this.snapshot);
    // Tier 3: Direct Project Views based on Domain Section:
    if (this.projectSection === 'governance') {
      if (this.activeGovTab === 'summary') return renderDecisionOverview(this.snapshot);
      return `<button class="btn btn-secondary" data-gov-tab="summary">← Decision overview</button>${renderGovernanceView(this.snapshot, this.activeGovTab)}`;
    }
    if (this.projectSection === 'reports') {
      return renderReportsView(this.snapshot, this.activeReportId);
    }
    if (this.projectSection === 'automation') {
      return renderAutomationView(this.snapshot, this.activeScriptName);
    }
    if (this.projectSection === 'knowledge') {
      return renderKnowledgeView(this.snapshot, this.activeKnowledgeSection, this.selectedKnowledgeItemId);
    }
    if (this.projectSection === 'metrics') {
      this.projectSection = 'overview';
      return renderProjectOverview(this.snapshot);
    }

    // Default: 'phases' section with On-Screen Phase Explorer
    return renderPhaseExplorerView(this.snapshot, this);
  }

  // ---------------------------------------------------------------------------
  // Tier 2: The Logged In State (Account Level / Multi-Project Dashboard)
  // ---------------------------------------------------------------------------
  _renderAccountProjectsView() {
    if (this.projectListError) return `<section class="insight-panel" role="status"><h1>Projects unavailable</h1><p>${escapeHtml(this.projectListError)}</p><button class="btn btn-secondary" id="retry-projects">Try again</button></section>`;
    if (!this.projects.length) return `<section class="domain-content-card"><h1>No connected projects yet</h1><p>${this.accountSession ? 'Connect a machine to publish the projects you choose.' : 'Launch the local CLI with one or more --project paths. No account is required.'}</p><button class="btn btn-secondary" id="dash-connect-another-btn">Connect projects</button></section>`;
    return `<div class="projects-dashboard">
      <div class="account-hero-bar"><div class="account-identity"><div class="account-avatar-large">${ICONS.user}</div><div><h1 class="account-title">Your projects</h1><p class="account-sub">${this.projects.length} connected projects · ${this.accountSession ? 'Private published snapshots' : 'Local read service'}</p></div></div><button class="btn btn-secondary" id="dash-connect-another-btn">${this.accountSession?'Manage connections':'Open another local project'}</button></div>
      <div class="project-card-grid">${this.projects.map(project => `<div class="project-dash-card" data-project-id="${escapeHtml(project.id)}" role="button" tabindex="0">
        <div class="project-dash-header"><h2 class="project-dash-title">${escapeHtml(project.name || project.id)}</h2><span class="profile-tag-pill mono">${escapeHtml(project.profile || 'general')}</span></div>
        <div class="project-dash-meta-box"><p>${project.phasesCount ?? 'Unknown'} phases</p><p><strong>${project.metrics?.overallProgressPct ?? '—'}%</strong> recorded progress</p><p>${project.metrics?.completedTasks ?? 'Unknown'} of ${project.metrics?.totalTasks ?? 'Unknown'} tasks marked complete</p><p>${project.activePhaseId ? 'Current phase: '+escapeHtml(project.activePhaseId) : 'No current phase declared'}</p></div>
        <details class="project-source-details"><summary>Source details</summary><p>${escapeHtml(project.root || 'Private account snapshot')}</p><p>Revision: ${escapeHtml(project.contentRevision || 'Not recorded')}</p><p>Updated: ${escapeHtml(project.updated ? new Date(project.updated).toLocaleString() : 'Local snapshot')}</p></details>
        <div class="project-dash-footer"><button class="btn btn-secondary">View project</button></div>
      </div>`).join('')}</div></div>`;
  }

  _renderProjectMetricsView() {
    const snapshot = escapeDisplayModel(this.snapshot);
    const metrics = snapshot?.metrics || {
      overallHealthScore: 0,
      overallHealthGrade: 'UNKNOWN',
      totalRequirements: 0,
      totalTasks: 0,
      completedTasks: 0,
      overallProgressPct: 0,
      traceabilityCoveragePct: 0,
      verificationAssurancePct: 0,
      activeSprintsCount: 0,
      orphanTaskCount: 0,
      unmappedReqCount: 0,
      phasesBurndown: [],
    };

    const phases = snapshot?.phases || [];

    return `
      <section style="margin-top: 1.5rem;">
        <h1 class="detail-title">Project completeness & recorded progress</h1>
        <p style="color:var(--ds-gray-600); margin-bottom: 2rem; font-size: 1.05rem;">
          Heuristic completeness, reference coverage, and recorded task progress across all specifications in <strong>${snapshot?.projectId || 'Project'}</strong>.
        </p>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Completeness heuristic</h3>
              <span class="kpi-badge status-badge-verified">${metrics.overallHealthGrade}</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.overallHealthScore}</span>
              <span class="kpi-subtext">/ 100</span>
            </div>
            <div class="kpi-footer">
              <span>Across ${phases.length} project phases</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Traceability Coverage</h3>
              <span class="kpi-badge ${metrics.unmappedReqCount > 0 ? 'status-badge-gap' : 'status-badge-verified'}">
                ${metrics.unmappedReqCount > 0 ? `${metrics.unmappedReqCount} Gaps` : '100%'}
              </span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.traceabilityCoveragePct}%</span>
              <span class="kpi-subtext">REQs Mapped</span>
            </div>
            <div class="kpi-footer">
              <span>${metrics.totalRequirements} Total Requirements</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Verification Assurance</h3>
              <span class="kpi-badge status-badge-verified">Pass Rate</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.verificationAssurancePct}%</span>
              <span class="kpi-subtext">Verified</span>
            </div>
            <div class="kpi-footer">
              <span>Grounding evidence logs</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Task Completion</h3>
              <span class="kpi-badge status-badge-implemented">${metrics.activeSprintsCount} Active</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.overallProgressPct}%</span>
              <span class="kpi-subtext">Done</span>
            </div>
            <div class="kpi-footer">
              <span>${metrics.completedTasks} / ${metrics.totalTasks} Tasks</span>
            </div>
          </div>
        </div>

        <!-- Phase Burndown & Health Leaderboard -->
        <div class="section-bar-header">
          <span>Phase completeness and recorded progress</span>
        </div>

        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Phase ID</th>
                <th>Phase Title</th>
                <th>Scope</th>
                <th>Completeness heuristic</th>
                <th>Task completion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${phases.map(p => {
                const health = p.metrics?.healthScore || 0;
                const grade = p.metrics?.healthGrade || 'UNKNOWN';
                return `
                  <tr style="cursor:pointer;" class="clickable-phase-row" data-phase-id="${p.id}">
                    <td class="mono font-bold">${p.id}</td>
                    <td>${p.name || p.id}</td>
                    <td class="mono" style="color:var(--ds-gray-500);">${p.category}</td>
                    <td>
                      <span class="matrix-status-badge ${health >= 75 ? 'status-badge-verified' : health >= 50 ? 'status-badge-implemented' : 'status-badge-gap'}">
                        ${health}/100 • ${grade}
                      </span>
                    </td>
                    <td>
                      <div class="mono" style="font-size:0.8rem;">
                        ${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} (${p.taskCounts?.percent || 0}%)
                      </div>
                    </td>
                    <td>
                      <span class="status-pill-clean ${p.category === 'archive' ? 'status-clean-complete' : 'status-clean-active'}">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  // ---------------------------------------------------------------------------
  // Profiles View
  // ---------------------------------------------------------------------------
  _renderProfilesView() { return renderProfiles(this.selectedProfileId); }

  _renderFooter() {
    return `
      <footer class="skills-footer">
        <div class="footer-grid">
          <div>
            <h3 class="footer-col-title">Browse</h3>
            <ul class="footer-links-list">
              <li><a id="footer-phases-btn">All sprints</a></li>
              <li><a id="footer-projects-btn">My projects</a></li>
              <li><a id="footer-landing-btn">Public landing</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Profiles</h3>
            <ul class="footer-links-list">
              <li><a id="footer-profiles-btn">All profiles</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/architecture.md" target="_blank" rel="noopener noreferrer">Composition rules</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Agents</h3>
            <ul class="footer-links-list">
              <li><span>Claude Code</span></li>
              <li><span>Cursor</span></li>
              <li><span>Antigravity</span></li>
              <li><span>GitHub Copilot</span></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Docs</h3>
            <ul class="footer-links-list">
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Overview</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/cli-reference.md" target="_blank" rel="noopener noreferrer">CLI</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/governance.md" target="_blank" rel="noopener noreferrer">Governance</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>Spec-Driven Development Framework — Intent before code.</span>
          <span>Open source on <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">GitHub</a>.</span>
        </div>
      </footer>
    `;
  }

  _bindEvents() {
    this.container.querySelector('#landing-your-projects')?.addEventListener('click',()=>this._showProjects());
    this.container.querySelector('#retry-projects')?.addEventListener('click',()=>this._showProjects());
    this.container.querySelectorAll('[data-account-project]').forEach(button=>button.addEventListener('click',()=>this.selectProject(button.dataset.accountProject)));
    this.container.querySelector('#nav-account-btn')?.addEventListener('click',()=>{this.currentView='account';this._syncRoute(true);this.render();});
    this.container.querySelector('#account-connect-machine')?.addEventListener('click',()=>this._showConnectorDialog());
    this.container.querySelectorAll('[data-profile-id]').forEach(button=>button.addEventListener('click',()=>{this.selectedProfileId=button.dataset.profileId;this.currentView='profiles';this._syncRoute(true);this.render();}));
    this.container.querySelector('[data-profile-back]')?.addEventListener('click',()=>{this.selectedProfileId=null;this._syncRoute(true);this.render();});
    this.container.querySelectorAll('[data-copy-command]').forEach(button=>button.addEventListener('click',async()=>{try {await navigator.clipboard.writeText(button.dataset.copyCommand);button.textContent='Copied';} catch {button.textContent='Select and copy the command above';}}));
    this.container.querySelectorAll('[data-insight-phase]').forEach(button=>button.addEventListener('click',()=>{this.activePhaseId=button.dataset.insightPhase;this.phaseTab=button.dataset.insightTab || 'overview';this.projectSection='phases';this._syncRoute(true);this.render();}));

    // Brand click -> smart navigate
    const brandBtn = document.getElementById('brand-home-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        if (this.token || this.accountSession) {
          this.currentView = 'projects';
        } else {
          this.currentView = 'landing';
        }
        this.render();
      });
    }

    // Header Account breadcrumb click -> Go to Projects Dashboard
    const navHeaderAccountBtn = document.getElementById('nav-header-account-btn');
    if (navHeaderAccountBtn) {
      navHeaderAccountBtn.addEventListener('click', async () => {
        if (this.token || this.accountSession) await this._loadProjects();
        this.currentView = 'projects';
        this.render();
      });
    }

    // Header Project breadcrumb click -> Go to Project Sprints overview
    const navHeaderProjectBtn = document.getElementById('nav-header-project-btn');
    if (navHeaderProjectBtn) {
      navHeaderProjectBtn.addEventListener('click', () => {
        this.activePhaseId = null;
        this.activeTab = 'overview';
        this.currentView = 'project';
        this._syncRoute(true); this.render();
      });
    }

    // High-Level Domain Navigation (ZERO phases in header!)
    this.container.querySelectorAll('[data-domain]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.projectSection = btn.getAttribute('data-domain');
        if (this.projectSection === 'knowledge') this.activeKnowledgeSection = 'graphify';
        if (this.projectSection === 'governance') this.activeGovTab = 'summary';
        this.currentView = 'project';
        this._syncRoute(true); this.render();
      });
    });

    // On-screen Phase Navigator selection (Scales to 50+ phases!)
    this.container.querySelectorAll('[data-phase-select]').forEach(el => {
      el.addEventListener('click', () => {
        const pId = el.getAttribute('data-phase-select');
        this.activePhaseId = pId;
        this.phaseTab = 'overview';
        this._syncRoute(true);
        this.render();
      });
    });

    // Toggle All Sprints Overview
    const toggleAllSprintsBtn = document.getElementById('toggle-all-sprints-btn');
    if (toggleAllSprintsBtn) {
      toggleAllSprintsBtn.addEventListener('click', () => {
        this.activePhaseId = null;
        this.render();
      });
    }

    // Scope filters (All, Active, Backlog, Archive)
    this.container.querySelectorAll('[data-scope-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.phaseScopeFilter = btn.getAttribute('data-scope-filter');
        this.render();
      });
    });

    // Real-time search for 50+ phases
    const phaseSearchInput = document.getElementById('phase-search-field');
    if (phaseSearchInput) {
      phaseSearchInput.addEventListener('input', (e) => {
        this.phaseSearchQuery = e.target.value;
        this.render();
        const inputNow = document.getElementById('phase-search-field');
        if (inputNow) {
          inputNow.focus();
          inputNow.selectionStart = inputNow.selectionEnd = inputNow.value.length;
        }
      });
    }

    const clearPhaseSearch = document.getElementById('clear-phase-search');
    if (clearPhaseSearch) {
      clearPhaseSearch.addEventListener('click', () => {
        this.phaseSearchQuery = '';
        this.render();
      });
    }

    this.container.querySelectorAll('.tasks-toolbar [data-filter]').forEach(btn => {
      btn.addEventListener('click', () => { this.taskFilter = btn.dataset.filter; this.render(); });
    });

    const openRef = id => {
      const phase = this.snapshot?.phases.find(p => p.id === this.activePhaseId);
      if (!phase) return;
      if (phase.tasks.some(t => t.id === id)) this.phaseTab = 'tasks';
      else if (phase.requirements.some(r => r.id === id)) this.phaseTab = 'requirements';
      else this.phaseTab = 'evidence';
      this.render();
      const targets = [...this.container.querySelectorAll('[id], .evidence-filename')];
      const target = targets.find(el => el.id === 'task-' + id || el.id.toUpperCase().startsWith('SDD-SECTION-' + id.toUpperCase()) || el.textContent.trim() === id);
      target?.scrollIntoView({ block: 'center' });
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    };
    this.container.querySelectorAll('.trace-node[data-id], [data-open-ref]').forEach(el => {
      el.addEventListener('click', () => openRef(el.dataset.id || el.dataset.openRef));
      el.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); openRef(el.dataset.id || el.dataset.openRef); } });
    });
    this.container.querySelectorAll('button[data-source-path]').forEach(el => el.addEventListener('click', () => this._openArtifact(el.dataset.sourcePath)));
    this.container.querySelectorAll('.markdown-body a[href]').forEach(el => el.addEventListener('click', e => {
      const href = el.getAttribute('href');
      if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return;
      const source = el.closest('[data-source-path]')?.dataset.sourcePath;
      if (!source || (this.connectionStatus !== 'demo' && !this.token && !this.accountSession)) return;
      e.preventDefault();
      const base = source.slice(0, source.lastIndexOf('/') + 1);
      this._openArtifact(base + href.split('#')[0]);
    }));

    this.container.querySelectorAll('[data-copy-command]').forEach(button => button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copyCommand); button.textContent = 'Copied';
    }));

    // Phase Sub-tabs
    this.container.querySelectorAll('[data-phase-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.phaseTab = btn.getAttribute('data-phase-tab');
        this._syncRoute(true); this.render();
      });
    });

    // Governance & Memory tabs
    this.container.querySelectorAll('[data-gov-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeGovTab = btn.getAttribute('data-gov-tab');
        this.render();
      });
    });

    // Reports tabs
    this.container.querySelectorAll('[data-report-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeReportId = btn.getAttribute('data-report-id');
        this.render();
      });
    });

    // Automation / Scripts
    this.container.querySelectorAll('[data-script-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeScriptName = btn.getAttribute('data-script-name');
        this.render();
      });
    });

    // Knowledge / Docs & Templates
    this.container.querySelectorAll('[data-know-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeKnowledgeSection = btn.getAttribute('data-know-section');
        this.render();
      });
    });

    this.container.querySelectorAll('[data-tpl-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedKnowledgeItemId = btn.getAttribute('data-tpl-id');
        this.render();
      });
    });

    this.container.querySelectorAll('[data-doc-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedKnowledgeItemId = btn.getAttribute('data-doc-id');
        this.render();
      });
    });

    // Copy template content button
    const copyTplBtn = document.getElementById('copy-tpl-content-btn');
    if (copyTplBtn) {
      copyTplBtn.addEventListener('click', () => {
        const mdEl = document.querySelector('.markdown-body');
        if (mdEl) {
          navigator.clipboard.writeText(mdEl.innerText).then(() => {
            copyTplBtn.innerHTML = `${ICONS.check} <span>Copied</span>`;
            setTimeout(() => {
              copyTplBtn.innerHTML = `${ICONS.copy} <span>Copy Template</span>`;
            }, 1800);
          });
        }
      });
    }

    // Nav to Projects Dashboard
    const navProjectsDashboardBtn = document.getElementById('nav-projects-dashboard-btn');
    const footerProjectsBtn = document.getElementById('footer-projects-btn');
    const onNavProjects = () => this._showProjects();
    if (navProjectsDashboardBtn) navProjectsDashboardBtn.addEventListener('click', onNavProjects);
    if (footerProjectsBtn) footerProjectsBtn.addEventListener('click', onNavProjects);

    // Nav to Public Landing
    const navLandingPageBtn = document.getElementById('nav-landing-page-btn');
    const navLandingHomeBtn = document.getElementById('nav-landing-home-btn');
    const footerLandingBtn = document.getElementById('footer-landing-btn');
    const onNavLanding = () => {
      this.currentView = 'landing';
      this._syncRoute(true); this.render();
    };
    if (navLandingPageBtn) navLandingPageBtn.addEventListener('click', onNavLanding);
    if (navLandingHomeBtn) navLandingHomeBtn.addEventListener('click', onNavLanding);
    if (footerLandingBtn) footerLandingBtn.addEventListener('click', onNavLanding);

    // Profiles nav
    const navProfilesBtn = document.getElementById('nav-profiles-btn');
    const footerProfilesBtn = document.getElementById('footer-profiles-btn');
    const onNavProfiles = () => {
      this.selectedProfileId = null;
      this.currentView = 'profiles';
      this._syncRoute(true); this.render();
    };
    if (navProfilesBtn) navProfilesBtn.addEventListener('click', onNavProfiles);
    if (footerProfilesBtn) footerProfilesBtn.addEventListener('click', onNavProfiles);

    this.container.querySelectorAll('[data-demo-project]').forEach(button => button.addEventListener('click', () => {
      this._loadStaticDemo(Number(button.dataset.demoProject));
    }));

    // Launch Demo Buttons
    const launchDemoBtn = document.getElementById('launch-demo-btn');
    const launchDemoHeaderBtn = document.getElementById('launch-demo-header-btn');
    const onLaunchDemo = () => {
      this._loadStaticDemo();
    };
    if (launchDemoBtn) launchDemoBtn.addEventListener('click', onLaunchDemo);
    if (launchDemoHeaderBtn) launchDemoHeaderBtn.addEventListener('click', onLaunchDemo);

    // Connect Workspace Buttons
    const connectWorkspaceBtn = document.getElementById('connect-workspace-btn');
    const connectWorkspaceHeaderBtn = document.getElementById('connect-workspace-header-btn');
    const dashConnectAnotherBtn = document.getElementById('dash-connect-another-btn');
    const onConnectWorkspace = () => {
      if (this.accountSession) { this._showConnectorDialog(); return; }
      const launch = prompt('Launch the workspace CLI with --project for each root you want to view, then paste its full local launch URL:');
      if (!launch?.trim()) return;
      try {
        const target = new URL(launch.trim());
        if (target.protocol !== 'http:' || !['localhost','127.0.0.1','[::1]'].includes(target.hostname) || !/^#token=[a-f0-9]+$/.test(target.hash)) throw new Error('Invalid local launch URL');
        window.location.assign(target.href);
      } catch { alert('Use the complete loopback URL with #token printed by the workspace CLI.'); }
    };
    if (connectWorkspaceBtn) connectWorkspaceBtn.addEventListener('click', onConnectWorkspace);
    if (connectWorkspaceHeaderBtn) connectWorkspaceHeaderBtn.addEventListener('click', onConnectWorkspace);
    if (dashConnectAnotherBtn) dashConnectAnotherBtn.addEventListener('click', () => {if (this.accountSession && this.projects.length) {this.currentView='account';this._syncRoute(true);this.render();} else onConnectWorkspace();});

    // Project cards in Account Dashboard
    this.container.querySelectorAll('.project-dash-card[data-project-id]').forEach(card => {
      card.addEventListener('keydown', event => { if (event.target.closest('details')) return; if (['Enter', ' '].includes(event.key)) { event.preventDefault(); card.click(); } });
      card.addEventListener('click', event => {
        if (event.target.closest('details')) return;
        const pId = card.getAttribute('data-project-id');
        this.selectProject(pId);
      });
    });

    const demoShowcaseCard = document.getElementById('demo-showcase-card');
    if (demoShowcaseCard) {
      demoShowcaseCard.addEventListener('click', onLaunchDemo);
    }

    // Breadcrumb back clicks in Phase detail
    const back1 = document.getElementById('back-to-dir-btn');
    const back2 = document.getElementById('back-to-dir-btn2');
    if (back1) back1.addEventListener('click', () => { this.activePhaseId = null; this.render(); });
    if (back2) back2.addEventListener('click', () => { this.activePhaseId = null; this.render(); });

    // Clickable table rows in Phase leaderboards
    this.container.querySelectorAll('.table-row[data-phase-id]').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.activeTab = 'overview';
        this.currentView = 'project';
        this._syncRoute(true); this.render();
      });
    });

    this.container.querySelectorAll('.clickable-phase-row[data-phase-id]').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.activeTab = 'metrics';
        this.currentView = 'project';
        this._syncRoute(true); this.render();
      });
    });

    // Directory filter tabs
    this.container.querySelectorAll('.dir-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dirFilter = btn.getAttribute('data-dir-filter');
        this.render();
      });
    });

    // Detail tabs within a Phase
    this.container.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-detail-tab');
        this.render();
      });
    });

    // Search input
    const searchInput = document.getElementById('skills-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const bodyEl = document.querySelector('.table-body');
        if (bodyEl) {
          const phases = this.snapshot?.phases || [];
          let filtered = phases;
          if (this.dirFilter === 'active') filtered = phases.filter(p => p.category === 'active');
          if (this.dirFilter === 'backlog') filtered = phases.filter(p => p.category === 'backlog');
          if (this.dirFilter === 'archive') filtered = phases.filter(p => p.category === 'archive');
          const q = this.searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.id.toLowerCase().includes(q) || (p.name && p.name.toLowerCase().includes(q)));

          bodyEl.innerHTML = filtered.map((p, idx) => {
            const pHealth = p.metrics?.healthScore || 0;
            const pGrade = p.metrics?.healthGrade || 'UNKNOWN';
            const reqTotal = p.metrics?.traceability?.totalRequirements || p.requirements?.length || 0;
            const reqMapped = p.metrics?.traceability?.mappedRequirements || 0;

            return `
              <div class="table-row" data-phase-id="${p.id}">
                <div class="row-num">${idx + 1}</div>
                <div class="row-primary">
                  <div class="row-title">${p.name || p.id}</div>
                  <div class="row-sub mono">${p.id}</div>
                </div>
                <div class="row-health">
                  <span class="matrix-status-badge ${pHealth >= 75 ? 'status-badge-verified' : pHealth >= 50 ? 'status-badge-implemented' : 'status-badge-gap'}">
                    ${pHealth}/100 • ${pGrade}
                  </span>
                </div>
                <div class="row-trace">
                  <span class="mono" style="font-size:0.8rem; color:var(--foreground);">
                    ${reqMapped}/${reqTotal} REQs (${p.metrics?.traceability?.requirementCoveragePct || 100}%)
                  </span>
                </div>
                <div class="row-progress">
                  <div class="progress-track">
                    <div class="progress-bar" style="width: ${p.taskCounts?.percent || 0}%;"></div>
                  </div>
                  <div class="progress-pct mono">${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} tasks (${p.taskCounts?.percent || 0}%)</div>
                </div>
                <div class="row-status">
                  <span class="status-pill-clean ${p.category === 'archive' ? 'status-clean-complete' : p.category === 'active' ? 'status-clean-active' : 'status-clean-backlog'}">
                    ${p.category === 'archive' ? 'Completed' : p.category === 'active' ? 'Active Sprint' : 'Backlog'}
                  </span>
                </div>
              </div>
            `;
          }).join('');

          bodyEl.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', () => {
              this.activePhaseId = row.getAttribute('data-phase-id');
              this.activeTab = 'overview';
              this.currentView = 'project';
              this.render();
            });
          });
        }
      });
    }

    // Copy command buttons
    const pill = document.getElementById('copy-cmd-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        const text = pill.querySelector('code')?.innerText || '';
        navigator.clipboard.writeText(text.replace(/^\$\s*/, '')).then(() => {
          const btn = pill.querySelector('.copy-icon-btn');
          if (btn) btn.innerHTML = ICONS.check;
          setTimeout(() => { this.render(); }, 1500);
        });
      });
    }

    // Authentic skills.sh Landing Page Events
    if (this.currentView === 'landing') {
      const copyCmdBox = document.getElementById('install-cmd-box');
      const copyCmdBtn = document.getElementById('copy-cmd-btn');
      const copyStatusBubble = document.getElementById('copy-status-bubble');

      const doCopyInstall = (e) => {
        if (e) e.stopPropagation();
        const cmd = INSTALL_COMMAND;
        navigator.clipboard.writeText(cmd).then(() => {
          if (copyStatusBubble) {
            copyStatusBubble.classList.add('show');
            setTimeout(() => { copyStatusBubble.classList.remove('show'); }, 2000);
          }
        });
      };

      if (copyCmdBox) { copyCmdBox.addEventListener('click', doCopyInstall); copyCmdBox.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); doCopyInstall(e); } }); }
      if (copyCmdBtn) copyCmdBtn.addEventListener('click', doCopyInstall);

      // Search input filter in landing leaderboard
      const leaderboardSearch = document.getElementById('leaderboard-search-input');
      const tableRowsContainer = document.getElementById('leaderboard-table-rows');
      const rows = Array.from(this.container.querySelectorAll('.agent-row'));

      const filterLeaderboard = () => {
        const query = (leaderboardSearch?.value || '').toLowerCase().trim();
        const activeTab = this.container.querySelector('.leaderboard-tabs-bar .tab-btn.active')?.getAttribute('data-filter') || 'all';

        let currentRows = [...rows];

        // Sorting based on active tab
        if (activeTab === 'low-error') {
          currentRows.sort((a, b) => {
            const errA = parseFloat(a.getAttribute('data-error') || '0');
            const errB = parseFloat(b.getAttribute('data-error') || '0');
            return errA - errB;
          });
        } else if (activeTab === 'high-runs') {
          currentRows.sort((a, b) => {
            const runsA = parseInt(a.getAttribute('data-runs') || '0', 10);
            const runsB = parseInt(b.getAttribute('data-runs') || '0', 10);
            return runsB - runsA;
          });
        }

        // Re-append in sorted order if container exists
        if (tableRowsContainer) {
          currentRows.forEach(r => tableRowsContainer.appendChild(r));
        }

        currentRows.forEach(row => {
          const name = (row.querySelector('.profile-name')?.innerText || '').toLowerCase();
          const repo = (row.querySelector('.profile-repo')?.innerText || '').toLowerCase();
          const tag = (row.querySelector('.agent-tag-line')?.innerText || '').toLowerCase();
          const cat = row.getAttribute('data-category');

          const matchesQuery = !query || name.includes(query) || repo.includes(query) || tag.includes(query);
          const matchesTab = activeTab !== 'official' || cat === 'official';

          if (matchesQuery && matchesTab) {
            row.style.display = 'grid';
          } else {
            row.style.display = 'none';
          }
        });
      };

      if (leaderboardSearch) {
        leaderboardSearch.addEventListener('input', filterLeaderboard);
      }

      // Filter tabs in landing leaderboard
      this.container.querySelectorAll('.leaderboard-tabs-bar .tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          this.container.querySelectorAll('.leaderboard-tabs-bar .tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          filterLeaderboard();
        });
      });

      // Quick-copy on agent row click
      rows.forEach(row => {
        row.addEventListener('click', () => {
          const agentId = row.getAttribute('data-agent-id');
          const cmd = `bash scripts/setup.sh`;
          navigator.clipboard.writeText(cmd).then(() => {
            const nameEl = row.querySelector('.profile-name');
            if (nameEl) {
              const orig = nameEl.innerText;
              nameEl.innerText = `Setup Copied`;
              setTimeout(() => { nameEl.innerText = orig; }, 1800);
            }
          });
        });
      });

      // Quick-copy on composition overlap cards
      this.container.querySelectorAll('.composition-card').forEach(card => {
        card.addEventListener('click', () => {
          const codeEl = card.querySelector('code');
          if (codeEl) {
            const cmd = codeEl.innerText.replace(/^\$\s*/, '');
            navigator.clipboard.writeText(cmd).then(() => {
              const hint = card.querySelector('.copy-hint');
              if (hint) {
                const orig = hint.innerText;
                hint.innerText = 'COPIED!';
                hint.style.color = '#10b981';
                setTimeout(() => {
                  hint.innerText = orig;
                  hint.style.color = '';
                }, 1800);
              }
            });
          }
        });
      });

      // Keyboard shortcut '/' to focus search
      const onKeyDown = (e) => {
        if (e.key === '/' && document.activeElement !== leaderboardSearch && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          if (leaderboardSearch) {
            leaderboardSearch.focus();
            leaderboardSearch.select();
          }
        }
      };
      window.addEventListener('keydown', onKeyDown, { once: true });
    }
  }
}
