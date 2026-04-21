import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import BirthDatePicker from "../components/BirthDatePicker";
import { useUserProfile, type ActivityLevel } from "../context/UserProfileContext";
import { useBirthDate } from "../context/BirthDateContext";
import { getProfileCompleteness } from "../utils/profileCompleteness";
import { getAboutSectionHref } from "../utils/aboutLinks";

const numOrUndef = (v: string): number | undefined => {
  if (v === "") return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
};

export default function Settings() {
  const { profile, updateProfile, resetProfile } = useUserProfile();
  const { birthDate } = useBirthDate();
  const nav = useNavigate();
  const [exitWarningOpen, setExitWarningOpen] = useState(false);

  const profileStatus = useMemo(() => getProfileCompleteness(profile), [profile]);
  const showMissingDobWarning = !birthDate;
  const showProfileWarning = !profileStatus.isComplete;

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

  const handleNavigateAttempt = useCallback((to: "/" | "/milestones" | "/timescales" | "/settings" | "/about") => {
    if (!birthDate && to !== "/settings") {
      setExitWarningOpen(true);
      return false;
    }
    return true;
  }, [birthDate]);

  useEffect(() => {
    if (birthDate) {
      setExitWarningOpen(false);
      return;
    }

    const onBeforeUnload = (evt: BeforeUnloadEvent) => {
      evt.preventDefault();
      evt.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [birthDate]);

  return (
    <>
      <Navbar onNavigateAttempt={handleNavigateAttempt} />
      <main className="page personalize-page">
        <h1 className="personalize__title">Settings</h1>
        <p className="personalize__intro">
          This is the single place where Kronoscope stores your birth date and optional profile details.
          Update them here to keep Milestones, timeline estimates, and future comparisons in sync.
        </p>
        <Link to={getAboutSectionHref("settings")} className="help-link help-link--inline">
          How Settings works
        </Link>

        {showMissingDobWarning && (
          <section className="status-banner status-banner--danger" role="alert" aria-live="assertive">
            <h2 className="status-banner__title">Birth date required</h2>
            <p className="status-banner__message">
              Milestones and timeline estimates are blocked until you set a valid birth date again.
              If you try to leave Settings now, Kronoscope will remain unusable for DOB-dependent views.
            </p>
          </section>
        )}

        {exitWarningOpen && !birthDate && (
          <section className="status-banner status-banner--danger" role="alert" aria-live="assertive">
            <h2 className="status-banner__title">You still need a birth date</h2>
            <p className="status-banner__message">
              Set a birth date before leaving Settings. This keeps Milestones and all age-based calculations available.
            </p>
          </section>
        )}

        {showProfileWarning && (
          <section className="status-banner status-banner--warning" role="status" aria-live="polite">
            <h2 className="status-banner__title">Estimates can be more personal</h2>
            <p className="status-banner__message">
              Estimates will be less precise without these details: {profileStatus.missingLabels.join(", ")}.
              You have filled in {profileStatus.providedCount} of {profileStatus.totalCount} optional profile fields.
            </p>
          </section>
        )}

        {/* ── Birth date ──────────────────────────────── */}
        <section className="personalize__section">
          <h2 className="personalize__section-title">Identity &amp; birth date</h2>
          <BirthDatePicker />
          <p className="personalize__hint">
            Your date of birth is the primary input for the timeline and all age-based calculations.
          </p>
        </section>

        <div className="personalize__grid">
          {/* ── Personal metrics ─────────────────────── */}
          <section className="personalize__section">
            <h2 className="personalize__section-title">Personal metrics</h2>

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

          {/* ── Lifestyle modifiers ──────────────────── */}
          <section className="personalize__section">
            <h2 className="personalize__section-title">Lifestyle modifiers</h2>

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
        </div>

        {/* ── Actions ───────────────────────────────── */}
        <div className="personalize__actions">
          <button type="button" className="button button--ghost" onClick={resetProfile}>
            Reset profile
          </button>
          <button
            type="button"
            className="button"
            disabled={!birthDate}
            title={!birthDate ? "Set a birth date first" : "Save settings and go to Milestones"}
            onClick={() => {
              if (!birthDate) {
                setExitWarningOpen(true);
                return;
              }
              nav("/milestones");
            }}
          >
            Save settings
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}




