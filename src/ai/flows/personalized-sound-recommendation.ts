'use server';

/**
 * @fileOverview An AI agent that provides general advice and recommendations for managing tinnitus.
 *
 * - getTinnitusAdvice - A function that handles the tinnitus advice process.
 * - TinnitusAdviceInput - The input type for the getTinnitusAdvice function.
 * - TinnitusAdviceOutput - The return type for the getTinnitusAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TinnitusAdviceInputSchema = z.object({
  hearingExperience: z
    .string()
    .describe("A description of the user's hearing experience and tinnitus symptoms."),
});
export type TinnitusAdviceInput = z.infer<typeof TinnitusAdviceInputSchema>;

const TinnitusAdviceOutputSchema = z.object({
  professionalHelp: z.string().describe("Recommendation to seek help from a medical professional, like a doctor or audiologist."),
  technologicalAids: z.string().describe("Suggestions for technological aids like hearing aids, white noise machines, or apps."),
  therapies: z.string().describe("Information on therapies like CBT, TRT, or counseling."),
  supportGroups: z.string().describe("Suggestion to find and join tinnitus support groups."),
});
export type TinnitusAdviceOutput = z.infer<typeof TinnitusAdviceOutputSchema>;

export async function getTinnitusAdvice(
  input: TinnitusAdviceInput
): Promise<TinnitusAdviceOutput> {
  return tinnitusAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tinnitusAdvicePrompt',
  input: {schema: TinnitusAdviceInputSchema},
  output: {schema: TinnitusAdviceOutputSchema},
  prompt: `You are an empathetic AI assistant providing general information about tinnitus management. Your role is to offer potential next steps and resources, NOT to provide a medical diagnosis or specific treatment plan.

Based on the user's description of their hearing experience, generate a set of general recommendations broken down into the following categories: professionalHelp, technologicalAids, therapies, and supportGroups.

- professionalHelp: Strongly recommend consulting a doctor or audiologist for a proper diagnosis.
- technologicalAids: Mention things like hearing aids, sound maskers/white noise machines, and specialized mobile apps.
- therapies: Mention Cognitive Behavioral Therapy (CBT) or Tinnitus Retraining Therapy (TRT) as common approaches.
- supportGroups: Mention the value of connecting with others who have similar experiences.

User's Hearing Experience:
"{{{hearingExperience}}}"

Generate the categorized recommendations. DO NOT include any disclaimer in your output, it will be handled separately.`,
});

const tinnitusAdviceFlow = ai.defineFlow(
  {
    name: 'tinnitusAdviceFlow',
    inputSchema: TinnitusAdviceInputSchema,
    outputSchema: TinnitusAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate advice. Please try again.");
    }
    return output;
  }
);
