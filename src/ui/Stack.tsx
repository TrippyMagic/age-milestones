import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

export type UiGap = "xs" | "sm" | "md" | "lg" | "xl";

type StackProps = ComponentPropsWithoutRef<"div"> & {
  gap?: UiGap;
};

export function Stack({ gap = "md", className, ...rest }: StackProps) {
  return <div className={cx("ui-stack", className)} data-gap={gap} {...rest} />;
}


