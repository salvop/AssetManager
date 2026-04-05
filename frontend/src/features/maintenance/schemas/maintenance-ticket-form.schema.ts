import { z } from "zod";

export const maintenanceTicketFormSchema = z.object({
  asset_id: z.string().trim().min(1, "Seleziona un asset."),
  vendor_id: z.string(),
  title: z.string().trim().min(1, "Il titolo e obbligatorio."),
  description: z.string(),
});

export type MaintenanceTicketFormValues = z.infer<typeof maintenanceTicketFormSchema>;
