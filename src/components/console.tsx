'use client';

import {
  Link,
  Link2Off,
  Pause,
  Play,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { WaveformType } from '@/types';
import RaceTrackControl from './racetrack-control';
import { Button } from './ui/button';

type ConsoleProps = {
  isLinked: boolean;
  setIsLinked: Dispatch<SetStateAction<boolean>>;
  waveType: WaveformType;
  setWaveType: Dispatch<SetStateAction<WaveformType>>;
  isPlaying: boolean;
  togglePlayback: () => void;
  initialiseAudio: () => void;
  leftFreq: number;
  rightFreq: number;
  leftVol: number;
  rightVol: number;
  handleFreqChange: (side: 'left' | 'right', val: number) => void;
  handleVolChange: (side: 'left' | 'right', val: number) => void;
  onLogRequest: () => void;
  isLogging: boolean;
  leftPhaseInverted: boolean;
  setLeftPhaseInverted: Dispatch<SetStateAction<boolean>>;
  rightPhaseInverted: boolean;
  setRightPhaseInverted: Dispatch<SetStateAction<boolean>>;
  onPlayInverted: () => void;
};

const WaveformVisualizer = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="h-16 sm:h-24 bg-slate-900/20 border border-white/5 rounded-[2rem] p-4 sm:p-6 flex items-end gap-1 overflow-hidden">
    {[...Array(40)].map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-cyan-500/20 rounded-full transition-all duration-300"
        style={{
          height: isPlaying ? `${Math.random() * 90 + 10}%` : '4px',
          backgroundColor: isPlaying
            ? i % 2 === 0
              ? '#06b6d4'
              : '#6366f1'
            : '#1e293b',
        }}
      />
    ))}
  </div>
);

export default function Console({
  isLinked,
  setIsLinked,
  waveType,
  setWaveType,
  isPlaying,
  togglePlayback,
  initialiseAudio,
  leftFreq,
  rightFreq,
  leftVol,
  rightVol,
  handleFreqChange,
  handleVolChange,
  onLogRequest,
  isLogging,
  leftPhaseInverted,
  setLeftPhaseInverted,
  rightPhaseInverted,
  setRightPhaseInverted,
  onPlayInverted,
}: ConsoleProps) {
  const waveforms: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
            Waveform Signature
          </h2>
          <div className="flex flex-wrap gap-2">
            {waveforms.map((type) => (
              <button
                key={type}
                onClick={() => setWaveType(type)}
                className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  waveType === type
                    ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center gap-3">
          <button
            onClick={() => setIsLinked(!isLinked)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
              isLinked
                ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            {isLinked ? <Link size={16} /> : <Link2Off size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLinked ? 'Linked' : 'Separate'}
            </span>
          </button>
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
            Bilateral Control
          </span>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 flex items-center justify-center">
          <button
            onClick={() => {
              initialiseAudio();
              togglePlayback();
            }}
            className={`w-full h-full min-h-[80px] rounded-2xl flex flex-col items-center justify-center transition-all ${
              isPlaying
                ? 'bg-red-500 text-white'
                : 'bg-cyan-500/10 border-2 border-cyan-500/50 text-cyan-400'
            }`}
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
            <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">
              {isPlaying ? 'Halt' : 'Initialise'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <RaceTrackControl
          label="Port (L)"
          freq={leftFreq}
          setFreq={(v) => handleFreqChange('left', v)}
          vol={leftVol}
          setVol={(v) => handleVolChange('left', v)}
          color="cyan"
          active={isPlaying}
          phaseInverted={leftPhaseInverted}
          setPhaseInverted={setLeftPhaseInverted}
        />
        <RaceTrackControl
          label="Starboard (R)"
          freq={rightFreq}
          setFreq={(v) => handleFreqChange('right', v)}
          vol={rightVol}
          setVol={(v) => handleVolChange('right', v)}
          color="indigo"
          active={isPlaying}
          phaseInverted={rightPhaseInverted}
          setPhaseInverted={setRightPhaseInverted}
        />
      </div>

      <WaveformVisualizer isPlaying={isPlaying} />

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          disabled={isLogging}
          onClick={onLogRequest}
          className="w-full sm:w-auto px-12 py-7 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 h-auto"
        >
          {isLogging ? 'Synchronising...' : 'Log Telemetry'}
        </Button>
        <Button
          onClick={onPlayInverted}
          className="w-full sm:w-auto px-12 py-7 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all hover:bg-indigo-600 active:scale-95 h-auto"
        >
          Play Inverted
        </Button>
      </div>
    </>
  );
}
