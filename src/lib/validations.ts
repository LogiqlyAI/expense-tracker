import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const EXPENSE_CATEGORIES = [
  "GROCERIES",
  "DINING",
  "TRANSPORTATION",
  "ENTERTAINMENT",
  "UTILITIES",
  "HEALTHCARE",
  "SHOPPING",
  "TRAVEL",
  "OTHER",
] as const;

export const expenseSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  amount: z.number().positive("Amount must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  currency: z.string().min(1).default("SGD"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
