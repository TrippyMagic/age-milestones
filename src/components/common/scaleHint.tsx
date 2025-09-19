import { ButHowMuch, type ScaleKind } from "../scaleOverlay";

type HowMuchHintProps = { value: number; unit?: string; kind: ScaleKind };

export const HowMuchHint = ({ value, unit, kind }: HowMuchHintProps) => (
  <ButHowMuch value={value} unit={unit} kind={kind}>
    <button
      type="button"
      className="howmuch-btn"
      title="But how much is it?"
      aria-label="But how much is it?"
      style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
    >
      ?
    </button>
  </ButHowMuch>
);
