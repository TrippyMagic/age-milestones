import { useCallback, useEffect, useRef, useState } from "react";

type Size = {
  width: number;
  height: number;
};

export const useElementSize = <T extends HTMLElement>(): [
  (node: T | null) => void,
  Size
] => {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const cleanup = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      cleanup();
      if (!node) return;

      const updateSize = (target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      };

      observerRef.current = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        const target = entry.target as HTMLElement;
        updateSize(target);
      });

      observerRef.current.observe(node);
      updateSize(node);
    },
    [cleanup]
  );

  useEffect(() => cleanup, [cleanup]);

  return [ref, size];
};
