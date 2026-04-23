import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import BirthDatePicker from "../components/BirthDatePicker";
import { useUserProfile, type ActivityLevel } from "../context/UserProfileContext";
import { useBirthDate } from "../context/BirthDateContext";
import { getProfileCompleteness } from "../utils/profileCompleteness";
import { getAboutSectionHref } from "../utils/aboutLinks";
import { Banner, Button, Field, FormActions, Panel, Stack } from "../ui";

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
        <Stack gap="sm">
          <h1 className="personalize__title">Settings</h1>
          <p className="personalize__intro">
            This is the single place where Kronoscope stores your birth date and optional profile details.
            Update them here to keep Milestones, timeline estimates, and future comparisons in sync.
          </p>
          <Link to={getAboutSectionHref("settings")} className="help-link help-link--inline">
            How Settings works
          </Link>
        </Stack>

        {showMissingDobWarning && (
          <Banner tone="danger" role="alert" aria-live="assertive" title="Birth date required">
            <p>
              Milestones and timeline estimates are blocked until you set a valid birth date again.
              If you try to leave Settings now, Kronoscope will remain unusable for DOB-dependent views.
            </p>
          </Banner>
        )}

        {exitWarningOpen && !birthDate && (
          <Banner tone="danger" role="alert" aria-live="assertive" title="You still need a birth date">
            <p>
              Set a birth date before leaving Settings. This keeps Milestones and all age-based calculations available.
            </p>
          </Banner>
        )}

        {showProfileWarning && (
          <Banner tone="warning" role="status" aria-live="polite" title="Estimates can be more personal">
            <p>
              Estimates will be less precise without these details: {profileStatus.missingLabels.join(", ")}.
              You have filled in {profileStatus.providedCount} of {profileStatus.totalCount} optional profile fields.
            </p>
          </Banner>
        )}

        <Panel title="Identity & birth date">
          <BirthDatePicker />
          <p className="personalize__hint">
            Your date of birth is the primary input for the timeline and all age-based calculations.
          </p>
        </Panel>

        <div className="personalize__grid">
          <Panel title="Personal metrics">
            <Stack gap="md">
              <p className="personalize__section-summary">
                Fill in only what you know. Numeric fields accept rough values and stay optional.
              </p>
              <Field label="Resting heart rate" hint="Refines Heartbeats, Breaths" className="personalize__field" htmlFor="settings-resting-heart-rate">
                <div className="ui-input-row personalize__input-row">
                  <input
                    id="settings-resting-heart-rate"
                    type="number"
                    inputMode="numeric"
                    className="ui-input personalize__input"
                    placeholder="e.g. 68"
                    min={30}
                    max={200}
                    value={profile.restingHeartRate ?? ""}
                    onChange={handleNum("restingHeartRate")}
                  />
                  <span className="ui-unit">bpm</span>
                </div>
              </Field>

              <Field label="Height" hint="Refines stride length → Steps, Km walked" className="personalize__field" htmlFor="settings-height">
                <div className="ui-input-row personalize__input-row">
                  <input
                    id="settings-height"
                    type="number"
                    inputMode="numeric"
                    className="ui-input personalize__input"
                    placeholder="e.g. 175"
                    min={50}
                    max={250}
                    value={profile.height ?? ""}
                    onChange={handleNum("height")}
                  />
                  <span className="ui-unit">cm</span>
                </div>
              </Field>

              <Field label="Weight" hint="Refines Calories burned" className="personalize__field" htmlFor="settings-weight">
                <div className="ui-input-row personalize__input-row">
                  <input
                    id="settings-weight"
                    type="number"
                    inputMode="numeric"
                    className="ui-input personalize__input"
                    placeholder="e.g. 70"
                    min={20}
                    max={300}
                    value={profile.weight ?? ""}
                    onChange={handleNum("weight")}
                  />
                  <span className="ui-unit">kg</span>
                </div>
              </Field>
            </Stack>
          </Panel>

          <Panel title="Lifestyle modifiers">
            <Stack gap="md">
              <p className="personalize__section-summary">
                These controls refine estimates without locking any feature if you leave them blank.
              </p>
              <Field label="Activity level" hint="Refines Steps, Km walked, Calories" className="personalize__field" htmlFor="settings-activity-level">
                <select
                  id="settings-activity-level"
                  className="ui-select personalize__select"
                  value={profile.activityLevel ?? ""}
                  onChange={handleActivity}
                >
                  <option value="">Not specified</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </Field>

              <Field label="Sleep per day" hint="Refines biological estimates" className="personalize__field" htmlFor="settings-sleep-hours">
                <div className="ui-input-row personalize__input-row">
                  <input
                    id="settings-sleep-hours"
                    type="number"
                    inputMode="decimal"
                    className="ui-input personalize__input"
                    placeholder="e.g. 7.5"
                    min={2}
                    max={18}
                    step={0.5}
                    value={profile.sleepHoursPerDay ?? ""}
                    onChange={handleNum("sleepHoursPerDay")}
                  />
                  <span className="ui-unit">hours</span>
                </div>
              </Field>

              <Field label="Screen time per day" hint="Refines Smartphone unlocks, Nerdy metrics" className="personalize__field" htmlFor="settings-screen-hours">
                <div className="ui-input-row personalize__input-row">
                  <input
                    id="settings-screen-hours"
                    type="number"
                    inputMode="decimal"
                    className="ui-input personalize__input"
                    placeholder="e.g. 5"
                    min={0}
                    max={24}
                    step={0.5}
                    value={profile.screenHoursPerDay ?? ""}
                    onChange={handleNum("screenHoursPerDay")}
                  />
                  <span className="ui-unit">hours</span>
                </div>
              </Field>
            </Stack>
          </Panel>
        </div>

        <FormActions className="personalize__actions">
          <Button variant="ghost" onClick={resetProfile}>
            Reset profile
          </Button>
          <Button
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
          </Button>
        </FormActions>
      </main>
      <Footer />
    </>
  );
}




