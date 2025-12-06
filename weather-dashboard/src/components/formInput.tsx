import {
  formatPhoneInput,
  formatDateOnly, 
  cepMask,
  unmaskCep
} from "@/lib/utils";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "./ui/input";
import { formStyle } from "@/tailwindGlobal";


type InputType =
  | "text"
  | "date"
  | "phone"
  | "number"
  | "cpf"
  | "email"
  | "price"
  | "password"
  | "cep"
  | string;

interface props {
  field: AnyFieldApi;
  showErrorMessage?: boolean;
  placeholder?: string;
  inputClassName?: string;
  errorClassName?: string;
  errorMessageClassName?: string;
  readOnly?: boolean;
  type?: InputType;
  as?: React.ComponentType<any>;
  onValueChange?: (value: string) => void;
  onBlurCustom?: (e: React.FocusEvent<HTMLInputElement>) => void; 
}

export const FormInput: React.FC<props> = ({
  field,
  placeholder,
  readOnly = false,
  type = "text",
  as: InputComponent,
  showErrorMessage = true,
  onValueChange,
  onBlurCustom,
}) => {
  const hasError = (field.state?.meta?.errors?.length ?? 0) > 0;
  const errorMessage: string = field.state?.meta?.errors?.[0] ?? "";
  const rawValue = field.state?.value ?? "";

  const displayValue =
    type === "date" && rawValue instanceof Date && !isNaN(rawValue.getTime())
      ? rawValue.toISOString().split("T")[0]
      : type === "cpf"
      ? cpfMask(rawValue)
      : type === "price"
      ? priceMask(Number(rawValue))
      : type === "cep"
      ? cepMask(rawValue)
      : rawValue;

  const handleChange = (input: any) => {
    if (readOnly) return;

    let value: any =
      input && typeof input === "object" && "target" in input
        ? input.target.value
        : input;

    // Detecta se veio de evento
    switch (type) {
      case "date": {
        const dateValue = value ? new Date(value + "T00:00:00") : new Date();
        field.handleChange(value);
        return;
      }

      case "phone": {
        value = formatPhoneInput(value);
        break;
      }



      case "cep": {
        const masked = cepMask(value);
        const raw = unmaskCep(masked);
        field.handleChange(raw);
        return;
      }

      default:
        break;
    }

    field.handleChange(value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    field.handleBlur();
    if (onBlurCustom) onBlurCustom(e);
  };
  const sharedProps = {
    value: displayValue,
    onChange: (e: any) => handleChange(e),
    onBlur: handleBlur,
    readOnly,
    placeholder,
    type: type === "price" ? "text" : type,
    "aria-invalid": hasError || undefined,
    inputMode: type === "price" ? "numeric" : undefined,
  } as const;

  function formatError(error: unknown): string {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object" && "message" in (error as any))
      return String((error as any).message);
    return JSON.stringify(error);
  }

  return (
    <div>
      {InputComponent ? (
        <InputComponent
          {...sharedProps}
          className={`${formStyle.inputWrapper} ${
            hasError ? `${formStyle.errorBorder}` : ""
          }`}
        />
      ) : (
        <Input
          {...sharedProps}
          className={`${formStyle.inputBase} ${
            hasError ? `${formStyle.errorBorder}` : ""
          }`}
        />
      )}
      {showErrorMessage && hasError && (
        <p className={`${formStyle.errorMessage}`} role="alert">
          {formatError(errorMessage)}
        </p>
      )}
    </div>
  );
};
