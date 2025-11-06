import { z } from 'zod'

export const baseRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  role: z.enum(['MOTHER', 'NURSE', 'ADMIN']),
  name: z.string().min(1),
})

export const motherProfileSchema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
})

export const nurseProfileSchema = z.object({
  age: z.coerce.number().int().min(18).max(65),
  totalExperience: z.coerce.number().int().min(0),
  kuwaitExperience: z.coerce.number().int().min(0),
  partTimeSalary: z.coerce.number().int().min(0),
  fullTimeSalary: z.coerce.number().int().min(0),
  aboutMe: z.string().optional(),
  cvUrl: z.string().optional(),
  profileImageUrl: z.string().optional(),
  languages: z.array(z.string()).optional().default([]),
  availability: z.array(z.string()).optional().default([]),
})

export const adminProfileSchema = z.object({})

export type BaseRegisterInput = z.infer<typeof baseRegisterSchema>
export type MotherRegisterProfile = z.infer<typeof motherProfileSchema>
export type NurseRegisterProfile = z.infer<typeof nurseProfileSchema>

