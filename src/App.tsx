import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar, NavTab } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AskRexPage } from './pages/AskRexPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { ListResourcePage } from './pages/ListResourcePage';
import { ExchangeRequestsPage } from './pages/ExchangeRequestsPage';
import { ActivityPage } from './pages/ActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsModal } from './components/SettingsModal';

import { db, RealtimePayload } from './services/db';
import { Profile, Institution, Resource, SearchCandidate, ExchangeRequest } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [currentUser, setCurrentUser] = useState<Profile>(db.getCurrentUser());
  const [institutions, setInstitutions] = useState<Institution[]>(db.getInstitutions());
  const [resources, setResources] = useState<Resource[]>(db.getResources());
  const [askRexInitialGoal, setAskRexInitialGoal] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync state from DB
  const refreshDbState = () => {
    setCurrentUser(db.getCurrentUser());
    setInstitutions(db.getInstitutions());
    setResources(db.getResources());
  };

  useEffect(() => {
    refreshDbState();
    const unsub = db.subscribeRealtime((event: RealtimePayload) => {
      refreshDbState();
      if (event.type === 'OFFER_ACCEPTED') {
        // Subtle alert when an offer is accepted in real time
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10B981', '#34D399', '#F59E0B'],
          });
        } catch (e) {}
      }
    });

    return unsub;
  }, []);

  const userInstitution = db.getInstitutionById(currentUser.institution_id);

  // Handle Switch User (Demo Account Switcher)
  const handleSwitchUser = (userId: string) => {
    db.setCurrentUser(userId);
    refreshDbState();
  };

  // Reset Demo Dataset
  const handleSeedDemo = () => {
    db.seedDemoDataset();
    refreshDbState();
  };

  // Submit Goal from Home -> Ask REX
  const handleSubmitGoal = (goal: string) => {
    setAskRexInitialGoal(goal);
    setCurrentTab('ask_rex');
  };

  // Request Exchange from Ask REX
  const handleRequestExchange = (candidate: SearchCandidate, offeredPrice: number) => {
    db.createExchangeRequest({
      resource_id: candidate.resource.id,
      requester_id: currentUser.id,
      offered_price: offeredPrice,
      requested_duration: 'This weekend (3 days)',
    });
    refreshDbState();
    setCurrentTab('requests');
  };

  // Complete Handover Confirmation
  const handleExchangeConfirmed = (req: ExchangeRequest) => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B'],
      });
    } catch (e) {}
    setCurrentTab('activity');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080B] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        currentUser={currentUser}
        userInstitution={userInstitution}
        onSwitchUser={handleSwitchUser}
        onSeedDemo={handleSeedDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col justify-start">
        {currentTab === 'home' && (
          <HomePage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            recentResources={resources}
            onSubmitGoal={handleSubmitGoal}
            onExploreCollege={(inst) => {
              setCurrentTab('network');
            }}
            onSelectResource={(res) => {
              handleSubmitGoal(`I need ${res.title}`);
            }}
            onNavigateToNetwork={() => setCurrentTab('network')}
            onSeedDemo={handleSeedDemo}
          />
        )}

        {currentTab === 'ask_rex' && (
          <AskRexPage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            initialGoal={askRexInitialGoal}
            onRequestExchange={handleRequestExchange}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverPage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            resources={resources}
            onSelectResource={(res) => {
              handleSubmitGoal(`I need ${res.title}`);
            }}
            onAskRexForResource={(res) => {
              handleSubmitGoal(`I need ${res.title}`);
            }}
          />
        )}

        {currentTab === 'network' && (
          <NetworkMapPage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            onSelectResource={(res) => {
              handleSubmitGoal(`I need ${res.title}`);
            }}
            onAskRexForCollege={(inst) => {
              handleSubmitGoal(`Looking for resources at ${inst.name}`);
            }}
          />
        )}

        {currentTab === 'list_resource' && (
          <ListResourcePage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            onResourceCreated={(res) => {
              refreshDbState();
              setCurrentTab('discover');
            }}
          />
        )}

        {currentTab === 'requests' && (
          <ExchangeRequestsPage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            onExchangeConfirmed={handleExchangeConfirmed}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityPage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            onNavigateToRequests={() => setCurrentTab('requests')}
            onNavigateToAskRex={() => setCurrentTab('ask_rex')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            userInstitution={userInstitution}
            institutions={institutions}
            onSwitchUser={handleSwitchUser}
            onSelectResource={(res) => {
              handleSubmitGoal(`I need ${res.title}`);
            }}
          />
        )}
      </main>

      {/* Modern Minimal Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07080B]/80 backdrop-blur-md py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-bold">REX — BHARAT AGENTIC 2026</span>
            <span>• Government of India AISHE Directory Grounded</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>MapLibre GL / OpenStreetMap</span>
            <span>•</span>
            <span>Supabase / Broadcast Realtime Mesh</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">"Don't search the campus. Ask REX."</span>
          </div>
        </div>
      </footer>

      {/* Integration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};

export default App;
