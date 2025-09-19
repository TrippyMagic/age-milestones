import { useEffect, useState, useRef, type ReactNode } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { formatDisplay } from "../utils/format";
import dayjs from "dayjs";

export type UnitRow = {
  label: string;
  seconds: number;
};

type AgeTableProps = {
  rows: UnitRow[];
  renderNumber?: (value: number, label: string) => ReactNode;
};

type ValRow = UnitRow & {
  value: string;
  raw: number;
  updated: boolean;
};

export default function AgeTable({ rows, renderNumber }: AgeTableProps) {
  const { birthDate, birthTime } = useBirthDate();
  const [vals, setVals] = useState<ValRow[]>(() =>
    rows.map(r => ({ ...r, value: "--", raw: NaN, updated: false }))
  );
  const glowResetId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!birthDate) return;
    const base = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`);

    const tick = () => {
      const now = dayjs();
      const nowSeconds = now.unix();
      const birthSeconds = base.unix();

      setVals(prev =>
        rows.map((r, idx) => {
          let display: string;
          let raw: number;

          if (r.label === "Dog years") {
            const humanYears = now.diff(base, "year", true);
            const dogYears =
              humanYears <= 15
                ? humanYears / 15
                : humanYears <= 24
                ? 1 + (humanYears - 15) / 9
                : 2 + (humanYears - 24) / 5;
            raw = dogYears;
            display = dogYears.toFixed(4);
          } else {
            raw = (nowSeconds - birthSeconds) / r.seconds;
            display = formatDisplay(raw);
          }

          const oldVal = prev[idx]?.value ?? "--";
          return {
            ...r,
            value: display,
            raw,
            updated: display !== oldVal,
          };
        })
      );

      if (glowResetId.current) clearTimeout(glowResetId.current);
      glowResetId.current = setTimeout(
        () => setVals(v => v.map(o => ({ ...o, updated: false }))),
        300
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      if (glowResetId.current) clearTimeout(glowResetId.current);
    };
  }, [birthDate, birthTime, rows]);

  if (!birthDate) return null;

  return (
    <table className="age-table">
      <tbody>
        {vals.map(r => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td className={`age-val ${r.updated ? "updated" : ""}`}>
              {renderNumber ? renderNumber(r.raw, r.label) : r.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
