import { z } from "zod";

export const maintenanceTicketDetailFormSchema = z.object({
  title: z.string().trim().min(1, "Il titolo e obbligatorio."),
  description: z.string(),
  vendor_id: z.string(),
});

export type MaintenanceTicketDetailFormValues = z.infer<typeof maintenanceTicketDetailFormSchema>;
