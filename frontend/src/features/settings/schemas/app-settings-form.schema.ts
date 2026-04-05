import { z } from "zod";

export const appSettingsFormSchema = z.object({
  org_name: z.string().trim().min(1, "Il nome organizzazione e obbligatorio."),
  default_asset_status_on_create_id: z.string().trim().min(1, "Seleziona uno stato predefinito."),
  max_document_size_mb: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100, {
      message: "Inserisci un valore compreso tra 1 e 100.",
    }),
  allowed_document_mime_types: z.string().trim().min(1, "Specifica almeno un MIME type."),
});

export type AppSettingsFormValues = z.infer<typeof appSettingsFormSchema>;
