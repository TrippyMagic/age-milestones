import { useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import BirthDatePicker from "../components/BirthDatePicker";
import { useUserProfile, type ActivityLevel } from "../context/UserProfileContext";
import { useBirthDate } from "../context/BirthDateContext";

const numOrUndef = (v: string): number | undefined => {
  if (v === "") return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
};

export default function Personalize() {
  const { profile, updateProfile, resetProfile } = useUserProfile();
  const { birthDate } = useBirthDate();
  const nav = useNavigate();

  const handleNum = useCallback(
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      updateProfile({ [field]: numOrUndef(e.target.value) });
    },
    [updateProfile],
  );

  const handleActivity = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value as ActivityLevel | "";
      updateProfile({ activityLevel: val || undefined });
    },
    [updateProfile],
  );

  return (
    <>
      <Navbar />
      <main className="page personalize-page">
        <h1 className="personalize__title">Personalize</h1>
        <p className="personalize__intro">
          Set your birth date and optionally fill in details about yourself.
          The more you share, the narrower the estimate ranges become —
          making your numbers more personal without pretending to be precise.
        </p>

        {/* ── Birth date ──────────────────────────────── */}
        <section className="personalize__section">
          <h2 className="personalize__section-title">Birth date</h2>
          <BirthDatePicker />
        </section>

        {/* ── About you ─────────────────────────────── */}
        <section className="personalize__section">
          <h2 className="personalize__section-title">About you</h2>

          <label className="personalize__field">
            <span className="personalize__label">Resting heart rate</span>
            <span className="personalize__hint">Refines Heartbeats, Breaths</span>
            <div className="personalize__input-row">
              <input
                type="number"
                className="input personalize__input"
                placeholder="e.g. 68"
                min={30}
                max={200}
                value={profile.restingHeartRate ?? ""}
                onChange={handleNum("restingHeartRate")}
              />
              <span className="personalize__unit">bpm</span>
            </div>
          </label>

          <label className="personalize__field">
            <span className="personalize__label">Height</span>
            <span className="personalize__hint">Refines stride length → Steps, Km walked</span>
            <div className="personalize__input-row">
              <input
                type="number"
                className="input personalize__input"
                placeholder="e.g. 175"
                min={50}
                max={250}
                value={profile.height ?? ""}
                onChange={handleNum("height")}
              />
              <span className="personalize__unit">cm</span>
            </div>
          </label>

          <label className="personalize__field">
            <span className="personalize__label">Weight</span>
            <span className="personalize__hint">Refines Calories burned</span>
            <div className="personalize__input-row">
              <input
                type="number"
                className="input personalize__input"
                placeholder="e.g. 70"
                min={20}
                max={300}
                value={profile.weight ?? ""}
                onChange={handleNum("weight")}
              />
              <span className="personalize__unit">kg</span>
            </div>
          </label>
        </section>

        {/* ── Lifestyle ─────────────────────────────── */}
        <section className="personalize__section">
          <h2 className="personalize__section-title">Lifestyle</h2>

          <label className="personalize__field">
            <span className="personalize__label">Activity level</span>
            <span className="personalize__hint">Refines Steps, Km walked, Calories</span>
            <select
              className="select personalize__select"
              value={profile.activityLevel ?? ""}
              onChange={handleActivity}
            >
              <option value="">Not specified</option>
              <option value="sedentary">Sedentary</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </label>

          <label className="personalize__field">
            <span className="personalize__label">Sleep per day</span>
            <span className="personalize__hint">Refines biological estimates</span>
            <div className="personalize__input-row">
              <input
                type="number"
                className="input personalize__input"
                placeholder="e.g. 7.5"
                min={2}
                max={18}
                step={0.5}
                value={profile.sleepHoursPerDay ?? ""}
                onChange={handleNum("sleepHoursPerDay")}
              />
              <span className="personalize__unit">hours</span>
            </div>
          </label>

          <label className="personalize__field">
            <span className="personalize__label">Screen time per day</span>
            <span className="personalize__hint">Refines Smartphone unlocks, Nerdy metrics</span>
            <div className="personalize__input-row">
              <input
                type="number"
                className="input personalize__input"
                placeholder="e.g. 5"
                min={0}
                max={24}
                step={0.5}
                value={profile.screenHoursPerDay ?? ""}
                onChange={handleNum("screenHoursPerDay")}
              />
              <span className="personalize__unit">hours</span>
            </div>
          </label>
        </section>

        {/* ── Actions ───────────────────────────────── */}
        <div className="personalize__actions">
          <button type="button" className="button button--ghost" onClick={resetProfile}>
            Reset to defaults
          </button>
          <button
            type="button"
            className="button"
            disabled={!birthDate}
            title={!birthDate ? "Set a birth date first" : "Save and go to Milestones"}
            onClick={() => nav("/milestones")}
          >
            Save &amp; Explore
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
