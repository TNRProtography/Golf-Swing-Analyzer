
import React, { useState, useEffect } from 'react';
import { AnalysisView } from './components/AnalysisView';
import { ShotHistoryView } from './components/ShotHistoryView';
import { Header } from './components/Header';
import type { SwingData } from './types';
import { VIEWS } from './constants';
import type { View } from './types';
import { Toast } from './components/Toast';
import { useUserId } from './hooks/useUserId';
import { fetchSwingsFromCloud, saveSwingToCloud } from './services/cloudService';

const LOCAL_STORAGE_KEY = 'golf-swings';

// Define the interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [swings, setSwings] = useState<SwingData[]>([]);
  const [currentView, setCurrentView] = useState<View>(VIEWS.ANALYSIS);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const userId = useUserId();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let localSwings: SwingData[] = [];
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      localSwings = item ? JSON.parse(item) : [];
      setSwings(localSwings);
    } catch (error) {
      console.error("Failed to load local swings:", error);
    }

    if (userId) {
      fetchSwingsFromCloud(userId)
        .then(cloudSwings => {
          setSwings(cloudSwings);
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudSwings));
        })
        .catch(error => {
          console.error("Cloud sync failed:", error);
          setToastMessage("Could not sync with cloud. Using local data.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [userId]);


  const addSwing = async (newSwing: SwingData) => {
    const updatedSwings = [newSwing, ...swings.filter(s => s.id !== newSwing.id)];
    setSwings(updatedSwings);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSwings));
    setToastMessage('Swing saved locally!');

    if (userId) {
      try {
        await saveSwingToCloud(userId, newSwing);
        setToastMessage('Swing saved and synced to the cloud!');
      } catch (error) {
        console.error("Failed to save swing to cloud:", error);
        setToastMessage('Swing saved locally. Cloud sync failed.');
      }
    }
  };

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`Install prompt outcome: ${outcome}`);
    // The event can only be used once.
    setInstallPromptEvent(null);
  };

  return (
    <div className="min-h-screen bg-dark-charcoal font-sans flex flex-col">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        installPromptEvent={installPromptEvent}
        onInstallClick={handleInstallClick}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {currentView === VIEWS.ANALYSIS && <AnalysisView addSwing={addSwing} />}
        {currentView === VIEWS.HISTORY && <ShotHistoryView swings={swings} isLoading={isLoading} />}
      </main>
      <Toast 
        message={toastMessage} 
        show={!!toastMessage} 
        onClose={() => setToastMessage('')} 
      />
    </div>
  );
};

export default App;
