import { useAuthStore } from "@/hooks/useAuthStore";
import { createSchemaFieldValidators } from "@/lib/validationForm";
import { formStyle } from "@/tailwindGlobal";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { registerFormSchema } from "@/lib/validations/auth.dto";

export default function RegisterComponent() {
  const {register} = useAuthStore() 
  const getValidation = createSchemaFieldValidators(registerFormSchema);
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const form = useForm({
    defaultValues: {
      name: '',
      email: '', 
      password: '',
      phone: '',
    },

    validationLogic: revalidateLogic(), 

    validators: {
      onDynamic: registerFormSchema
    },
    
    onSubmit: async ({value}) => {
      const result = registerFormSchema.safeParse(value)

      if (!result.success) {
        toast.error("Corrija os erros nos campos");
        return result.error.issues.reduce((map, issue) => {
          const key = issue.path[0] as string;
          map[key] = issue.message;
          return map;
        }, {} as Record<string, string>);
      }
      await register(value)
      navigate(from, {replace: true})
    }
  })

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className={formStyle.formContainer} >
      <div className={formStyle.inputWrapper}>
        <form.Field name="name" validators={getValidation("name")}>
          {(field) => (
            <div>
              <label htmlFor={field.name} className={formStyle.labelBase}>Nome</label>
              <Input
                id={field.name}
                type="text"
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
      </div>

      <div className={formStyle.inputWrapper}>
        <form.Field name="email" validators={getValidation("email")}>
          {(field) => (
            <div>
              <label htmlFor={field.name} className={formStyle.labelBase}>E-mail</label>
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
      </div>

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

      <div className={formStyle.inputWrapper}>
        <form.Field name="phone" validators={getValidation("phone")}>
          {(field) => (
            <div>
              <label htmlFor={field.name} className={formStyle.labelBase}>Telefone</label>
              <Input
                id={field.name}
                type="phone"
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
      </div>
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
            {isSubmitting ? "Cadastrando..." : "Cadastrar"}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}