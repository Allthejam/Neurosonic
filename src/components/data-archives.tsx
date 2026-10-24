'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight, History, Waves, Trash2, FlipVertical } from 'lucide-react';
import type { SoundProfile } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';

type DataArchivesProps = {
  profiles: SoundProfile[];
  loadProfile: (profile: SoundProfile) => void;
  deleteProfile: (id: string) => void;
  playInvertedProfile: (profile: SoundProfile) => void;
};

export default function DataArchives({
  profiles,
  loadProfile,
  deleteProfile,
  playInvertedProfile,
}: DataArchivesProps) {
  const [profileToDelete, setProfileToDelete] = useState<SoundProfile | null>(null);

  const handleDeleteConfirm = () => {
    if (profileToDelete && profileToDelete.id) {
      deleteProfile(profileToDelete.id);
      setProfileToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <h2 className="text-xl font-black italic tracking-widest flex items-center gap-3 text-white font-headline">
          <History className="text-cyan-400" /> LOG_ARCHIVES
        </h2>
      </div>
      <div className="grid gap-3">
        {profiles.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <Waves className="mx-auto mb-4" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">
              No Data Points Found
            </p>
          </div>
        ) : (
          profiles.map((p) => (
            <div
              key={p.id}
              className="group bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-cyan-500/10 transition-all active:scale-[0.98]"
            >
              <div
                onClick={() => loadProfile(p)}
                className="flex items-center gap-4 flex-grow cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 text-cyan-400 text-[10px] font-mono">
                  {p.waveType?.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="text-[11px] font-black text-white tracking-widest flex items-center gap-2">
                    {p.label}
                    {(p.audiogramData || p.label.startsWith('HEADSET_')) && (
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono uppercase">
                        Headset Scan
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-bold text-slate-500 mt-0.5">
                    {p.timestamp && (
                      <span className="text-cyan-400">{format(p.timestamp.toDate(), 'PP')}</span>
                    )}
                    <span>L: {p.leftFreq}Hz</span>
                    <span>R: {p.rightFreq}Hz</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    playInvertedProfile(p);
                  }}
                  className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                  aria-label="Play Inverted Profile"
                  title="Play Inverted Profile"
                >
                  <FlipVertical size={14} />
                  <span className="ml-1.5">Invert</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileToDelete(p);
                  }}
                  className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 h-9 w-9 shrink-0"
                  aria-label="Delete profile"
                >
                  <Trash2 size={16} />
                </Button>
                <div onClick={() => loadProfile(p)} className="cursor-pointer pl-1">
                  <ChevronRight
                    size={16}
                    className="text-slate-700 group-hover:text-cyan-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sound profile "{profileToDelete?.label}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
