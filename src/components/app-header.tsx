'use client';

import { Cpu, HelpCircle, LogIn } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { Button } from './ui/button';

type AppHeaderProps = {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setShowHelp: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  isUserLoading: boolean;
  onLoginClick: () => void;
};

export default function AppHeader({
  activeTab,
  setActiveTab,
  setShowHelp,
  user,
  isUserLoading,
  onLoginClick,
}: AppHeaderProps) {
  return (
    <header className="relative bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3 w-full justify-start sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <Cpu className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black italic tracking-widest text-white uppercase leading-none font-headline">
                Neuro<span className="text-cyan-400">Sonic</span>
              </h1>
              <button
                onClick={() => setShowHelp(true)}
                className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest hover:text-cyan-400 transition-colors flex items-center gap-1 mt-1"
              >
                <HelpCircle size={10} /> How to use
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full sm:w-auto sm:flex-row">
          <nav className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl w-full justify-center sm:w-auto">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Console
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setActiveTab('play')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'play'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Play
            </button>
          </nav>

          {!isUserLoading && (!user || user.isAnonymous) && (
            <Button
              onClick={onLoginClick}
              variant="outline"
              size="sm"
              className="bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-[10px] uppercase tracking-widest h-auto py-2.5"
            >
              <LogIn size={12} className="mr-1.5" />
              Login
            </Button>
          )}
          {!isUserLoading && user && !user.isAnonymous && (
            <div className="text-sm text-slate-300">
              Welcome back, <span className="font-bold text-cyan-400">{user.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
