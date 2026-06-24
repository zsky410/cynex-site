import { z } from "zod";
import { PaymentMethod } from "../enums";

export const CreateOrderSchema = z.object({
  productVariantId: z.string().min(1),
  quantity: z.number().int().positive().max(10).default(1),
  // Free-form per-variant input (e.g. customer account email for upgrades).
  customerInput: z.record(z.string(), z.unknown()).optional(),
});
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

export const PayWithWalletSchema = z.object({}).strict();

export const PaySchema = z.object({
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.sepay),
});
export type PayDto = z.infer<typeof PaySchema>;

export const DepositSchema = z.object({
  amount: z.number().int().positive().min(1000),
});
export type DepositDto = z.infer<typeof DepositSchema>;
