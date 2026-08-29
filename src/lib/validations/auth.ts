import { z } from "zod";

// Shared password rules
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /(?=.*[a-zA-Z])(?=.*[0-9])/,
    "Password must contain at least one letter and one number"
  );

// Registration form
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Please enter your full name")
      .max(100, "Name is too long"),
    email: z
      .string()
      .min(1, "Please enter your email address")
      .email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Login form
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot password form
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password form
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
