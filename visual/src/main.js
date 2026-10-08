// SDD Visual Workspace - Entry Point
console.log('SDD Visual Workspace Initialized');
const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <header style="padding: 1rem 2rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
      <div style="font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="color: var(--accent-color);">⚡</span> SDD Workspace
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); font-family: var(--font-mono);">
        Spec-Driven Development
      </div>
    </header>
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%;">
      <p style="color: var(--text-secondary);">Initializing workspace...</p>
    </main>
  `;
}
