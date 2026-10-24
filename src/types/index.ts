import type { Timestamp } from 'firebase/firestore';

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export type SoundProfile = {
  id?: string;
  leftFreq: number;
  rightFreq: number;
  leftVol: number;
  rightVol: number;
  waveType: WaveformType;
  timestamp: Timestamp;
  label: string;
  leftPhaseInverted: boolean;
  rightPhaseInverted: boolean;
};
