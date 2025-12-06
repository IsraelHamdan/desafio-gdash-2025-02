import { z } from "zod";

export const createFieldValidators = <T extends z.ZodTypeAny>(
  fieldSchema: T,
  transform?: (value: any) => any
) => ({
  onDynamic: ({ value }: { value: any }) => {
    const transformedValue = transform ? transform(value) : value;
    const result = fieldSchema.safeParse(transformedValue);
    return result.success ? undefined : result.error.issues[0]?.message;
  },
});

export const createSchemaFieldValidators = <T extends z.ZodObject<any>>(
  schema: T,
  transforms?: Partial<Record<keyof T["shape"], (value: any) => any>>
) => {
  return (fieldName: keyof T["shape"]) => {
    const fieldSchema = schema.shape[fieldName];
    const transform = transforms?.[fieldName];
    return createFieldValidators(fieldSchema, transform);
  };
};