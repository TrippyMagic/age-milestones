import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

type FormActionsProps = ComponentPropsWithoutRef<"div">;

export function FormActions({ className, ...rest }: FormActionsProps) {
  return <div className={cx("ui-form-actions", className)} {...rest} />;
}

