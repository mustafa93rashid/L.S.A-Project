import { z } from "zod";

// ==================== Constants ====================

export const NEWS_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export const NEWS_CATEGORIES = [
  "projects",
  "company",
  "hse",
  "events",
  "partnerships",
  "achievements",
  "training",
  "equipment",
  "other",
] as const;

// ==================== Schema ====================

export const newsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),

  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(
      500,
      "Short description must not exceed 500 characters",
    ),

  content: z
    .string()
    .trim()
    .min(1, "Content is required"),

  category: z.enum(NEWS_CATEGORIES),

  status: z.enum(NEWS_STATUSES),

  displayOrder: z
    .number({
      message: "Display order must be a number",
    })
    .int("Display order must be an integer")
    .min(
      0,
      "Display order cannot be negative",
    ),

  imageAlt: z
    .string()
    .trim()
    .max(
      200,
      "Image alt text must not exceed 200 characters",
    )
    .optional()
    .or(z.literal("")),

  image: z
    .instanceof(File)
    .optional(),
});

// ==================== Types ====================

export type NewsFormValues =
  z.infer<typeof newsSchema>;