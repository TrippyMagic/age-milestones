import { useEffect, type RefObject } from "react";

export const useOutsideClick = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (evt: MouseEvent | TouchEvent) => {
      const node = ref.current;
      if (!node) return;
      const target = evt.target as Node | null;
      if (target && node.contains(target)) return;
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, ref]);
};
