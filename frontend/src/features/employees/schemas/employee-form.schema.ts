import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Inserisci un indirizzo email valido.",
  });

export const employeeFormSchema = z.object({
  employee_code: z.string().trim().min(1, "Il codice dipendente e obbligatorio."),
  full_name: z.string().trim().min(1, "Il nome completo e obbligatorio."),
  email: optionalEmailSchema,
  department_id: z.string(),
  is_active: z.boolean(),
  notes: z.string(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
