import Tipography from "@/components/Tipography";
import { AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUser from "@/hooks/useUser";
import { createSchemaFieldValidators } from "@/lib/validationForm";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validations/auth.dto";
import { formStyle } from "@/tailwindGlobal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { AxiosError } from "axios";
import { Trash2 } from "lucide-react";
import { Activity } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ProfilePage() {
  const getValidation = createSchemaFieldValidators(profileFormSchema);
  const navigate = useNavigate();
  const { user, update, deleteAccount, isDeleting } = useUser();

  const form = useForm({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      isActive: user.isActive ?? true,
    } satisfies ProfileFormValues,

    validationLogic: revalidateLogic(),

    validators: {
      onDynamicAsync: profileFormSchema
    },

    onSubmit: async ({ value }) => {
      try {
        await update(value);
        toast.success('Dados atualizados com sucesso!');
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error(err);
          switch (err.status) {
            case 400: {
              toast.error(`Campos obrigatórios vazios`);
            }
          }
        }
      }

    }

  });

  const handleDeleteUser = async () => {
    try {
      if (!user?.id) {
        toast.error('Usuário não encontrado na sessão');
        return;
      }
      await deleteAccount(user.id);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      toast.info('Seu perfil foi desativado');
    }
  };


  return (
    <>
      <Activity mode={user.name ? "visible" : "hidden"}>
        <Tipography variant="h2">Olá {user?.name}</Tipography>
      </Activity>
      <div className="w-full flex justify-center">

        <form
          className='w-full max-w-xl space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}>

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
                    value={field.state.value ?? ''}
                    className={formStyle.inputBase}
                  />
                  {!field.state.meta.isValid && (
                    <p className={formStyle.errorMessage}>
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
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={formStyle.inputBase}
                  />
                  {!field.state.meta.isValid && (
                    <p className={formStyle.errorMessage}>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* <form.Field name="password" validators={getValidation("password")}>
            {(field) => (
              <div className={formStyle.inputWrapper}>
                <label htmlFor={field.name} className='font-semibold'>Senha</label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={formStyle.inputBase}

                />
                {!field.state.meta.isValid && (
                  <p className={formStyle.errorMessage}>
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="confirmPassword" validators={getValidation("confirmPassword")}>
            {(field) => (
              <div className={formStyle.inputWrapper}>
                <label htmlFor={field.name} className='font-semibold'>Confirme a nova senha</label>
                <Input
                  id={field.name}
                  type="password"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={formStyle.inputBase}
                  value={field.state.value ?? ''}

                />
                {!field.state.meta.isValid && (
                  <p className={formStyle.errorMessage}>
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field> */}

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
                    value={field.state.value ?? ''}
                  />
                  {!field.state.meta.isValid && (
                    <p className={formStyle.errorMessage}>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
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
                  {isSubmitting ? "Atualizando..." : "Atualizar"}
                </button>
              )}
            </form.Subscribe>
            <AlertDialog>
              <AlertDialogTrigger asChild >
                <Button variant={"destructive"} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
                  Deletar perfil
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={formStyle.alertContent}>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <Tipography variant="h2">Tem certeza que quer deletar seu perfil?</Tipography>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-semibold text-red-500">
                    Essa ação poderá ser desfeita somente entrando em contato com o suporte
                    e solicitando a reativação da sua conta! Ou se quiser deletar permanentemente
                    Entre em contato com o suporte, mas fique tranquilo, enquanto você estiver desativado,
                    ninguém poderá acessar sua conta
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>
                    <Button
                      variant={"destructive"}
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deletando...' : 'Deletar perfil'}
                      <Trash2 size={18} />
                    </Button>
                  </AlertDialogAction>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </form>
      </div>

    </>

  );

}