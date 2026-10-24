'use client';

import { HelpCircle, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

type HelpModalProps = {
  showHelp: boolean;
  setShowHelp: Dispatch<SetStateAction<boolean>>;
};

const HelpSection = ({
  title,
  children,
  colorClass,
}: {
  title: string;
  children: React.ReactNode;
  colorClass: string;
}) => (
  <section className="space-y-2">
    <h4
      className={`font-black text-xs uppercase tracking-tighter italic ${colorClass}`}
    >
      {title}
    </h4>
    <p className="text-sm text-slate-400 leading-relaxed">{children}</p>
  </section>
);

export default function HelpModal({ showHelp, setShowHelp }: HelpModalProps) {
  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="bg-slate-900 border-white/10 w-full max-w-lg p-0 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <DialogHeader className="bg-cyan-500 p-6 flex flex-row justify-between items-center space-y-0">
          <DialogTitle className="text-slate-950 font-black uppercase tracking-widest flex items-center gap-2">
            <HelpCircle size={20} /> How to Use
          </DialogTitle>
          <DialogClose className="text-slate-950/50 hover:text-slate-950 transition-colors">
            <X size={24} />
          </DialogClose>
        </DialogHeader>
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <HelpSection title="01. Match Your Pitch" colorClass="text-cyan-400">
            Adjust the <strong>Frequency (Hz)</strong> sliders for each ear
            until the tone matches the pitch of your tinnitus. Use the{' '}
            <strong>Waveform</strong> buttons to switch between pure (sine) or
            sharper tones.
          </HelpSection>
          <HelpSection title="02. Calibrate Volume" colorClass="text-indigo-400">
            Slowly raise the <strong>Amplitude (%)</strong>. Finding your exact
            volume match helps you track intensity changes over time or describe
            it accurately to specialists.
          </HelpSection>
          <HelpSection title="03. Bilateral Control" colorClass="text-cyan-400">
            Toggle <strong>Linked</strong> mode if your tinnitus is symmetrical.
            This moves both oscillators simultaneously. Toggle{' '}
            <strong>Separate</strong> for asymmetrical symptoms.
          </HelpSection>
          <HelpSection title="04. Log Data" colorClass="text-indigo-400">
            Click <strong>Save Current State</strong> to archive your settings.
            You can review these later in the <strong>Data</strong> tab to see if
            your pitch or volume fluctuates.
          </HelpSection>
          <HelpSection title="05. AI Assist" colorClass="text-cyan-400">
            Describe your symptoms in the <strong>AI Assistant</strong> to get a
            personalized starting point for your sound profile.
          </HelpSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}
