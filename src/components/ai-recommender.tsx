"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles, HelpingHand, Stethoscope, Smartphone, Group } from "lucide-react";

import { generateTinnitusAdvice, type AdviceState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TinnitusAdviceOutput } from "@/ai/flows/personalized-sound-recommendation";

const initialState: AdviceState = {
  message: "",
  data: undefined,
  errors: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Analysing..." : "Get Advice"}
    </Button>
  );
}

const AdviceSection = ({ title, text, icon }: { title: string, text: string, icon: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-slate-400 mt-1">{text}</p>
        </div>
    </div>
);

export default function AiRecommender() {
  const [state, formAction] = useActionState(
    generateTinnitusAdvice,
    initialState
  );
  const { toast } = useToast();

  useEffect(() => {
    // Only show toast on error. Success will be displayed in the component itself.
    if (state.message !== "" && state.message !== "success") {
       toast({
        variant: "destructive",
        title: "AI Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <Card className="bg-slate-900/40 border-white/5 rounded-3xl backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-cyan-400" />
          <span>AI Assistant</span>
        </CardTitle>
        <CardDescription>
          Describe your tinnitus experience to receive general advice and learn about potential next steps.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <Textarea
            name="hearingExperience"
            placeholder="e.g., 'I hear a high-pitched ringing mostly in my left ear, especially in quiet rooms. It's been bothering me for a few months now and affects my sleep.'"
            className="bg-slate-950 border-slate-800"
            rows={4}
          />
          {state?.errors?.hearingExperience && (
            <p className="text-sm font-medium text-destructive mt-2">
              {state.errors.hearingExperience[0]}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
      
      {state.message === "success" && state.data && (
        <CardContent className="space-y-6 pt-6 border-t border-white/5">
            <AdviceSection title="Professional Help" text={state.data.professionalHelp} icon={<Stethoscope size={20} />} />
            <AdviceSection title="Technological Aids" text={state.data.technologicalAids} icon={<Smartphone size={20} />} />
            <AdviceSection title="Therapies & Strategies" text={state.data.therapies} icon={<HelpingHand size={20} />} />
            <AdviceSection title="Support Groups" text={state.data.supportGroups} icon={<Group size={20} />} />
            <div className="text-center text-xs text-slate-500 p-4 bg-slate-950 rounded-lg">
                <p className="font-bold">Disclaimer:</p>
                <p>I am an AI assistant, not a medical professional. This information is for educational purposes only and should not replace advice from a qualified healthcare provider.</p>
            </div>
        </CardContent>
      )}
    </Card>
  );
}
