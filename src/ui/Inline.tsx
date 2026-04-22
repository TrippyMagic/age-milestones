import type { ComponentPropsWithoutRef } from "react";
import type { UiGap } from "./Stack";
import { cx } from "./cx";

type InlineAlign = "start" | "center" | "end" | "stretch";
type InlineJustify = "start" | "center" | "between" | "end";

type InlineProps = ComponentPropsWithoutRef<"div"> & {
  gap?: UiGap;
  wrap?: boolean;
  align?: InlineAlign;
  justify?: InlineJustify;
};

export function Inline({
  gap = "md",
  wrap = false,
  align = "center",
  justify = "start",
  className,
  ...rest
}: InlineProps) {
  return (
    <div
      className={cx("ui-inline", className)}
      data-gap={gap}
      data-wrap={wrap ? "true" : "false"}
      data-align={align}
      data-justify={justify}
      {...rest}
    />
  );
}


