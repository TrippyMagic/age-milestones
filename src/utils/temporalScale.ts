/**
 * src/utils/temporalScale.ts
 * Shared pure helpers for absolute temporal scales used by Timescales surfaces.
 * Kept separate from scaleTransform.ts so date/viewport math stays timeline-focused.
 */
import { clamp, toPercent } from "./scaleTransform";

export type AbsoluteLogScaleConfig = {
  minLog: number;
  maxLog: number;
  inputOffset?: number;
  invert?: boolean;
  clampResult?: boolean;
};

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

export const absoluteLogRatio = (
  value: number,
  {
    minLog,
    maxLog,
    inputOffset = 0,
    invert = false,
    clampResult = true,
  }: AbsoluteLogScaleConfig,
): number => {
  const span = maxLog - minLog;
  if (!isFiniteNumber(value) || !isFiniteNumber(minLog) || !isFiniteNumber(maxLog) || span <= 0) {
    return 0;
  }

  const adjustedValue = value + inputOffset;
  if (!isFiniteNumber(adjustedValue) || adjustedValue <= 0) {
    return invert ? 1 : 0;
  }

  const rawRatio = (Math.log10(adjustedValue) - minLog) / span;
  const nextRatio = invert ? 1 - rawRatio : rawRatio;
  return clampResult ? clamp(nextRatio, 0, 1) : nextRatio;
};

export const absoluteLogPercent = (
  value: number,
  config: AbsoluteLogScaleConfig,
): number => toPercent(absoluteLogRatio(value, config));

export const roundedLogExponent = (value: number, inputOffset = 0): number | null => {
  const adjustedValue = value + inputOffset;
  if (!isFiniteNumber(adjustedValue) || adjustedValue <= 0) {
    return null;
  }

  return Math.round(Math.log10(adjustedValue));
};

export const formatLogExponentLabel = (exponent: number, unitSuffix?: string): string => {
  if (!unitSuffix) return `10^${exponent}`;
  return `10^${exponent} ${unitSuffix}`;
};

