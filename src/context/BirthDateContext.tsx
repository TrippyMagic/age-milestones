import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = {
  birthDate: Date | null;
  setBirthDate: (d: Date) => void;
  birthTime: string;                
  setBirthTime: (t: string) => void;
};

const BirthCtx = createContext<Ctx | undefined>(undefined);

export function BirthDateProvider({ children }: { children: ReactNode }) {
  /* ---------- date (persisted) -------------------- */
  const [birthDate, setBirthDateState] = useState<Date | null>(() => {
    const raw = localStorage.getItem("dob");
    return raw ? new Date(raw) : null;
  });

  const setBirthDate = (d: Date) => {
    setBirthDateState(d);
    localStorage.setItem("dob", d.toISOString());
  };

  /* ---------- time (persisted) -------------------- */
  const [birthTime, setBirthTimeState] = useState<string>(() => {
    return localStorage.getItem("dobTime") ?? "00:00";
  });

  const setBirthTime = (t: string) => {
    setBirthTimeState(t);
    localStorage.setItem("dobTime", t);
  };

  /* ---------- context value ----------------------- */
  return (
    <BirthCtx.Provider
      value={{ birthDate, setBirthDate, birthTime, setBirthTime }}
    >
      {children}
    </BirthCtx.Provider>
  );
}

export function useBirthDate() {
  const ctx = useContext(BirthCtx);
  if (!ctx)
    throw new Error("useBirthDate must be used inside BirthDateProvider");
  return ctx;
}
