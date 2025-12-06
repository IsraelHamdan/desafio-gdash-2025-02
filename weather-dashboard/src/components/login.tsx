import { useAuthStore } from '@/hooks/useAuthStore';
import { createSchemaFieldValidators } from '@/lib/validationForm';
import { loginUserSchema } from '@/lib/validations/auth.dto';
import {revalidateLogic, useForm} from '@tanstack/react-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner';
import { Input } from './ui/input';
import { formStyle } from '@/tailwindGlobal';
import {  AxiosError } from 'axios';

export default function LoginComponent() {
  const {login} = useAuthStore()
  const getValidation = createSchemaFieldValidators(loginUserSchema);
  const navigate = useNavigate()
  const location = useLocation() 
  const from = location.state?.from?.pathname || '/'

  const form = useForm({
    defaultValues: {
      email: '', 
      password: ''
    },

    validationLogic: revalidateLogic(), 

    validators: {
      onDynamic: loginUserSchema
    },
    
    onSubmit: async ({value}) => {
      try { 
        const result = loginUserSchema.safeParse(value)

        if (!result.success) {
          toast.error("Corrija os erros nos campos");
          return result.error.issues.reduce((map, issue) => {
            const key = issue.path[0] as string;
            map[key] = issue.message;
            return map;
          }, {} as Record<string, string>);
        }
         await login(value)
        
        navigate(from, {replace: true})
      } catch(err) {
        if(err instanceof AxiosError) {
          console.error(`Error: ${err}`)
          throw new AxiosError(err.message)
        }
      }
      
    }

  

  })

  return (
    <form 
      className='flex flex-col justify-between'
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="email" validators={getValidation("email")}>
        {(field) => (
          <div className={formStyle.inputWrapper}>
            <label htmlFor={field.name} className='font-semibold'>E-mail</label>
            <Input
              id={field.name}
              type="email"
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={formStyle.inputBase}
            />
            {!field.state.meta.isValid && (
              <p style={{ color: 'red' }}>
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="password" validators={getValidation("password")}>
        {(field) => (
          <div className={formStyle.inputWrapper}>
            <label htmlFor={field.name} className='font-semibold'>Senha</label>
            <Input
              id={field.name}
              type="password"
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={formStyle.inputBase}

            />
            {!field.state.meta.isValid && (
              <p style={{ color: 'red' }}>
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}>
        {({ canSubmit, isSubmitting }) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={formStyle.submitButton}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}