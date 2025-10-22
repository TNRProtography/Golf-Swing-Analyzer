
import React from 'react';
import type { View } from '../types';
import { VIEWS } from '../constants';

const GolfIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-golf-green-light" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
        <path d="M10 18a8 8 0 005.657-2.343l-3.328-3.329a3.5 3.5 0 00-4.658 0L4.343 15.657A8 8 0 0010 18z" />
    </svg>
)

const InstallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  installPromptEvent: any; // Use `any` for simplicity with BeforeInstallPromptEvent
  onInstallClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, installPromptEvent, onInstallClick }) => {
    const navButtonClasses = (view: View) => 
        `px-4 py-2 rounded-md font-semibold transition-colors ${
            currentView === view 
                ? 'bg-golf-green-light text-white' 
                : 'bg-transparent text-gray-300 hover:bg-light-gray'
        }`;
  return (
    <header className="bg-light-gray shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center flex-wrap gap-y-4">
        <div className="flex items-center gap-3">
          <GolfIcon/>
          <h1 className="text-xl md:text-2xl font-bold text-white">Golf Swing Analyzer <span className="text-golf-green-light">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            <nav className="flex items-center gap-2 border border-gray-600 rounded-lg p-1">
            <button onClick={() => setCurrentView(VIEWS.ANALYSIS)} className={navButtonClasses(VIEWS.ANALYSIS)}>
                Analysis
            </button>
            <button onClick={() => setCurrentView(VIEWS.HISTORY)} className={navButtonClasses(VIEWS.HISTORY)}>
                Shot History
            </button>
            </nav>
            {installPromptEvent && (
              <button 
                onClick={onInstallClick} 
                className="flex items-center bg-golf-green hover:bg-golf-green-light text-white font-semibold px-3 py-2 rounded-lg transition-colors"
                aria-label="Install App"
              >
                <InstallIcon />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}
        </div>
      </div>
    </header>
  );
};
