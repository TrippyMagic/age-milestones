import { ButHowMuch, type ScaleKind } from "../scaleOverlay";

type HowMuchHintProps = {
  value: number;
  unit?: string;
  kind: ScaleKind;
  disabled?: boolean;
};

const MIN_INTERESTING_VALUE = 0.001;
const MAX_INTERESTING_VALUE = 1000;

export const HowMuchHint = ({ value, unit, kind, disabled = false }: HowMuchHintProps) => {
  const magnitude = Math.abs(value);
  const hideByMagnitude =
    magnitude >= MIN_INTERESTING_VALUE && magnitude <= MAX_INTERESTING_VALUE;
  if (disabled || hideByMagnitude || Number.isNaN(value) || kind !== "count") {
    return null;
  }

  return (
    <ButHowMuch value={value} unit={unit} kind={kind}>
      <button
        type="button"
        className="howmuch-btn"
        title="But how much is it?"
        aria-label="But how much is it?"
      >
        ?
      </button>
    </ButHowMuch>
  );
};
