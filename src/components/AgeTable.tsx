import { useEffect, useState, useRef } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { formatBig, formatSmall } from "../utils/format";
import dayjs from "dayjs";

export type UnitRow = {
  label: string;
  seconds: number;
};

export default function AgeTable({ rows }: { rows: UnitRow[] }) {
  const { birthDate, birthTime } = useBirthDate();
  const [vals, setVals] = useState(() => rows.map(r => ({ ...r, value: "--", updated: false })));
  const glowResetId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!birthDate) return;
    const base = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`);
  
    const tick = () => {
      const now = dayjs();
      const nowSeconds = dayjs().unix();
      const birthSeconds = dayjs(base).unix();
    
      setVals(prev =>
        rows.map((r, idx) => {
          let display: string;
    
          if (r.label === "Dog years") {
            const humanYears = now.diff(base, "year", true);
            const dogYears = humanYears <= 15
              ? humanYears / 15
              : humanYears <= 24
                ? 1 + (humanYears - 15) / 9
                : 2 + (humanYears - 24) / 5;
            display = dogYears.toFixed(2);
          } else {
            const rawCount = (nowSeconds - birthSeconds) / r.seconds;
            if (rawCount < 1) {
              display = formatSmall(rawCount);
            } else {
              display = formatBig(Math.floor(rawCount));
            }
          }
    
          const oldVal = prev[idx]?.value ?? "--";
          return {
            ...r,
            value: display,
            updated: display !== oldVal
          };
        })
      );

      if (glowResetId.current) clearTimeout(glowResetId.current);
      glowResetId.current = setTimeout(
        () => setVals(v => v.map(o => ({ ...o, updated: false }))),
      300);
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
    <>
    <table className="age-table">
      <tbody>
        {vals.map(r => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td className={`age-val ${r.updated ? "updated" : ""}`}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

