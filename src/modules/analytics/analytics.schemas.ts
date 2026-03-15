import { z } from "zod";

export const analyticsSnapshotCreateSchema = z.object({
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "snapshotDate must be in YYYY-MM-DD format").optional()
});
