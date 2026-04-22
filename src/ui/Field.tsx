import type { ReactNode } from "react";
import { Stack } from "./Stack";
import { cx } from "./cx";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, hint, htmlFor, className, children }: FieldProps) {
  return (
    <label className={cx("ui-field", className)} htmlFor={htmlFor}>
      <Stack gap="xs" className="ui-field__copy">
        <span className="ui-field__label">{label}</span>
        {hint && <span className="ui-field__hint">{hint}</span>}
      </Stack>
      {children}
    </label>
  );
}

