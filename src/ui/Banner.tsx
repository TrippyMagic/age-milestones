import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "./Stack";
import { cx } from "./cx";

type BannerTone = "danger" | "warning" | "neutral";

type BannerProps = HTMLAttributes<HTMLElement> & {
  tone?: BannerTone;
  title: ReactNode;
  children: ReactNode;
};

export function Banner({
  tone = "neutral",
  title,
  children,
  className,
  ...rest
}: BannerProps) {
  return (
    <section className={cx("ui-banner", `ui-banner--${tone}`, className)} {...rest}>
      <Stack gap="xs">
        <h2 className="ui-banner__title">{title}</h2>
        <div className="ui-banner__body">{children}</div>
      </Stack>
    </section>
  );
}

