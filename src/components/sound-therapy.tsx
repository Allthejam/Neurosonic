'use client';

import {
  Play,
  Pause,
  Ear,
  Waves,
  Wind,
  CloudRain,
  Zap,
  Signal,
  BarChart,
  Trees,
  Music,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSoundTherapy } from '@/hooks/use-sound-therapy';
import type { SoundTherapyType } from '@/hooks/use-sound-therapy';

type SoundCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  soundType: SoundTherapyType;
  isPlaying: boolean;
  onPlay: () => void;
};

const SoundCard = ({ title, description, icon, isPlaying, onPlay }: SoundCardProps) => (
  <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md flex flex-col">
    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
            {icon}
        </div>
        <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
        </div>
    </CardHeader>
    <CardContent className="flex-grow flex items-end">
       <Button onClick={onPlay} variant={isPlaying ? 'destructive' : 'default'} className="w-full">
        {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
        {isPlaying ? 'Stop' : 'Play'}
       </Button>
    </CardContent>
  </Card>
);

const PhysicalTechniqueCard = () => (
    <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Ear size={20} className="text-cyan-400"/>
            The "Drumming" Technique
        </CardTitle>
        <CardDescription>
            A physical maneuver some people find provides temporary relief.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-400">
        <p><strong className="text-white">Step 1:</strong> Place your palms over your ears, with your fingers resting on the back of your head.</p>
        <p><strong className="text-white">Step 2:</strong> Position your index fingers on top of your middle fingers.</p>
        <p><strong className="text-white">Step 3:</strong> Snap your index fingers down off your middle fingers, so they "drum" on the back of your skull.</p>
        <p><strong className="text-white">Step 4:</strong> Repeat this drumming motion 40-50 times.</p>
        <div className="text-center text-xs text-slate-500 p-3 bg-slate-950 rounded-lg mt-4">
            <p><strong>Note:</strong> This is a folk remedy and is not scientifically proven. It may or may not work for you.</p>
        </div>
      </CardContent>
    </Card>
)

export default function SoundTherapy({ tinnitusFreq }: { tinnitusFreq: number }) {
  const { isPlaying, play, volume, setVolume, error } = useSoundTherapy({ tinnitusFreq });

  const soundTherapies = [
    {
        title: 'Notched White Noise',
        description: 'White noise with a "notch" filtered out at your tinnitus frequency to encourage brain habituation.',
        icon: <Ear size={28} />,
        soundType: 'notched-noise' as SoundTherapyType,
    },
    {
        title: 'Amplitude Modulation',
        description: 'A high-frequency tone that is rhythmically varied in volume, which can suppress tinnitus perception.',
        icon: <Signal size={28} />,
        soundType: 'amplitude-modulation' as SoundTherapyType,
    },
    {
        title: 'Pink Noise',
        description: 'Deeper than white noise, with more low-frequency components, often compared to steady rain.',
        icon: <BarChart size={28} />,
        soundType: 'pink-noise' as SoundTherapyType,
    },
    {
        title: 'Brown Noise',
        description: 'Even deeper and stronger at low frequencies, like a strong wind or a low rumble.',
        icon: <Wind size={28} />,
        soundType: 'brown-noise' as SoundTherapyType,
    },
    {
        title: 'Ocean Waves',
        description: 'The calming and rhythmic sound of ocean waves washing ashore.',
        icon: <Waves size={28} />,
        soundType: 'ocean-waves' as SoundTherapyType,
    },
    {
        title: 'Rainstorm',
        description: 'The sound of a rainstorm to help relax, focus, or mask tinnitus.',
        icon: <CloudRain size={28} />,
        soundType: 'rainstorm' as SoundTherapyType,
    },
    {
        title: 'Forest Sounds',
        description: 'Immerse yourself in the gentle sounds of a forest, with birds and rustling leaves.',
        icon: <Trees size={28} />,
        soundType: 'forest-sounds' as SoundTherapyType,
    },
    {
        title: 'Light Music',
        description: 'Ambient, gentle music designed to be relaxing and non-intrusive.',
        icon: <Music size={28} />,
        soundType: 'light-music' as SoundTherapyType,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
            <h2 className="text-xl font-black italic tracking-widest flex items-center gap-3 text-white font-headline justify-center">
                <Zap className="text-cyan-400" />
                SOUND THERAPY SUITE
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
                Explore different soundscapes designed to help manage and reduce the perception of tinnitus. Experiment to find what works best for you.
            </p>
        </div>

        {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive-foreground p-4 rounded-xl text-center">
                <p className="font-bold text-red-400">Audio Playback Error</p>
                <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
        )}
        
        <div className="sticky top-40 md:top-24 z-30">
          <Card className="bg-slate-900/60 border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-black/50">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <SlidersHorizontal size={20} className="text-cyan-400" />
                      Master Volume
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <Slider 
                      defaultValue={[volume * 100]} 
                      max={100} 
                      step={1} 
                      onValueChange={(value) => setVolume(value[0] / 100)}
                  />
              </CardContent>
          </Card>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {soundTherapies.map(therapy => (
                <SoundCard 
                    key={therapy.soundType}
                    {...therapy}
                    isPlaying={isPlaying === therapy.soundType}
                    onPlay={() => play(therapy.soundType)}
                />
            ))}
        </div>
        
        <PhysicalTechniqueCard />

        <div className="text-center text-xs text-slate-500 p-4 bg-slate-950 rounded-lg">
            <p className="font-bold">Important:</p>
            <p>The goal is to set the therapy sound slightly quieter than your tinnitus. This helps your brain learn to ignore the tinnitus sound over time (habituation). Consistency is key.</p>
        </div>
    </div>
  );
}
