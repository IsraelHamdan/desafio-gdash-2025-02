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
  isActive: z.boolean().optional(),
}).omit({role: true})

export type UpdateUserDto = z.infer<typeof updateUserSchema>

export const userResponse =createUserSchema.extend({
  id: z.string(),
  isActive: z.boolean().default(true),
}).omit({ password: true }) 

export type UserResponse = z.infer<typeof userResponse>

export const profileFormSchema = z.object({
  name: z.string().min(2, {message: "Nome muito curto, deve ter no mínimo 2 caracteres"}),
  email: z.email().refine((val) => emailRegex.test(val)),
  password: z.union([
    z.literal(''), 
    z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres!" }),
  ]),
  phone: z.string().refine((val) => phoneRegex.test(val)).min(8, {message: "Telefone muito curto, use o formato indicado"}),
  isActive: z.boolean(),
  confirmPassword: z.union([
    z.literal(''),
    z.string().min(6, {message: "A senha deve ter no mínimo 6 caracteres!"}),
  ]) 
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (!password && !confirmPassword) return;

    if (!password || !confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Preencha a senha e a confirmação para alterar a senha",
      });
      return;
    }


    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ['confirmPassword'],
        message: 'As senhas não conferem',
      })
    }
  })

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export type UpdateUserClientDto = Partial<ProfileFormValues>;