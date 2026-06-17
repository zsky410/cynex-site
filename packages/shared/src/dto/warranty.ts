import { z } from "zod";
import { WarrantyReason } from "../enums";

export const CreateWarrantyCaseSchema = z.object({
  orderId: z.string().min(1),
  orderItemId: z.string().min(1),
  reason: z.nativeEnum(WarrantyReason),
  message: z.string().min(1).max(4000),
  attachmentFileIds: z.array(z.string()).max(10).optional(),
});
export type CreateWarrantyCaseDto = z.infer<typeof CreateWarrantyCaseSchema>;

export const CreateWarrantyMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  attachmentFileIds: z.array(z.string()).max(10).optional(),
});
export type CreateWarrantyMessageDto = z.infer<typeof CreateWarrantyMessageSchema>;
