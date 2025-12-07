/**
 * Image Background Remover - remove backgrounds quickly.
 *
 * Design goals:
 * - Keep history of processed images.
 * - Track settings like mode/strength for future reprocessing.
 * - Store original + result references for easy download.
 */

import { defineTable, column, NOW } from "astro:db";

export const BgRemovalJobs = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    // image references
    inputImageUrl: column.text(),                          // original image
    outputImageUrl: column.text({ optional: true }),       // background-removed image
    outputPreviewUrl: column.text({ optional: true }),     // optional thumbnail

    // processing options
    mode: column.text({ optional: true }),                 // "auto", "manual-refine", etc.
    strength: column.text({ optional: true }),             // "low", "medium", "high"
    keepShadows: column.boolean({ default: false }),
    addBackgroundColor: column.text({ optional: true }),   // e.g. "#FFFFFF" if replaced
    settingsJson: column.text({ optional: true }),         // extra config

    // job status
    status: column.text({ optional: true }),               // "queued", "processing", "completed", "failed"
    errorMessage: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
    completedAt: column.date({ optional: true }),
  },
});

export const tables = {
  BgRemovalJobs,
} as const;
