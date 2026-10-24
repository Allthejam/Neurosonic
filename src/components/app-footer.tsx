'use client';

import type { User } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { LogOut, Download } from 'lucide-react';
import Link from 'next/link';

type AppFooterProps = {
  user: User | null;
};

export default function AppFooter({ user }: AppFooterProps) {
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-white/5 text-center sm:text-left w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            <span>&copy; {new Date().getFullYear()} NeuroSonic Systems // V3.0</span>
          </div>
          <Link href="/install" className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-black text-cyan-400/60 uppercase tracking-widest hover:text-cyan-400 transition-colors">
            <Download size={10} /> Install App Guide
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="font-mono text-cyan-900 text-[9px] font-bold uppercase tracking-[0.2em]">
              ID: {user?.uid?.slice(0, 12)}...
            </span>
            {!user.isAnonymous && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-white hover:bg-slate-800 text-[10px] uppercase tracking-widest px-3 py-1.5 h-auto"
              >
                <LogOut size={12} className="mr-1.5" />
                Logout
              </Button>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}