import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

type Props = { target: Date | null };

export default function MorePanel({ target }: Props) {
  const navigate = useNavigate();
  const [clock, setClock] = useState("--");

  /* live timer (count-down OR count-up) ---------------------- */
  useEffect(() => {
    if (!target) return;

    const tick = () => {
      const delta = dayjs(target).diff(dayjs(), "second"); // + future | - past
      const abs   = Math.abs(delta);
      const d = Math.floor(abs / 86400);
      const h = Math.floor((abs % 86400) / 3600);
      const m = Math.floor((abs % 3600) / 60);
      const s = abs % 60;
      setClock(`${d}d ${h}h ${m}m ${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  /* wording -------------------------------------------------- */
  const isPast   = target ? dayjs(target).isBefore(dayjs()) : false;
  const weekday  = target ? dayjs(target).format("dddd") : "--";
  const sentence = isPast
    ? `📆 That date fell on a ${weekday}`
    : `📆 That date will fall on a ${weekday}`;
  const label    = isPast ? "Time elapsed" : "Countdown";

  return (
    <div className="more-panel">
      <p dangerouslySetInnerHTML={{ __html: sentence }} />
      {target && <p>⏳ {label}: {clock}</p>}

      <button className="button more-btn" onClick={() => navigate("/dateFocus")}>
        Tell me even more 🤓
      </button>
    </div>
  );
}
