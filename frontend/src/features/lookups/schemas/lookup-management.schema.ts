import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);

const optionalText = z.string().trim().optional().or(z.literal(""));

const optionalEmail = z
  .union([z.literal(""), z.string().trim().email("Inserisci un indirizzo email valido")])
  .optional()
  .default("");

export const departmentFormSchema = z.object({
  code: requiredText("Il codice e obbligatorio"),
  name: requiredText("Il nome e obbligatorio"),
});

export const locationFormSchema = z.object({
  code: requiredText("Il codice e obbligatorio"),
  name: requiredText("Il nome e obbligatorio"),
  parent_id: optionalText,
});

export const categoryFormSchema = z.object({
  code: requiredText("Il codice e obbligatorio"),
  name: requiredText("Il nome e obbligatorio"),
  parent_id: optionalText,
});

export const vendorFormSchema = z.object({
  name: requiredText("Il nome del fornitore e obbligatorio"),
  contact_email: optionalEmail,
  contact_phone: optionalText,
});

export const modelFormSchema = z.object({
  category_id: requiredText("La categoria e obbligatoria"),
  vendor_id: optionalText,
  name: requiredText("Il nome del modello e obbligatorio"),
  manufacturer: optionalText,
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
export type LocationFormValues = z.infer<typeof locationFormSchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type VendorFormValues = z.infer<typeof vendorFormSchema>;
export type ModelFormValues = z.infer<typeof modelFormSchema>;
