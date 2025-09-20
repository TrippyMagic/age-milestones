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
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
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
