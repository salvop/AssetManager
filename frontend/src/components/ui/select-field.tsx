import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldBaseProps = {
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  triggerClassName?: string;
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
  triggerClassName,
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
      <SelectTrigger
        className={cn(
          "h-10 rounded-2xl border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-brand-400",
          triggerClassName,
        )}
      >
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
  triggerClassName,
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
          {...(triggerClassName ? { triggerClassName } : {})}
        />
      )}
    />
  );
}
