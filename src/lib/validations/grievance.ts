import { z } from "zod";

export const stepBasicInfoSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100, "Subject is too long"),
  description: z.string().min(20, "Please provide more detail (at least 20 characters)").max(2000, "Description is too long"),
});

export const stepClassificationSchema = z.object({
  departmentId: z.string().uuid("Please select a valid department"),
  categoryId: z.string().uuid("Please select a valid category"),
  state: z.string().min(2, "Please enter a valid state"),
  district: z.string().min(2, "Please enter a valid district"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const stepDocumentsSchema = z.object({
  attachments: z.array(
    z.object({
      fileName: z.string(),
      filePath: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    })
  ).max(5, "You can upload up to 5 files max"),
});

// Full schema for the final submission
export const grievanceFormSchema = z.object({
  ...stepBasicInfoSchema.shape,
  ...stepClassificationSchema.shape,
  ...stepDocumentsSchema.shape,
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  aiClassificationId: z.string().uuid().optional(),
});

export type GrievanceFormData = z.infer<typeof grievanceFormSchema>;
