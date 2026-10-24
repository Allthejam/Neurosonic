'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { WaveformType } from '@/types';

type AudioEngineProps = {
  leftFreq: number;
  rightFreq: number;
  leftVol: number;
  rightVol: number;
  waveType: WaveformType;
  leftPhaseInverted: boolean;
  rightPhaseInverted: boolean;
};

export function useAudioEngine({
  leftFreq,
  rightFreq,
  leftVol,
  rightVol,
  waveType,
  leftPhaseInverted,
  rightPhaseInverted,
}: AudioEngineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  // Oscillators
  const leftOsc = useRef<OscillatorNode | null>(null);
  const rightOsc = useRef<OscillatorNode | null>(null);

  // Volume Gain Nodes
  const leftGain = useRef<GainNode | null>(null);
  const rightGain = useRef<GainNode | null>(null);

  // Phase Inversion Gain Nodes
  const leftInversionGain = useRef<GainNode | null>(null);
  const rightInversionGain = useRef<GainNode | null>(null);

  const initialiseAudio = useCallback(() => {
    if (!audioCtx.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) {
        console.error('Web Audio API is not supported in this browser.');
        return;
      }
      audioCtx.current = new Ctx();

      // === Left Channel Setup ===
      leftOsc.current = audioCtx.current.createOscillator();
      leftInversionGain.current = audioCtx.current.createGain();
      leftGain.current = audioCtx.current.createGain();
      const pannerLeft = audioCtx.current.createStereoPanner();
      pannerLeft.pan.value = -1;

      // Chain: Oscillator -> Inversion -> Volume -> Panner -> Destination
      leftOsc.current.connect(leftInversionGain.current);
      leftInversionGain.current.connect(leftGain.current);
      leftGain.current.connect(pannerLeft);
      pannerLeft.connect(audioCtx.current.destination);
      leftOsc.current.start();

      // === Right Channel Setup ===
      rightOsc.current = audioCtx.current.createOscillator();
      rightInversionGain.current = audioCtx.current.createGain();
      rightGain.current = audioCtx.current.createGain();
      const pannerRight = audioCtx.current.createStereoPanner();
      pannerRight.pan.value = 1;

      // Chain: Oscillator -> Inversion -> Volume -> Panner -> Destination
      rightOsc.current.connect(rightInversionGain.current);
      rightInversionGain.current.connect(rightGain.current);
      rightGain.current.connect(pannerRight);
      pannerRight.connect(audioCtx.current.destination);
      rightOsc.current.start();
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioCtx.current) initialiseAudio();
    if (audioCtx.current?.state === 'suspended') {
      audioCtx.current.resume();
    }
    setIsPlaying((prev) => !prev);
  }, [initialiseAudio]);

  // Effect for Core Audio Properties (Volume, Frequency, Waveform)
  useEffect(() => {
    if (!audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    const rampTime = 0.05; // 50ms anti-pop smoothing
    const maxSafeGain = 0.15; // Safety limiter

    // Volume
    if (leftGain.current) {
      const scaledLeft = isPlaying ? (leftVol / 100) * maxSafeGain : 0;
      leftGain.current.gain.setTargetAtTime(scaledLeft, now, rampTime);
    }
    if (rightGain.current) {
      const scaledRight = isPlaying ? (rightVol / 100) * maxSafeGain : 0;
      rightGain.current.gain.setTargetAtTime(scaledRight, now, rampTime);
    }

    // Frequency & Waveform
    if (leftOsc.current) {
      leftOsc.current.type = waveType;
      leftOsc.current.frequency.setTargetAtTime(leftFreq, now, rampTime);
    }
    if (rightOsc.current) {
      rightOsc.current.type = waveType;
      rightOsc.current.frequency.setTargetAtTime(rightFreq, now, rampTime);
    }
  }, [leftVol, rightVol, leftFreq, rightFreq, isPlaying, waveType]);

  // Effect for Phase Inversion
  useEffect(() => {
    if (!audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    const rampTime = 0.005; // Use a small time constant for a fast but smooth transition

    if (leftInversionGain.current) {
      const targetGain = leftPhaseInverted ? -1 : 1;
      // Use setTargetAtTime for smooth transitions across zero, which exponentialRamp cannot do.
      leftInversionGain.current.gain.setTargetAtTime(targetGain, now, rampTime);
    }
    if (rightInversionGain.current) {
      const targetGain = rightPhaseInverted ? -1 : 1;
      rightInversionGain.current.gain.setTargetAtTime(targetGain, now, rampTime);
    }
  }, [leftPhaseInverted, rightPhaseInverted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtx.current) {
        audioCtx.current.close();
      }
    };
  }, []);

  return { isPlaying, togglePlayback, initialiseAudio };
}
