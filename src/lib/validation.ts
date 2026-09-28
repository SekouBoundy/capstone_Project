import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'owner', 'agency']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  university: z.string().optional(),
  faculty: z.string().optional(),
  year_of_study: z.string().optional(),
  bio: z.string().max(500).optional(),
});

export const propertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(2000).optional(),
  property_type: z.enum(['apartment', 'room', 'studio', 'house', 'dorm']),
  price_monthly: z.number().positive('Price must be positive'),
  charges: z.number().optional(),
  rooms: z.number().int().min(1),
  bathrooms: z.number().int().min(1).default(1),
  area_sqm: z.number().positive().optional(),
  furnished: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  address: z.string().optional(),
  city: z.string().optional(),
  available_from: z.string().optional(),
});

export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(2000).optional(),
  category: z.enum(['furniture', 'electronics', 'books', 'kitchen', 'clothing', 'other']),
  price: z.number().positive('Price must be positive'),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  city: z.string().optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const reportSchema = z.object({
  reason: z.enum(['fake_listing', 'scam', 'inappropriate', 'spam', 'other']),
  description: z.string().max(1000).optional(),
});

export const verificationSchema = z.object({
  role_type: z.enum(['owner', 'agency']),
  id_document_url: z.string().optional(),
  agency_name: z.string().optional(),
  business_reg_url: z.string().optional(),
  contact_person: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
