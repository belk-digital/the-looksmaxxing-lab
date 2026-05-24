// src/lib/validation/authSchemas.ts

import { z } from 'zod'

export const emailSchema = z.string().email()

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[!@#$%^&*]/, 'Must contain a special character')

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Phone must be in E.164 format')

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: emailSchema,
  password: passwordSchema,
  acceptsMarketing: z.boolean().optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })
