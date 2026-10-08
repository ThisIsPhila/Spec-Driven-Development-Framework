import { SDDWorkspaceApp } from './app.js';
import './style.css';

window.addEventListener('DOMContentLoaded', () => {
  const app = new SDDWorkspaceApp('app');
  app.init();
});
