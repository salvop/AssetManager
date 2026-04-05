import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldBaseProps = {
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
};

type SelectFieldProps = SelectFieldBaseProps & {
  value: string;
  onValueChange: (value: string) => void;
};

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
}: SelectFieldProps) {
  const EMPTY_VALUE = "__empty__";
  const normalizedValue = value || EMPTY_VALUE;
  const showPlaceholderOption = normalizedValue === EMPTY_VALUE;

  return (
    <Select
      value={normalizedValue}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? "" : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showPlaceholderOption && <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            {...(option.disabled ? { disabled: true } : {})}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ControlledSelectFieldProps<TFieldValues extends FieldValues> = SelectFieldBaseProps & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export function ControlledSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  options,
  placeholder,
  disabled = false,
}: ControlledSelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          value={String(field.value ?? "")}
          onValueChange={field.onChange}
          options={options}
          placeholder={placeholder}
          {...(disabled ? { disabled: true } : {})}
        />
      )}
    />
  );
}

type FormSelectFieldProps<TFieldValues extends FieldValues> = SelectFieldBaseProps & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  itemClassName?: string;
  labelClassName?: string;
};

export function FormSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
  placeholder,
  disabled = false,
  itemClassName,
  labelClassName,
}: FormSelectFieldProps<TFieldValues>) {
  const EMPTY_VALUE = "__empty__";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const normalizedValue =
          field.value === null || field.value === undefined || field.value === ""
            ? EMPTY_VALUE
            : String(field.value);
        const showPlaceholderOption = normalizedValue === EMPTY_VALUE;

        return (
          <FormItem className={itemClassName}>
            <FormLabel className={labelClassName}>{label}</FormLabel>
            <Select
              value={normalizedValue}
              onValueChange={(nextValue) =>
                field.onChange(nextValue === EMPTY_VALUE ? "" : nextValue)
              }
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {showPlaceholderOption && (
                  <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>
                )}
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    {...(option.disabled ? { disabled: true } : {})}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
