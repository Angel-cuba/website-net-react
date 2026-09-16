import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export type SelectFieldOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  disabled?: boolean;
  id: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  value: string;
};

export function SelectField({
  disabled = false,
  id,
  onValueChange,
  options,
  value,
}: SelectFieldProps) {
  return (
    <Select.Root
      disabled={disabled}
      onValueChange={onValueChange}
      value={value}
    >
      <Select.Trigger className="select-field__trigger" id={id}>
        <Select.Value />
        <Select.Icon className="select-field__icon">
          <ChevronDown aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="select-field__content"
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className="select-field__viewport">
            {options.map((option) => (
              <Select.Item
                className="select-field__item"
                key={option.value}
                value={option.value}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="select-field__indicator">
                  <Check aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
