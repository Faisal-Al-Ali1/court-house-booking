export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownProps = {
  id: string;
  name: string;
  options: readonly DropdownOption[];
  value: string;
  placeholder: string;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
};
