import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Stack } from "./Stack";
import { cx } from "./cx";

type PanelProps = ComponentPropsWithoutRef<"section"> & {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

export function Panel({
  title,
  description,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <section className={cx("ui-panel", className)} {...rest}>
      {(title || description) && (
        <Stack gap="xs" className="ui-panel__header">
          {title && <h2 className="ui-panel__title">{title}</h2>}
          {description && <p className="ui-panel__description">{description}</p>}
        </Stack>
      )}
      {children}
    </section>
  );
}


