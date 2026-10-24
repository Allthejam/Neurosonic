"use server";

import { getTinnitusAdvice } from "@/ai/flows/personalized-sound-recommendation";
import { z } from "zod";

const HearingExperienceSchema = z.object({
  hearingExperience: z.string().min(10, { message: "Please describe your experience in more detail." }),
});

export async function generateTinnitusAdvice(
  prevState: any,
  formData: FormData
) {
  const validatedFields = HearingExperienceSchema.safeParse({
    hearingExperience: formData.get("hearingExperience"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await getTinnitusAdvice({
      hearingExperience: validatedFields.data.hearingExperience,
    });
    return { message: "success", data: result };
  } catch (error: any) {
    console.error("AI advice error:", error);
    return { message: error.message || "An error occurred while generating advice." };
  }
}
