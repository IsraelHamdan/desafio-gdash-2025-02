import { Card } from "@/components/ui/card";
import useWeather from "@/hooks/useWeather";
import { createSchemaFieldValidators } from "@/lib/validationForm";
import { locationSchema, type LocationDTO } from "@/lib/validations/location";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { toast } from "sonner";

export default function DashboardPage() {
  const { getData, data } = useWeather();

  const getValidation = createSchemaFieldValidators(locationSchema);

  const form = useForm({
    defaultValues: {
      city: '',
      state: '',
      countryCode: ''
    } satisfies LocationDTO,

    validationLogic: revalidateLogic(),

    validators: {
      onDynamic: locationSchema
    },

    onSubmit: async ({ value }) => {
      try {
        await getData(value);

      } catch (err) {
        //TODO: Aqui eu avisar ao usuário que tivemos um erro, mas de maneira amigável
        toast.error(`Erro ao buscar dados climáticos`);
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={form.handleSubmit} className="space-y-4">

        </form>
      </Card>
    </div>
  );
};