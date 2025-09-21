import type { ReactNode } from "react";

const DEFAULT_LABEL = "Mock";

type MockCardProps = {
  label?: ReactNode;
};

export function MockCard({ label = DEFAULT_LABEL }: MockCardProps) {
  return (
    <article className="section-card section-card--mock" aria-label="Mock section">
      <div className="section-card__mock-label">{label}</div>
    </article>
  );
}

export default MockCard;
