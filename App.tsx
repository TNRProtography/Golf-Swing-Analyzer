
import React, { useState } from 'react';
import { AnalysisView } from './components/AnalysisView';
import { ShotHistoryView } from './components/ShotHistoryView';
import { Header } from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { SwingData } from './types';
import { VIEWS } from './constants';
import type { View } from './types';


const App: React.FC = () => {
  const [swings, setSwings] = useLocalStorage<SwingData[]>('golf-swings', []);
  const [currentView, setCurrentView] = useState<View>(VIEWS.ANALYSIS);

  const addSwing = (newSwing: SwingData) => {
    setSwings(prevSwings => [newSwing, ...prevSwings]);
  };

  return (
    <div className="min-h-screen bg-dark-charcoal font-sans flex flex-col">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {currentView === VIEWS.ANALYSIS && <AnalysisView addSwing={addSwing} />}
        {currentView === VIEWS.HISTORY && <ShotHistoryView swings={swings} />}
      </main>
    </div>
  );
};

export default App;
