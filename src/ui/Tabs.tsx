import type { ComponentPropsWithoutRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "./cx";

type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export function Tabs({ className, ...rest }: TabsProps) {
  return <TabsPrimitive.Root className={cx("ui-tabs", className)} {...rest} />;
}

export function TabsList({ className, ...rest }: TabsListProps) {
  return <TabsPrimitive.List className={cx("ui-tabs__list", className)} {...rest} />;
}

export function TabsTrigger({ className, ...rest }: TabsTriggerProps) {
  return <TabsPrimitive.Trigger className={cx("ui-tabs__trigger", className)} {...rest} />;
}

export function TabsContent({ className, ...rest }: TabsContentProps) {
  return <TabsPrimitive.Content className={cx("ui-tabs__content", className)} {...rest} />;
}

