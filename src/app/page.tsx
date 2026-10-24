'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  collection,
  query,
  Timestamp,
  doc,
  orderBy,
} from 'firebase/firestore';

import {
  useUser,
  useFirestore,
  useAuth,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import type { SoundProfile, WaveformType } from '@/types';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { useToast } from '@/hooks/use-toast';

import AppHeader from '@/components/app-header';
import AppFooter from '@/components/app-footer';
import HelpModal from '@/components/help-modal';
import Console from '@/components/console';
import DataArchives from '@/components/data-archives';
import AiRecommender from '@/components/ai-recommender';
import AuthModal from '@/components/auth-modal';
import SoundTherapy from '@/components/sound-therapy';
import HeadsetMode from '@/components/headset-mode';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [activeTab, setActiveTab] = useState('simulator');
  const [isLogging, setIsLogging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAwaitingSave, setIsAwaitingSave] = useState(false);

  // Audio State
  const [isLinked, setIsLinked] = useState(false);
  const [waveType, setWaveType] = useState<WaveformType>('sine');
  const [leftFreq, setLeftFreq] = useState(4000);
  const [rightFreq, setRightFreq] = useState(4000);
  const [leftVol, setLeftVol] = useState(0);
  const [rightVol, setRightVol] = useState(0);
  const [leftPhaseInverted, setLeftPhaseInverted] = useState(false);
  const [rightPhaseInverted, setRightPhaseInverted] = useState(false);

  const { toast } = useToast();

  const { isPlaying, togglePlayback, initialiseAudio } = useAudioEngine({
    leftFreq,
    rightFreq,
    leftVol,
    rightVol,
    waveType,
    leftPhaseInverted,
    rightPhaseInverted,
  });

  const soundProfilesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'soundProfiles'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: profiles, error: profilesError } = useCollection<SoundProfile>(soundProfilesQuery);

   // Data Synchronization Error handling
  useEffect(() => {
    if (profilesError) {
      console.error('Firestore Error:', profilesError);
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not load saved profiles.',
      });
    }
  }, [profilesError, toast]);
  
  const sortedProfiles = useMemo(() => {
    if (!profiles) return [];
    // The query now sorts the profiles, so we can just use them directly.
    return profiles;
  }, [profiles]);


  const handleFreqChange = useCallback((side: 'left' | 'right', val: number) => {
    if (isLinked) {
      setLeftFreq(val);
      setRightFreq(val);
    } else {
      side === 'left' ? setLeftFreq(val) : setRightFreq(val);
    }
  }, [isLinked]);

  const handleVolChange = useCallback((side: 'left' | 'right', val: number) => {
    if (isLinked) {
      setLeftVol(val);
      setRightVol(val);
    } else {
      side === 'left' ? setLeftVol(val) : setRightVol(val);
    }
  }, [isLinked]);

  const logProfile = useCallback(async () => {
    if (!user) return;
    if(!firestore) return;

    setIsLogging(true);
    const newProfile: Omit<SoundProfile, 'id'> = {
      leftFreq,
      rightFreq,
      leftVol,
      rightVol,
      waveType,
      leftPhaseInverted,
      rightPhaseInverted,
      timestamp: Timestamp.now(),
      label: `SIM_${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
    
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'soundProfiles'), newProfile)
      .then(() => {
        toast({
          title: 'Telemetry Logged',
          description: 'Your current sound settings have been archived.',
        });
        setActiveTab('history');
      })
      .catch((e) => {
         console.error('Log failed', e);
         toast({
           variant: 'destructive',
           title: 'Log Failed',
           description: 'Could not save the profile to the database.',
         });
      })
      .finally(() => {
        setIsLogging(false);
      });
  }, [user, firestore, leftFreq, rightFreq, leftVol, rightVol, waveType, leftPhaseInverted, rightPhaseInverted, toast]);

  const deleteProfile = useCallback(async (profileId: string) => {
    if (!firestore || !user) return;
    
    const docRef = doc(firestore, 'users', user.uid, 'soundProfiles', profileId);
    
    deleteDocumentNonBlocking(docRef);

    toast({
      title: 'Profile Deleted',
      description: 'The sound profile has been removed from your archives.',
    });
  }, [firestore, user, toast]);

  useEffect(() => {
    if (isAwaitingSave && user && !user.isAnonymous) {
      logProfile();
      setIsAwaitingSave(false);
    }
  }, [isAwaitingSave, user, logProfile]);

  const handleLogRequest = () => {
    if (user && !user.isAnonymous) {
      logProfile();
    } else {
      setIsAwaitingSave(true);
      setShowAuthModal(true);
    }
  };

  const onAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleSaveHeadsetProfile = useCallback(
    (profileData: {
      leftFreq: number;
      rightFreq: number;
      leftVol: number;
      rightVol: number;
      waveType: WaveformType;
      label: string;
      audiogramData?: any;
    }) => {
      if (!firestore || !user || user.isAnonymous) {
        toast({
          title: 'Sign In Required',
          description: 'Please sign in to save and archive your headset audiogram.',
        });
        setShowAuthModal(true);
        return;
      }

      const newProfile: SoundProfile = {
        leftFreq: profileData.leftFreq,
        rightFreq: profileData.rightFreq,
        leftVol: profileData.leftVol,
        rightVol: profileData.rightVol,
        waveType: profileData.waveType,
        leftPhaseInverted,
        rightPhaseInverted,
        timestamp: Timestamp.now(),
        label: profileData.label,
        audiogramData: profileData.audiogramData,
      };

      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'soundProfiles'), newProfile)
        .then(() => {
          toast({
            title: 'Audiogram Saved',
            description: 'Your headset calibration has been saved to your archives.',
          });
          setActiveTab('history');
        })
        .catch((e) => {
          console.error('Save failed', e);
          toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the profile to the database.',
          });
        });
    },
    [firestore, user, leftPhaseInverted, rightPhaseInverted, toast]
  );

  const loadProfile = (p: SoundProfile) => {
    setLeftFreq(p.leftFreq);
    setRightFreq(p.rightFreq);
    setLeftVol(p.leftVol);
    setRightVol(p.rightVol);
    setWaveType(p.waveType || 'sine');
    setLeftPhaseInverted(p.leftPhaseInverted || false);
    setRightPhaseInverted(p.rightPhaseInverted || false);
    setActiveTab('simulator');
    toast({
      title: 'Profile Loaded',
      description: `Loaded settings from ${p.label}.`,
    });
  };

  const loadAndPlayInverted = (p: SoundProfile) => {
    // Set all the values from the profile
    setLeftFreq(p.leftFreq);
    setRightFreq(p.rightFreq);
    setLeftVol(p.leftVol);
    setRightVol(p.rightVol);
    setWaveType(p.waveType || 'sine');
    
    // Invert the phase regardless of what's in the profile
    setLeftPhaseInverted(true);
    setRightPhaseInverted(true);
    
    // Switch to the simulator tab
    setActiveTab('simulator');

    // Start playback if it's not already running
    if (!isPlaying) {
      initialiseAudio();
      togglePlayback();
    }
    
    toast({
      title: 'Playing Inverted Profile',
      description: `Phase inverted playback started for ${p.label}.`,
    });
  };

  const handlePlayInverted = () => {
    // Set phase state to inverted
    setLeftPhaseInverted(true);
    setRightPhaseInverted(true);

    // Ensure audio is initialized and playing
    initialiseAudio();
    if (!isPlaying) {
      togglePlayback();
    }

    toast({
      title: 'Playing Inverted Sound',
      description: 'Phase inverted playback has started.',
    });
  };

  const tinnitusFreq = useMemo(() => {
    return isLinked ? leftFreq : (leftFreq + rightFreq) / 2;
  }, [isLinked, leftFreq, rightFreq]);

  return (
    <div className="flex flex-col min-h-screen">
      <AuthModal show={showAuthModal} setShow={setShowAuthModal} onAuthSuccess={onAuthSuccess} />
      <HelpModal showHelp={showHelp} setShowHelp={setShowHelp} />

      <AppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowHelp={setShowHelp}
        user={user}
        isUserLoading={isUserLoading}
        onLoginClick={() => setShowAuthModal(true)}
      />

      <main className="relative max-w-6xl mx-auto p-4 sm:p-6 lg:p-12 z-10 space-y-8 sm:space-y-12 flex-grow w-full">
        {activeTab === 'simulator' && (
          <>
            <Console
              isLinked={isLinked}
              setIsLinked={setIsLinked}
              waveType={waveType}
              setWaveType={setWaveType}
              isPlaying={isPlaying}
              togglePlayback={togglePlayback}
              initialiseAudio={initialiseAudio}
              leftFreq={leftFreq}
              rightFreq={rightFreq}
              leftVol={leftVol}
              rightVol={rightVol}
              handleFreqChange={handleFreqChange}
              handleVolChange={handleVolChange}
              onLogRequest={handleLogRequest}
              isLogging={isLogging}
              leftPhaseInverted={leftPhaseInverted}
              setLeftPhaseInverted={setLeftPhaseInverted}
              rightPhaseInverted={rightPhaseInverted}
              setRightPhaseInverted={setRightPhaseInverted}
              onPlayInverted={handlePlayInverted}
            />
            <AiRecommender />
          </>
        )}
        {activeTab === 'headset' && (
          <HeadsetMode
            leftFreq={leftFreq}
            rightFreq={rightFreq}
            leftVol={leftVol}
            rightVol={rightVol}
            waveType={waveType}
            setLeftFreq={setLeftFreq}
            setRightFreq={setRightFreq}
            setLeftVol={setLeftVol}
            setRightVol={setRightVol}
            setWaveType={setWaveType}
            setIsLinked={setIsLinked}
            onSaveToArchive={handleSaveHeadsetProfile}
            onSwitchToConsole={() => setActiveTab('simulator')}
          />
        )}
        {activeTab === 'history' && (
          <DataArchives 
            profiles={sortedProfiles} 
            loadProfile={loadProfile} 
            deleteProfile={deleteProfile}
            playInvertedProfile={loadAndPlayInverted}
          />
        )}
        {activeTab === 'play' && <SoundTherapy tinnitusFreq={tinnitusFreq} />}
      </main>

      <AppFooter user={user} />
    </div>
  );
}
