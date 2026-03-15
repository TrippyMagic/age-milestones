import { useCallback, useEffect, useState } from "react";
import { useBirthDate } from "../context/BirthDateContext";

export function useBirthWizard() {
  const { birthDate, setBirthDate, birthTime, setBirthTime } = useBirthDate();
  const [isOpen, setIsOpen] = useState(false);

  const openWizard = useCallback(() => setIsOpen(true), []);
  const closeWizard = useCallback(() => setIsOpen(false), []);

  const completeWizard = useCallback(
    (date: Date, time: string) => {
      setBirthDate(date);
      setBirthTime(time);
      setIsOpen(false);
    },
    [setBirthDate, setBirthTime],
  );

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    // iOS scroll-lock fix (F-04):
    // Simply setting overflow:hidden on <body> causes a layout jump on iOS Safari
    // because the page scrolls to top. The fix: freeze the body in place using
    // position:fixed + negative top equal to the current scrollY, then restore on close.
    const scrollY = window.scrollY;
    const body = document.body;
    const prevOverflow  = body.style.overflow;
    const prevPosition  = body.style.position;
    const prevTop       = body.style.top;
    const prevWidth     = body.style.width;

    body.style.overflow  = "hidden";
    body.style.position  = "fixed";
    body.style.top       = `-${scrollY}px`;
    body.style.width     = "100%";

    return () => {
      body.style.overflow  = prevOverflow;
      body.style.position  = prevPosition;
      body.style.top       = prevTop;
      body.style.width     = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return {
    birthDate,
    birthTime,
    isOpen,
    openWizard,
    closeWizard,
    completeWizard,
  };
}
