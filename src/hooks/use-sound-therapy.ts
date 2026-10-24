
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type SoundTherapyType =
  | 'pink-noise'
  | 'brown-noise'
  | 'notched-noise'
  | 'amplitude-modulation'
  | 'ocean-waves'
  | 'rainstorm'
  | 'forest-sounds'
  | 'light-music';

type UseSoundTherapyProps = {
  tinnitusFreq: number;
};

const audioFiles: Partial<Record<SoundTherapyType, string>> = {
    'ocean-waves': '/sounds/ocean-waves.mp3',
    'rainstorm': '/sounds/rainstorm.mp3',
    'forest-sounds': '/sounds/forest-sounds.mp3',
    'light-music': '/sounds/light-music.mp3',
};
const PRE_RECORDED_SOUNDS = Object.keys(audioFiles) as SoundTherapyType[];

export function useSoundTherapy({ tinnitusFreq }: UseSoundTherapyProps) {
  const [isPlaying, setIsPlaying] = useState<SoundTherapyType | null>(null);
  const [volume, setVolume] = useState(0.5); // 0 to 1
  const [error, setError] = useState<string | null>(null);

  const audioCtx = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);

  // Store audio elements and their sources
  const audioElements = useRef<Partial<Record<SoundTherapyType, {element: HTMLAudioElement, source: MediaElementAudioSourceNode}>>>({});
  
  // Store generated sound sources (non-HTMLAudioElement)
  const generatedSource = useRef<AudioNode | null>(null);
  const lfo = useRef<OscillatorNode | null>(null);


  const stop = useCallback(() => {
    // Stop and disconnect any generated sound
    if (generatedSource.current && 'stop' in generatedSource.current) {
      try {
        (generatedSource.current as AudioScheduledSourceNode).stop();
      } catch (e) { /* ignore */ }
    }
    generatedSource.current?.disconnect();
    generatedSource.current = null;

    if (lfo.current && 'stop' in lfo.current) {
        try {
            lfo.current.stop();
        } catch(e) { /* ignore */ }
    }
    lfo.current?.disconnect();
    lfo.current = null;
    
    // Pause all HTML audio elements
    for (const key in audioElements.current) {
        const audioInfo = audioElements.current[key as SoundTherapyType];
        if (audioInfo) {
            audioInfo.element.pause();
            if(audioCtx.current) {
              audioInfo.source.disconnect();
            }
        }
    }

    if (gainNode.current) {
        gainNode.current.disconnect();
    }
    setIsPlaying(null);
  }, []);
  
  const createNoiseBuffer = useCallback((type: 'white' | 'pink' | 'brown') => {
    if (!audioCtx.current) return null;
    const bufferSize = 2 * audioCtx.current.sampleRate;
    const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else { // Pink or Brown
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        } else { // Brown
          b0 = 0.995 * b0 + white * 0.05;
          output[i] = b0;
        }
      }
    }
    return buffer;
  }, []);
  
  const play = useCallback(async (type: SoundTherapyType) => {
    if (isPlaying === type) {
      stop();
      return;
    }

    if (isPlaying) {
      stop();
    }
    
    setError(null);

    if (!audioCtx.current) {
        try {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            audioCtx.current = new Ctx();
        } catch (e) {
            console.error('Web Audio API is not supported', e);
            setError('Web Audio API is not supported in your browser.');
            return;
        }
    }
    
    if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
    }

    setIsPlaying(type);
    
    gainNode.current = audioCtx.current.createGain();
    gainNode.current.gain.value = volume;
    gainNode.current.connect(audioCtx.current.destination);

    try {
      if (PRE_RECORDED_SOUNDS.includes(type)) {
          let audioInfo = audioElements.current[type];
          
          if (!audioInfo) {
            const audio = new Audio(audioFiles[type]!);
            audio.crossOrigin = "anonymous";
            audio.loop = true;
            const source = audioCtx.current.createMediaElementSource(audio);
            audioInfo = { element: audio, source };
            audioElements.current[type] = audioInfo;
          }
          
          audioInfo.source.connect(gainNode.current);
          await audioInfo.element.play();

      } else { // Generated sounds
          let source: AudioNode | null = null;
          
          if (type.includes('noise')) {
              let noiseType: 'white' | 'pink' | 'brown' = 'white';
              if (type === 'pink-noise') noiseType = 'pink';
              if (type === 'brown-noise') noiseType = 'brown';
              if (type === 'notched-noise') noiseType = 'white';
              
              const bufferSource = audioCtx.current.createBufferSource();
              const noiseBuffer = createNoiseBuffer(noiseType);
              if(!noiseBuffer) throw new Error("Could not create noise buffer");
              bufferSource.buffer = noiseBuffer;
              bufferSource.loop = true;

              if (type === 'notched-noise' && audioCtx.current) {
                  const notchFilter = audioCtx.current.createBiquadFilter();
                  notchFilter.type = 'notch';
                  notchFilter.frequency.value = tinnitusFreq;
                  notchFilter.Q.value = 10;
                  bufferSource.connect(notchFilter);
                  notchFilter.connect(gainNode.current);
              } else {
                  bufferSource.connect(gainNode.current);
              }
              bufferSource.start();
              source = bufferSource;

          } else if (type === 'amplitude-modulation' && audioCtx.current) {
              const amSource = audioCtx.current.createOscillator();
              amSource.type = 'sine';
              amSource.frequency.value = 7000;
              
              lfo.current = audioCtx.current.createOscillator();
              lfo.current.type = 'sine';
              lfo.current.frequency.value = 10;
              
              const lfoGain = audioCtx.current.createGain();
              lfoGain.gain.value = 0.5;

              lfo.current.connect(lfoGain);
              lfoGain.connect(gainNode.current.gain);
              
              amSource.connect(gainNode.current);
              amSource.start();
              lfo.current.start();
              source = amSource;
          }

          generatedSource.current = source;
      }
    } catch (e: any) {
        console.error(`Failed to play sound: ${type}`, e);
        setError(`Could not load or play sound: ${e.message}. Check your connection and browser permissions.`);
        stop();
    }
  }, [isPlaying, stop, volume, createNoiseBuffer, tinnitusFreq]);
  
  useEffect(() => {
    if (gainNode.current && audioCtx.current) {
      gainNode.current.gain.setTargetAtTime(volume, audioCtx.current.currentTime, 0.01);
    }
  }, [volume]);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stop();
      if (audioCtx.current) {
        audioCtx.current.close().catch(console.error);
        audioCtx.current = null;
      }
    };
  }, [stop]);

  return { isPlaying, play, stop, volume, setVolume, error };
}
