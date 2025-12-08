import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { BgRemovalJobs, db, eq, and } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createJob: defineAction({
    input: z.object({
      inputImageUrl: z.string().min(1),
      mode: z.string().optional(),
      strength: z.string().optional(),
      keepShadows: z.boolean().optional(),
      addBackgroundColor: z.string().optional(),
      settingsJson: z.string().optional(),
      status: z.string().optional(),
      errorMessage: z.string().optional(),
      outputImageUrl: z.string().optional(),
      outputPreviewUrl: z.string().optional(),
      completedAt: z.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [job] = await db
        .insert(BgRemovalJobs)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          inputImageUrl: input.inputImageUrl,
          outputImageUrl: input.outputImageUrl,
          outputPreviewUrl: input.outputPreviewUrl,
          mode: input.mode,
          strength: input.strength,
          keepShadows: input.keepShadows ?? false,
          addBackgroundColor: input.addBackgroundColor,
          settingsJson: input.settingsJson,
          status: input.status ?? "queued",
          errorMessage: input.errorMessage,
          createdAt: now,
          completedAt: input.completedAt,
        })
        .returning();

      return { success: true, data: { job } };
    },
  }),

  updateJob: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        status: z.string().optional(),
        outputImageUrl: z.string().optional(),
        outputPreviewUrl: z.string().optional(),
        errorMessage: z.string().optional(),
        addBackgroundColor: z.string().optional(),
        strength: z.string().optional(),
        keepShadows: z.boolean().optional(),
        settingsJson: z.string().optional(),
        completedAt: z.date().optional(),
      })
      .refine(
        (input) =>
          input.status !== undefined ||
          input.outputImageUrl !== undefined ||
          input.outputPreviewUrl !== undefined ||
          input.errorMessage !== undefined ||
          input.addBackgroundColor !== undefined ||
          input.strength !== undefined ||
          input.keepShadows !== undefined ||
          input.settingsJson !== undefined ||
          input.completedAt !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [existing] = await db
        .select()
        .from(BgRemovalJobs)
        .where(and(eq(BgRemovalJobs.id, input.id), eq(BgRemovalJobs.userId, user.id)));

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Background removal job not found.",
        });
      }

      const [job] = await db
        .update(BgRemovalJobs)
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.outputImageUrl !== undefined ? { outputImageUrl: input.outputImageUrl } : {}),
          ...(input.outputPreviewUrl !== undefined
            ? { outputPreviewUrl: input.outputPreviewUrl }
            : {}),
          ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
          ...(input.addBackgroundColor !== undefined
            ? { addBackgroundColor: input.addBackgroundColor }
            : {}),
          ...(input.strength !== undefined ? { strength: input.strength } : {}),
          ...(input.keepShadows !== undefined ? { keepShadows: input.keepShadows } : {}),
          ...(input.settingsJson !== undefined ? { settingsJson: input.settingsJson } : {}),
          ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        })
        .where(eq(BgRemovalJobs.id, input.id))
        .returning();

      return { success: true, data: { job } };
    },
  }),

  listJobs: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const jobs = await db
        .select()
        .from(BgRemovalJobs)
        .where(eq(BgRemovalJobs.userId, user.id));

      return { success: true, data: { items: jobs, total: jobs.length } };
    },
  }),
};
