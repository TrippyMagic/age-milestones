import type { UserProfile } from "../context/UserProfileContext";

type OptionalFieldMeta = {
  key: keyof UserProfile;
  label: string;
};

const OPTIONAL_FIELDS: OptionalFieldMeta[] = [
  { key: "restingHeartRate", label: "resting heart rate" },
  { key: "height", label: "height" },
  { key: "weight", label: "weight" },
  { key: "activityLevel", label: "activity level" },
  { key: "sleepHoursPerDay", label: "sleep per day" },
  { key: "screenHoursPerDay", label: "screen time per day" },
];

export type ProfileCompleteness = {
  providedCount: number;
  totalCount: number;
  missingLabels: string[];
  isComplete: boolean;
  isEmpty: boolean;
};

export function getProfileCompleteness(profile: UserProfile): ProfileCompleteness {
  const missingLabels = OPTIONAL_FIELDS
    .filter(({ key }) => profile[key] === undefined)
    .map(({ label }) => label);

  const providedCount = OPTIONAL_FIELDS.length - missingLabels.length;

  return {
    providedCount,
    totalCount: OPTIONAL_FIELDS.length,
    missingLabels,
    isComplete: missingLabels.length === 0,
    isEmpty: providedCount === 0,
  };
}

