'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Square,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Activity,
  Layers,
  Save,
  HelpCircle,
  Ear
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import type { WaveformType } from '@/types';

type HeadsetModeProps = {
  leftFreq: number;
  rightFreq: number;
  leftVol: number;
  rightVol: number;
  waveType: WaveformType;
  setLeftFreq: (v: number) => void;
  setRightFreq: (v: number) => void;
  setLeftVol: (v: number) => void;
  setRightVol: (v: number) => void;
  setWaveType: (w: WaveformType) => void;
  setIsLinked: (l: boolean) => void;
  onSaveToArchive: (profileData: {
    leftFreq: number;
    rightFreq: number;
    leftVol: number;
    rightVol: number;
    waveType: WaveformType;
    label: string;
    audiogramData?: any;
  }) => void;
  onSwitchToConsole: () => void;
};

const AUDIOGRAM_FREQUENCIES = [250, 500, 1000, 2000, 4000, 6000, 8000, 12000];

export default function HeadsetMode({
  leftFreq,
  rightFreq,
  leftVol,
  rightVol,
  waveType,
  setLeftFreq,
  setRightFreq,
  setLeftVol,
  setRightVol,
  setWaveType,
  setIsLinked,
  onSaveToArchive,
  onSwitchToConsole,
}: HeadsetModeProps) {
  // Navigation Steps
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Channel Verification State
  const [leftConfirmed, setLeftConfirmed] = useState(false);
  const [rightConfirmed, setRightConfirmed] = useState(false);

  // Step 2: Audiogram Threshold State
  // Stored as hearing loss percentage (0 = normal hearing / audible at quietest, 100 = severe loss)
  const [selectedEar, setSelectedEar] = useState<'left' | 'right'>('left');
  const [currentFreqIndex, setCurrentFreqIndex] = useState(0);
  const [testToneVol, setTestToneVol] = useState(25); // 0 to 100
  const [isTestTonePlaying, setIsTestTonePlaying] = useState(false);
  const [leftThresholds, setLeftThresholds] = useState<Record<number, number>>({
    250: 10,
    500: 15,
    1000: 15,
    2000: 20,
    4000: 45,
    6000: 60,
    8000: 70,
    12000: 80,
  });
  const [rightThresholds, setRightThresholds] = useState<Record<number, number>>({
    250: 10,
    500: 10,
    1000: 15,
    2000: 20,
    4000: 35,
    6000: 45,
    8000: 55,
    12000: 65,
  });

  // Step 3: Tinnitus Matching State
  const [tinnitusEar, setTinnitusEar] = useState<'both' | 'left' | 'right'>('both');
  const [matchedFreq, setMatchedFreq] = useState(leftFreq || 6500);
  const [matchedVol, setMatchedVol] = useState(Math.max(leftVol, rightVol) || 30);
  const [matchedWave, setMatchedWave] = useState<WaveformType>(waveType || 'sine');
  const [bracketState, setBracketState] = useState<{
    low: number;
    high: number;
    activeTone: 'A' | 'B' | null;
  }>({
    low: 1000,
    high: 12000,
    activeTone: null,
  });

  // Step 4: Empathy Simulation State
  const [isSimulating, setIsSimulating] = useState(false);

  // Web Audio Context for Headset Mode
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscRef = useRef<OscillatorNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const activePannerRef = useRef<StereoPannerNode | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  // Initialize Audio Context safely
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        audioCtxRef.current = new Ctx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopAllAudio = useCallback(() => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    if (activeGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      activeGainRef.current.gain.setTargetAtTime(0, now, 0.02);
    }
    setTimeout(() => {
      if (activeOscRef.current) {
        try {
          activeOscRef.current.stop();
          activeOscRef.current.disconnect();
        } catch (e) {
          /* ignore */
        }
        activeOscRef.current = null;
      }
      activeGainRef.current = null;
      activePannerRef.current = null;
      setIsTestTonePlaying(false);
      setIsSimulating(false);
    }, 40);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAllAudio]);

  // Play an isolated pulse in a specific ear
  const playChannelCheckTone = (channel: 'left' | 'right') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    stopAllAudio();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(channel === 'left' ? 880 : 1320, ctx.currentTime);
    panner.pan.setValueAtTime(channel === 'left' ? -1 : 1, ctx.currentTime);

    // Beep 3 times
    gain.gain.setValueAtTime(0, ctx.currentTime);
    const now = ctx.currentTime;
    const beepDuration = 0.18;
    const beepInterval = 0.28;
    const maxGain = 0.1; // Gentle, safe volume

    for (let i = 0; i < 3; i++) {
      const t = now + i * beepInterval;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(maxGain, t + 0.02);
      gain.gain.setValueAtTime(maxGain, t + beepDuration - 0.02);
      gain.gain.linearRampToValueAtTime(0, t + beepDuration);
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 3 * beepInterval + 0.1);

    if (channel === 'left') setLeftConfirmed(true);
    if (channel === 'right') setRightConfirmed(true);
  };

  // Play test tone for Audiogram threshold
  const toggleAudiogramTone = (play: boolean, freq: number, volPercent: number, ear: 'left' | 'right') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!play) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    panner.pan.setValueAtTime(ear === 'left' ? -1 : 1, ctx.currentTime);

    const safeMaxGain = 0.12;
    const targetGain = (volPercent / 100) * safeMaxGain;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start();

    activeOscRef.current = osc;
    activeGainRef.current = gain;
    activePannerRef.current = panner;
    setIsTestTonePlaying(true);
  };

  // Update volume during active test tone
  useEffect(() => {
    if (isTestTonePlaying && activeGainRef.current && audioCtxRef.current) {
      const safeMaxGain = 0.12;
      const targetGain = (testToneVol / 100) * safeMaxGain;
      activeGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.03);
    }
  }, [testToneVol, isTestTonePlaying]);

  // Record threshold and advance
  const recordCurrentThreshold = () => {
    const currentFreq = AUDIOGRAM_FREQUENCIES[currentFreqIndex];
    if (selectedEar === 'left') {
      setLeftThresholds((prev) => ({ ...prev, [currentFreq]: testToneVol }));
    } else {
      setRightThresholds((prev) => ({ ...prev, [currentFreq]: testToneVol }));
    }

    stopAllAudio();

    if (currentFreqIndex < AUDIOGRAM_FREQUENCIES.length - 1) {
      setCurrentFreqIndex((prev) => prev + 1);
    } else if (selectedEar === 'left') {
      setSelectedEar('right');
      setCurrentFreqIndex(0);
    }
  };

  // Step 3: Play tone comparison for bracketing
  const playBracketTone = (tone: 'A' | 'B') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    stopAllAudio();

    const freq = tone === 'A' ? bracketState.low : bracketState.high;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = matchedWave;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const panVal = tinnitusEar === 'left' ? -1 : tinnitusEar === 'right' ? 1 : 0;
    panner.pan.setValueAtTime(panVal, ctx.currentTime);

    const safeGain = (matchedVol / 100) * 0.12;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeGain), ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start();
    activeOscRef.current = osc;
    activeGainRef.current = gain;
    activePannerRef.current = panner;

    setBracketState((prev) => ({ ...prev, activeTone: tone }));

    // Auto shut off after 2.5 seconds to avoid fatigue
    setTimeout(() => {
      stopAllAudio();
      setBracketState((prev) => ({ ...prev, activeTone: null }));
    }, 2500);
  };

  const refineBracket = (choice: 'closerToA' | 'closerToB') => {
    const mid = Math.round((bracketState.low + bracketState.high) / 2);
    if (choice === 'closerToA') {
      setBracketState({
        low: bracketState.low,
        high: mid,
        activeTone: null,
      });
      setMatchedFreq(Math.round((bracketState.low + mid) / 2));
    } else {
      setBracketState({
        low: mid,
        high: bracketState.high,
        activeTone: null,
      });
      setMatchedFreq(Math.round((mid + bracketState.high) / 2));
    }
    stopAllAudio();
  };

  // Step 4: Empathy Simulation toggle
  const toggleEmpathySimulation = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isSimulating) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const pannerL = ctx.createStereoPanner();
    const pannerR = ctx.createStereoPanner();

    pannerL.pan.setValueAtTime(-1, ctx.currentTime);
    pannerR.pan.setValueAtTime(1, ctx.currentTime);

    leftOsc.type = matchedWave;
    rightOsc.type = matchedWave;

    // Apply frequency based on ear selection
    const fL = tinnitusEar === 'right' ? 0 : matchedFreq;
    const fR = tinnitusEar === 'left' ? 0 : matchedFreq;

    if (fL > 0) leftOsc.frequency.setValueAtTime(fL, ctx.currentTime);
    if (fR > 0) rightOsc.frequency.setValueAtTime(fR, ctx.currentTime);

    const safeMax = 0.12;
    const vL = tinnitusEar === 'right' ? 0 : (matchedVol / 100) * safeMax;
    const vR = tinnitusEar === 'left' ? 0 : (matchedVol / 100) * safeMax;

    leftGain.gain.setValueAtTime(vL, ctx.currentTime);
    rightGain.gain.setValueAtTime(vR, ctx.currentTime);

    leftOsc.connect(leftGain);
    leftGain.connect(pannerL);
    pannerL.connect(ctx.destination);

    rightOsc.connect(rightGain);
    rightGain.connect(pannerR);
    pannerR.connect(ctx.destination);

    leftOsc.start();
    rightOsc.start();

    activeOscRef.current = leftOsc;
    setIsSimulating(true);
  };

  // Sync to console
  const handleApplyToConsole = () => {
    stopAllAudio();
    const f = matchedFreq;
    const v = matchedVol;

    if (tinnitusEar === 'both') {
      setLeftFreq(f);
      setRightFreq(f);
      setLeftVol(v);
      setRightVol(v);
      setIsLinked(true);
    } else if (tinnitusEar === 'left') {
      setLeftFreq(f);
      setLeftVol(v);
      setRightVol(0);
      setIsLinked(false);
    } else {
      setRightFreq(f);
      setRightVol(v);
      setLeftVol(0);
      setIsLinked(false);
    }
    setWaveType(matchedWave);
    onSwitchToConsole();
  };

  const handleSaveProfile = () => {
    stopAllAudio();
    const label = `HEADSET_CALIBRATION_${new Date().toLocaleDateString('en-GB')}`;
    const audiogram = {
      frequencies: AUDIOGRAM_FREQUENCIES,
      leftThresholds: AUDIOGRAM_FREQUENCIES.map((f) => leftThresholds[f] || 0),
      rightThresholds: AUDIOGRAM_FREQUENCIES.map((f) => rightThresholds[f] || 0),
      tinnitusEar,
      matchedFreq,
      matchedVol,
    };

    onSaveToArchive({
      leftFreq: tinnitusEar === 'right' ? 0 : matchedFreq,
      rightFreq: tinnitusEar === 'left' ? 0 : matchedFreq,
      leftVol: tinnitusEar === 'right' ? 0 : matchedVol,
      rightVol: tinnitusEar === 'left' ? 0 : matchedVol,
      waveType: matchedWave,
      label,
      audiogramData: audiogram,
    });
  };

  // Prepare chart data for Recharts
  const chartData = AUDIOGRAM_FREQUENCIES.map((freq) => ({
    freq: freq >= 1000 ? `${freq / 1000}k` : `${freq}`,
    hz: freq,
    LeftEar: leftThresholds[freq] ?? 0,
    RightEar: rightThresholds[freq] ?? 0,
  }));

  const currentTestingFreq = AUDIOGRAM_FREQUENCIES[currentFreqIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-[#071328] to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Headphones size={200} className="text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-950/40 uppercase tracking-widest text-[10px] px-3 py-1">
                <Headphones size={12} className="mr-1.5" />
                Headset Mode Active
              </Badge>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-950/40 uppercase tracking-widest text-[10px] px-3 py-1">
                Acoustic Isolation
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase font-headline">
              Bilateral Earphone Calibration & Audiogram
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Use stereo earphones or closed-back headphones to independently map left and right ear hearing thresholds, zero-in on your exact tinnitus frequency, and let others hear your bilateral balance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              onClick={handleApplyToConsole}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider px-5 shadow-lg shadow-cyan-500/20"
            >
              <Sparkles size={14} className="mr-2" />
              Apply to Console
            </Button>
            <Button
              onClick={handleSaveProfile}
              variant="outline"
              className="border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs uppercase tracking-wider"
            >
              <Save size={14} className="mr-2" />
              Save Audiogram
            </Button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-8 pt-6 border-t border-white/5">
          {[
            { step: 1, title: '1. Stereo Fit Check', desc: 'L/R Channel Verification' },
            { step: 2, title: '2. Hearing Thresholds', desc: 'Bilateral Audiogram Scan' },
            { step: 3, title: '3. Tinnitus Matcher', desc: 'Pitch & Loudness Locator' },
            { step: 4, title: '4. Empathy Simulator', desc: 'Hear What I Hear' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                stopAllAudio();
                setActiveStep(item.step as any);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeStep === item.step
                  ? 'border-cyan-500/80 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{item.title}</span>
                {item.step === 1 && leftConfirmed && rightConfirmed && (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Stereo Fit & Channel Verification */}
      {activeStep === 1 && (
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="text-cyan-400" size={20} />
              Step 1: Stereo Placement & Channel Verification
            </CardTitle>
            <CardDescription className="text-slate-400">
              Put on your earphones. Tap each button below to verify that sound plays exclusively in that ear without bleeding across.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Channel */}
              <div className="p-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ear className="text-blue-400" size={24} />
                    <div>
                      <h4 className="font-bold text-white">Left Ear Channel</h4>
                      <p className="text-xs text-slate-400">Isolated 880 Hz tone (Pan: 100% Left)</p>
                    </div>
                  </div>
                  {leftConfirmed && (
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px]">
                      Confirmed
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => playChannelCheckTone('left')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider py-6"
                >
                  <Volume2 size={16} className="mr-2" />
                  Play 3 Beeps in Left Ear
                </Button>
              </div>

              {/* Right Channel */}
              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ear className="text-rose-400" size={24} />
                    <div>
                      <h4 className="font-bold text-white">Right Ear Channel</h4>
                      <p className="text-xs text-slate-400">Isolated 1320 Hz tone (Pan: 100% Right)</p>
                    </div>
                  </div>
                  {rightConfirmed && (
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]">
                      Confirmed
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => playChannelCheckTone('right')}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider py-6"
                >
                  <Volume2 size={16} className="mr-2" />
                  Play 3 Beeps in Right Ear
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  stopAllAudio();
                  setActiveStep(2);
                }}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider"
              >
                Continue to Audiogram Scan
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Bilateral Audiogram Threshold Sweep */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Threshold Controller */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="text-cyan-400" size={18} />
                    Sensitivity Tester
                  </CardTitle>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      onClick={() => {
                        stopAllAudio();
                        setSelectedEar('left');
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                        selectedEar === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Left Ear
                    </button>
                    <button
                      onClick={() => {
                        stopAllAudio();
                        setSelectedEar('right');
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                        selectedEar === 'right' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Right Ear
                    </button>
                  </div>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Testing frequency: <strong className="text-cyan-400">{currentTestingFreq} Hz</strong> in the{' '}
                  <span className={selectedEar === 'left' ? 'text-blue-400 font-bold' : 'text-rose-400 font-bold'}>
                    {selectedEar.toUpperCase()} ear
                  </span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Frequency Quick Tabs */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Select Test Frequency (Hz)
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {AUDIOGRAM_FREQUENCIES.map((freq, idx) => (
                      <button
                        key={freq}
                        onClick={() => {
                          stopAllAudio();
                          setCurrentFreqIndex(idx);
                        }}
                        className={`py-2 px-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          currentFreqIndex === idx
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {freq >= 1000 ? `${freq / 1000}k` : freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Volume Slider */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Test Volume Threshold</span>
                    <span className="font-mono text-cyan-400 font-bold">{testToneVol}%</span>
                  </div>
                  <Slider
                    value={[testToneVol]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(val) => setTestToneVol(val[0])}
                  />
                  <p className="text-[10px] text-slate-500">
                    Find the quietest level where you can <em>just barely</em> detect the tone.
                  </p>
                </div>

                {/* Play / Stop & Record */}
                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      toggleAudiogramTone(!isTestTonePlaying, currentTestingFreq, testToneVol, selectedEar)
                    }
                    className={`flex-1 font-bold text-xs uppercase tracking-wider py-5 ${
                      isTestTonePlaying
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : selectedEar === 'left'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {isTestTonePlaying ? (
                      <>
                        <Square size={14} className="mr-2" /> Stop Tone
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-2" /> Listen to Tone
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={recordCurrentThreshold}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-5 px-5"
                  >
                    <CheckCircle2 size={14} className="mr-1.5" />
                    Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Audiogram Curve Display */}
          <div className="lg:col-span-7">
            <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="text-cyan-400" size={18} />
                      Bilateral Audiogram Curve
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Standard clinical color coding: <span className="text-blue-400 font-bold">Blue = Left Ear</span>,{' '}
                      <span className="text-rose-400 font-bold">Red = Right Ear</span>. Higher threshold = higher hearing loss.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                    Relative Audibility (dB)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="freq" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis
                        stroke="#64748b"
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="LeftEar"
                        name="Left Ear (Blue)"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#38bdf8' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="RightEar"
                        name="Right Ear (Red)"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#f43f5e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Notice where the curve climbs at 4kHz–8kHz: this highlights where your hearing loss and tinnitus pitch typically align.
                  </span>
                  <Button
                    onClick={() => {
                      stopAllAudio();
                      setActiveStep(3);
                    }}
                    size="sm"
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider ml-4"
                  >
                    Match Tinnitus Next
                    <ArrowRight size={12} className="ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 3: Tinnitus Pitch & Loudness Locator */}
      {activeStep === 3 && (
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="text-cyan-400" size={20} />
              Step 3: Isolated Ear Tinnitus Pitch & Loudness Matcher
            </CardTitle>
            <CardDescription className="text-slate-400">
              Isolate which ear experiences the ringing, choose the waveform texture that matches your sound, and tune the pitch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Ear Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Which Ear Experiences The Tinnitus?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'left', label: 'Left Ear Only', color: 'border-blue-500/50 bg-blue-950/20 text-blue-300' },
                  { id: 'both', label: 'Both Ears (Bilateral)', color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300' },
                  { id: 'right', label: 'Right Ear Only', color: 'border-rose-500/50 bg-rose-950/20 text-rose-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      stopAllAudio();
                      setTinnitusEar(item.id as any);
                    }}
                    className={`p-4 rounded-xl border text-center font-bold text-xs uppercase tracking-wider transition-all ${
                      tinnitusEar === item.id ? `${item.color} shadow-lg ring-1 ring-cyan-500/50` : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch & Loudness Tuning Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pitch */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tinnitus Pitch (Frequency)
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-lg">{matchedFreq} Hz</span>
                </div>
                <Slider
                  value={[matchedFreq]}
                  min={1000}
                  max={14000}
                  step={50}
                  onValueChange={(val) => setMatchedFreq(val[0])}
                />
                <div className="flex justify-between gap-1">
                  {[3000, 4500, 6000, 8000, 10000, 12000].map((f) => (
                    <button
                      key={f}
                      onClick={() => setMatchedFreq(f)}
                      className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300"
                    >
                      {f / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Loudness */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Perceived Loudness (Sensation Level)
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-lg">{matchedVol}%</span>
                </div>
                <Slider
                  value={[matchedVol]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setMatchedVol(val[0])}
                />
                <p className="text-[10px] text-slate-500">
                  Adjust until the volume in your headset matches the strength of your internal perception.
                </p>
              </div>
            </div>

            {/* Waveform Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Waveform Texture (Timbre)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sine', label: 'Sine Wave', desc: 'Pure whistled tone' },
                  { id: 'sawtooth', label: 'Sawtooth', desc: 'Electrical / buzzing ring' },
                  { id: 'triangle', label: 'Triangle', desc: 'Muffled smooth tone' },
                  { id: 'square', label: 'Square', desc: 'Harsh electronic tone' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setMatchedWave(w.id as WaveformType)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      matchedWave === w.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{w.label}</div>
                    <div className="text-[10px] text-slate-400">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Comparison Assistant (Bracketing) */}
            <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> Tone Bracketing Assistant
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Having trouble picking the exact pitch? Play Tone A vs Tone B and click which is closer.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Range: {bracketState.low} Hz – {bracketState.high} Hz
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => playBracketTone('A')}
                  variant="outline"
                  className={`py-5 border-slate-700 text-xs font-bold uppercase tracking-wider ${
                    bracketState.activeTone === 'A' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'text-slate-200'
                  }`}
                >
                  <Volume2 size={14} className="mr-2" /> Play Tone A ({bracketState.low} Hz)
                </Button>
                <Button
                  onClick={() => playBracketTone('B')}
                  variant="outline"
                  className={`py-5 border-slate-700 text-xs font-bold uppercase tracking-wider ${
                    bracketState.activeTone === 'B' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'text-slate-200'
                  }`}
                >
                  <Volume2 size={14} className="mr-2" /> Play Tone B ({bracketState.high} Hz)
                </Button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  onClick={() => refineBracket('closerToA')}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40"
                >
                  ← Closer to Tone A
                </Button>
                <Button
                  onClick={() =>
                    setBracketState({ low: 1000, high: 12000, activeTone: null })
                  }
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  <RotateCcw size={12} className="mr-1" /> Reset Range
                </Button>
                <Button
                  onClick={() => refineBracket('closerToB')}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40"
                >
                  Closer to Tone B →
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  stopAllAudio();
                  setActiveStep(4);
                }}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider"
              >
                Proceed to Empathy Simulator
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Empathy Simulator ("Hear What I Hear") */}
      {activeStep === 4 && (
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="text-cyan-400" size={20} />
              Step 4: Empathy Simulation Mode ("Hear What I Hear")
            </CardTitle>
            <CardDescription className="text-slate-400">
              Place the headset on someone else (a partner, family member, colleague, or audiologist) to let them experience your exact tinnitus profile and bilateral balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-slate-950 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Live Empathy Stream</h3>
                  <p className="text-xs text-slate-400">
                    Broadcasting: <strong className="text-cyan-400">{matchedFreq} Hz</strong> ({matchedWave} wave) at{' '}
                    <strong className="text-cyan-400">{matchedVol}% loudness</strong> in the{' '}
                    <strong className="text-cyan-400 uppercase">{tinnitusEar}</strong> ear channel.
                  </p>
                </div>

                <Button
                  onClick={toggleEmpathySimulation}
                  className={`font-bold text-sm uppercase tracking-wider px-8 py-6 shadow-xl ${
                    isSimulating
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <VolumeX size={18} className="mr-2" /> Stop Simulation
                    </>
                  ) : (
                    <>
                      <Volume2 size={18} className="mr-2" /> Start Headset Simulation
                    </>
                  )}
                </Button>
              </div>

              {isSimulating && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/40 flex items-center gap-3 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <div className="text-xs text-cyan-200">
                    Audio stream active in headset. The listener is currently experiencing your exact sound profile.
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <Button
                onClick={() => {
                  stopAllAudio();
                  setActiveStep(2);
                }}
                variant="outline"
                className="border-slate-800 text-slate-400 hover:text-white text-xs uppercase tracking-wider"
              >
                Back to Audiogram
              </Button>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleSaveProfile}
                  variant="outline"
                  className="border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs uppercase tracking-wider"
                >
                  <Save size={14} className="mr-2" />
                  Save Calibration Profile
                </Button>
                <Button
                  onClick={handleApplyToConsole}
                  className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider px-6"
                >
                  Apply & Go to Console
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
