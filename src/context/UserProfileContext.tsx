/**
 * src/context/UserProfileContext.tsx
 * Optional user profile that refines estimate ranges.
 * Persisted in localStorage.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ActivityLevel = "sedentary" | "moderate" | "active";

export type UserProfile = {
  // Physical (optional)
  restingHeartRate?: number;   // bpm
  height?: number;             // cm
  weight?: number;             // kg

  // Lifestyle (optional)
  activityLevel?: ActivityLevel;
  sleepHoursPerDay?: number;
  screenHoursPerDay?: number;
};

const LS_KEY = "user_profile";

const EMPTY: UserProfile = {};

const readProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : EMPTY;
  } catch {
    return EMPTY;
  }
};

const writeProfile = (p: UserProfile) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch { /* noop */ }
};

type ProfileCtx = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;
};

const Ctx = createContext<ProfileCtx | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(readProfile);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile(prev => {
      // Strip undefined values from patch so they don't pollute storage
      const cleaned = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || (typeof v === "number" && isNaN(v))) {
          delete (cleaned as Record<string, unknown>)[k];
        } else {
          (cleaned as Record<string, unknown>)[k] = v;
        }
      }
      writeProfile(cleaned);
      return cleaned;
    });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(EMPTY);
    writeProfile(EMPTY);
  }, []);

  return (
    <Ctx.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserProfile must be used inside UserProfileProvider");
  return ctx;
}


