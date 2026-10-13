import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBusinessSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Business name must be at least 2 characters long')
      .max(120, 'Business name cannot exceed 120 characters'),
    categoryId: z
      .string()
      .regex(objectIdRegex, 'Invalid business category ID'),
    businessTypeId: z
      .string()
      .regex(objectIdRegex, 'Invalid business type ID')
      .optional()
      .nullable(),
    customBusinessType: z
      .string()
      .trim()
      .max(100, 'Custom business type cannot exceed 100 characters')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .min(10, 'Business description must be at least 10 characters long')
      .max(1000, 'Business description cannot exceed 1000 characters'),
    email: z
      .string()
      .trim()
      .email('Invalid business email address')
      .optional()
      .or(z.literal(''))
      .nullable(),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number is too long')
      .optional()
      .or(z.literal(''))
      .nullable(),
    address: z
      .string()
      .trim()
      .max(250, 'Address is too long')
      .optional()
      .or(z.literal(''))
      .nullable(),
    website: z
      .string()
      .trim()
      .url('Website must be a valid URL (e.g., https://example.com)')
      .optional()
      .or(z.literal(''))
      .nullable(),
    logo: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .nullable(),
    employeeCount: z
      .number()
      .int()
      .nonnegative('Employee count cannot be negative')
      .optional()
      .default(0),
    customerCount: z
      .number()
      .int()
      .nonnegative('Customer count cannot be negative')
      .optional()
      .default(0),
    mainServices: z
      .array(z.string().trim().max(100))
      .optional()
      .default([]),
    productsSold: z
      .array(z.string().trim().max(100))
      .optional()
      .default([]),
    onlineBookingRequired: z.boolean().optional().default(false),
    onlinePaymentsRequired: z.boolean().optional().default(false),
  });

export const updateBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters long')
    .max(120, 'Business name cannot exceed 120 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Business description must be at least 10 characters long')
    .max(1000, 'Business description cannot exceed 1000 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid business email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z
    .string()
    .trim()
    .max(250, 'Address is too long')
    .optional()
    .or(z.literal(''))
    .nullable(),
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL')
    .optional()
    .or(z.literal(''))
    .nullable(),
  logo: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable(),
  employeeCount: z
    .number()
    .int()
    .nonnegative('Employee count cannot be negative')
    .optional(),
  customerCount: z
    .number()
    .int()
    .nonnegative('Customer count cannot be negative')
    .optional(),
  mainServices: z.array(z.string().trim().max(100)).optional(),
  productsSold: z.array(z.string().trim().max(100)).optional(),
  onlineBookingRequired: z.boolean().optional(),
  onlinePaymentsRequired: z.boolean().optional(),
});
