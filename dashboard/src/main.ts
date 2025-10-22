/**
 * Main entry point for Project Management Dashboard
 * Vite + Lit application
 */

import './styles/global.css';

// Import components
import './components/pm-roadmap';

console.log('🚀 Project Management Dashboard - Vite + Lit');
console.log('Environment:', import.meta.env.MODE);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard initialized');

  const root = document.getElementById('app');
  if (root) {
    root.innerHTML = `
      <pm-roadmap></pm-roadmap>
    `;
  }
});

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 HMR Update');
  });
}
