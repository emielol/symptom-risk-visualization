/**
 * main.jsx
 * Entry point for the React frontend.
 * Renders the App component into the root DOM element.
 */

/**
 * File:        main.jsx
 * Author:      Noemie Florant
 * Description: Entry point for the React frontend.
 *              Renders the App component into the root DOM element.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // Standard React mount point
  <StrictMode>
    <App />
  </StrictMode>,
)
