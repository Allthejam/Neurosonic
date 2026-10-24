'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Apple, 
  Download, 
  Zap, 
  ShieldCheck, 
  WifiOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <header className="border-b border-white/5 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              <ArrowLeft size={16} className="mr-2" /> Back to Console
            </Button>
          </Link>
          <h1 className="text-xl font-black italic tracking-widest text-white uppercase">
            INSTALL<span className="text-cyan-400">_GUIDE</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 sm:p-12 space-y-12 flex-grow w-full">
        {/* Why PWA Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-4">
            <Zap size={32} />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white font-headline">
            THE POWER OF THE WEB_APP
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            NeuroSonic uses PWA (Progressive Web App) technology to provide a high-performance, installable experience without the need for traditional app stores.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md">
            <CardHeader>
              <WifiOff className="text-cyan-400 mb-2" />
              <CardTitle className="text-white">Offline Ready</CardTitle>
              <CardDescription>Access your profiles and basic tools even without an active internet connection.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md">
            <CardHeader>
              <Zap className="text-indigo-400 mb-2" />
              <CardTitle className="text-white">Blazing Fast</CardTitle>
              <CardDescription>Instant loading and smoother animations compared to traditional websites.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md">
            <CardHeader>
              <ShieldCheck className="text-cyan-400 mb-2" />
              <CardTitle className="text-white">Secure</CardTitle>
              <CardDescription>Full data encryption and secure Firebase authentication on all devices.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Installation Instructions */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black italic tracking-widest text-white uppercase border-l-4 border-cyan-500 pl-4">
            HOW TO INSTALL
          </h2>

          <div className="grid gap-6">
            {/* iOS */}
            <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
              <div className="bg-indigo-500/10 p-4 border-b border-white/5 flex items-center gap-3">
                <Apple className="text-indigo-400" />
                <h3 className="font-bold text-white uppercase tracking-widest">Apple iOS (iPhone/iPad)</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-slate-400">1. Open <strong>NeuroSonic</strong> in Safari.</p>
                <p className="text-slate-400">2. Tap the <strong>Share</strong> button (the square with an arrow up) at the bottom.</p>
                <p className="text-slate-400">3. Scroll down and tap <strong>'Add to Home Screen'</strong>.</p>
                <p className="text-slate-400">4. Tap <strong>'Add'</strong> in the top right corner.</p>
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
              <div className="bg-cyan-500/10 p-4 border-b border-white/5 flex items-center gap-3">
                <Smartphone className="text-cyan-400" />
                <h3 className="font-bold text-white uppercase tracking-widest">Android (Chrome)</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-slate-400">1. Open <strong>Chrome</strong> and navigate to NeuroSonic.</p>
                <p className="text-slate-400">2. Tap the <strong>Three Dots</strong> (menu) in the top right corner.</p>
                <p className="text-slate-400">3. Select <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>.</p>
                <p className="text-slate-400">4. Confirm the installation.</p>
              </CardContent>
            </Card>

            {/* PC/Desktop */}
            <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
              <div className="bg-slate-800 p-4 border-b border-white/5 flex items-center gap-3">
                <Monitor className="text-slate-400" />
                <h3 className="font-bold text-white uppercase tracking-widest">PC & Mac (Chrome/Edge)</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-slate-400">1. Look at the right side of your <strong>Address Bar</strong>.</p>
                <p className="text-slate-400">2. Click the <strong>Install</strong> icon (looks like a computer with an arrow or a plus sign).</p>
                <p className="text-slate-400">3. Click <strong>'Install'</strong> in the popup window.</p>
                <p className="text-slate-400">4. NeuroSonic will now open in its own dedicated window.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/20 p-8 text-center space-y-4">
          <Download className="mx-auto text-indigo-400" size={48} />
          <h3 className="text-xl font-black text-white uppercase">Experience the Future</h3>
          <p className="text-slate-400 max-w-lg mx-auto italic">
            "By installing NeuroSonic, you ensure that your therapeutic sounds are always just one tap away, with the best possible audio performance your hardware can provide."
          </p>
        </section>
      </main>

      <footer className="p-8 text-center border-t border-white/5 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
        NeuroSonic Systems // All devices supported
      </footer>
    </div>
  );
}