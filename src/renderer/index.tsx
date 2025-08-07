import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { setupAudioAnalysisListener } from './services/audioAnalysisService';

// Initialize audio analysis IPC listener
setupAudioAnalysisListener();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);