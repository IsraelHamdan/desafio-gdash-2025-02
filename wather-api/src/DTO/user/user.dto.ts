import { emailRegex, errorMessages, phoneRegex } from 'src/schemas/regex';
import { email, z } from 'zod';

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

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional()
})

export type UpdateUserDto = z.infer<typeof updateUserSchema>

export const userResponse =createUserSchema.extend({
  id: z.string(),
  isActive: z.boolean().default(true),
}).omit({ password: true }) 

export type UserResponse = z.infer<typeof userResponse>