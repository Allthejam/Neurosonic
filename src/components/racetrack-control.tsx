'use client';

import { Radio } from 'lucide-react';
import React from 'react';

type RaceTrackControlProps = {
  label: string;
  freq: number;
  setFreq: (value: number) => void;
  vol: number;
  setVol: (value: number) => void;
  color: 'cyan' | 'indigo';
  active: boolean;
  phaseInverted: boolean;
  setPhaseInverted: (inverted: boolean) => void;
};

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  style,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  style: React.CSSProperties;
}) => (
  <div className="space-y-5">
    <div className="flex justify-between items-end">
      <label className="text-[9px] font-black text-white uppercase tracking-widest italic">
        {label}
      </label>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-mono font-black text-white">
          {Math.round(value)}
        </span>
        <span className="text-[9px] font-bold text-white">{unit}</span>
      </div>
    </div>
    <div className="relative pt-2 pb-6">
      <div className="absolute top-4 inset-x-0 h-4 bg-slate-950 rounded-full border border-white/5" />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="race-slider-mobile"
        style={style}
      />
    </div>
  </div>
);

export default function RaceTrackControl({
  label,
  freq,
  setFreq,
  vol,
  setVol,
  color,
  active,
  phaseInverted,
  setPhaseInverted,
}: RaceTrackControlProps) {
  const isCyan = color === 'cyan';
  const accentColor = isCyan ? '#06b6d4' : '#6366f1';
  const glowColor = isCyan
    ? 'rgba(6, 182, 212, 0.4)'
    : 'rgba(99, 102, 241, 0.4)';
  const style = { '--accent': accentColor, '--glow': glowColor } as React.CSSProperties

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 blur-[60px] rounded-full transition-opacity duration-700 ${
          active ? 'opacity-20' : 'opacity-0'
        } ${isCyan ? 'bg-cyan-500' : 'bg-indigo-500'}`}
      />
      <div className="relative z-10 space-y-10">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">
              {label} Oscillator
            </span>
            <h3 className="text-xl font-black italic tracking-tighter text-white font-headline">
              TELEMETRY
            </h3>
          </div>
          <div
            className={`p-2 rounded-lg bg-slate-950 border ${
              isCyan
                ? 'border-cyan-500/20 text-cyan-400'
                : 'border-indigo-500/20 text-indigo-400'
            }`}
          >
            <Radio size={14} className={active ? 'animate-pulse' : ''} />
          </div>
        </div>

        <Slider
          label="Frequency"
          value={freq}
          min={500}
          max={12000}
          step={10}
          onChange={(e) => setFreq(parseInt(e.target.value))}
          unit="HZ"
          style={style}
        />

        <Slider
          label="Amplitude"
          value={vol}
          min={0}
          max={100}
          step={0.1}
          onChange={(e) => setVol(parseFloat(e.target.value))}
          unit="%"
          style={style}
        />

        <div className="space-y-3">
           <label className="text-[9px] font-black text-white uppercase tracking-widest italic">
            Phase
          </label>
           <button
            onClick={() => setPhaseInverted(!phaseInverted)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
              phaseInverted
                ? `bg-indigo-500 border-indigo-500 text-white`
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-widest">
              {phaseInverted ? 'Phase: Inverted' : 'Phase: Normal'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
