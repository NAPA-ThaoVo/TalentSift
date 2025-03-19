import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cvs = pgTable("cvs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  extractedText: text("extracted_text").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertCvSchema = createInsertSchema(cvs).omit({
  id: true,
  uploadedAt: true,
});

export type InsertCv = z.infer<typeof insertCvSchema>;
export type Cv = typeof cvs.$inferSelect;

export const searchSchema = z.object({
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
});

export type SearchQuery = z.infer<typeof searchSchema>;
