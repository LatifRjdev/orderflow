"use client";

interface FilterSelectProps {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  placeholder: string;
}

export function FilterSelect({
  name,
  defaultValue,
  options,
  placeholder,
}: FilterSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue || ""}
      className="text-sm border rounded-lg px-3 py-2 bg-white"
      onChange={(e) => (e.target.form as HTMLFormElement)?.requestSubmit()}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
