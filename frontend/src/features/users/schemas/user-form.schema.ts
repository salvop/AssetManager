import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Inserisci un indirizzo email valido.",
  });

export const userFormSchema = z.object({
  username: z.string().trim().min(1, "Lo username e obbligatorio."),
  full_name: z.string().trim().min(1, "Il nome completo e obbligatorio."),
  email: optionalEmailSchema,
  password: z.string(),
  department_id: z.string(),
  is_active: z.boolean(),
  role_codes: z.array(z.string()).min(1, "Seleziona almeno un ruolo."),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
