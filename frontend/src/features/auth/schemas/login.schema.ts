import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Lo username e obbligatorio"),
  password: z.string().min(1, "La password e obbligatoria"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
