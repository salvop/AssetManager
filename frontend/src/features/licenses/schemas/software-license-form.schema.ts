import { z } from "zod";

export const softwareLicenseFormSchema = z.object({
  product_name: z.string().trim().min(1, "Il prodotto e obbligatorio."),
  license_type: z.string().trim().min(1, "Il tipo di licenza e obbligatorio."),
  vendor_id: z.string(),
  purchased_quantity: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, {
      message: "Inserisci una quantita valida maggiore di zero.",
    }),
  purchase_date: z.string(),
  expiry_date: z.string(),
  renewal_alert_days: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, {
      message: "Inserisci un numero valido di giorni.",
    }),
  notes: z.string(),
});

export type SoftwareLicenseFormValues = z.infer<typeof softwareLicenseFormSchema>;
