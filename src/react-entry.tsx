import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Import components (to be implemented)
import { ActionSearchBar } from './components/ui/action-search-bar';
import { ExpandableTabs } from './components/ui/expandable-tabs';
import { SlidingNumber } from './components/ui/sliding-number';

/**
 * Helper to mount a React component to a specific DOM element ID.
 * It will not crash if the ID is missing (allowing for page routing).
 */
const mountReactComponent = (id: string, Component: React.FC<any>, props = {}) => {
  const container = document.getElementById(id);
  // Optional: clear any vanilla placeholders before React takes over
  if (container) {
    container.innerHTML = "";
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Component {...props} />
      </React.StrictMode>
    );
  }
};

// Initialize micro-frontends when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Mount points will be activated as components are built
    mountReactComponent('react-action-search-bar', ActionSearchBar);
    mountReactComponent('react-expandable-tabs', ExpandableTabs, { tabs: [] });
    // Example wrapper since sliding number expects an integer prop
    mountReactComponent('react-sliding-number-hero', SlidingNumber, { value: 7490, suffix: "+" });
});
