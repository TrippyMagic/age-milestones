import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "ui-button",
        `ui-button--${variant}`,
        fullWidth && "ui-button--full",
        className,
      )}
      {...rest}
    />
  );
}

