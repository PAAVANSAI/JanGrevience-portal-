import { z } from "zod";

export const stepIdentitySchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your full name")
    .max(100, "Name is too long"),
  gender: z.enum(["Male", "Female", "Transgender"], {
    errorMap: () => ({ message: "Please select your gender" }),
  }),
});

export const stepAddressContactSchema = z.object({
  addressLine: z.string().min(5, "Address must be at least 5 characters").max(200, "Address is too long"),
  subLocality: z.string().max(100).optional(),
  country: z.string(),
  stateId: z.string().uuid("Please select a state"),
  districtId: z.string().uuid("Please select a district"),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  landlinePhone: z.string().max(15).optional().or(z.literal("")),
  captchaToken: z.string().min(1, "Please complete the security check"),
});

export const onboardingSchema = z.object({
  ...stepIdentitySchema.shape,
  ...stepAddressContactSchema.shape,
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Profile schema is similar but without captcha
export const profileSchema = onboardingSchema.omit({ captchaToken: true });

export type ProfileFormData = z.infer<typeof profileSchema>;
