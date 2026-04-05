import { z } from "zod";

export const softwareLicenseAssignmentFormSchema = z
  .object({
    assignment_mode: z.enum(["user", "asset"]),
    user_id: z.string(),
    asset_id: z.string(),
    notes: z.string(),
  })
  .superRefine((values, context) => {
    if (values.assignment_mode === "user" && !values.user_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["user_id"],
        message: "Seleziona un utente.",
      });
    }

    if (values.assignment_mode === "asset" && !values.asset_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["asset_id"],
        message: "Seleziona un asset.",
      });
    }
  });

export type SoftwareLicenseAssignmentFormValues = z.infer<typeof softwareLicenseAssignmentFormSchema>;
