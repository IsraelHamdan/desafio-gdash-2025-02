import { z } from 'zod';
import { emailRegex, errorMessages, phoneRegex } from './regex';

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type LoginUserDto = z.infer<typeof loginUserSchema>;


export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email().refine((val) => emailRegex.test(val), {message: "Formato de email incorreto"}),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).optional(),
  phone: z
    .string({ message: "Telefone é obrigatório" })
    .refine((val) => phoneRegex.test(val), {
      message: errorMessages.telefone,
    }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;


export const registerFormSchema = createUserSchema.omit({ role: true })

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional()
})

export type UpdateUserDto = z.infer<typeof updateUserSchema>

export const userResponse =createUserSchema.extend({
  id: z.string(),
  isActive: z.boolean().default(true),
}).omit({ password: true }) 

export type UserResponse = z.infer<typeof userResponse>