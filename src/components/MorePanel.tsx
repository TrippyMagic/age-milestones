import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";  
import dayjs from "dayjs";

type Props = {
  target: Date | null;
  onEvenMore: () => void;
};

export default function MorePanel({ target }: Props) {
  const [left, setLeft] = useState<string>("");
  const nav = useNavigate();    

  /* live countdown ---------------------------- */
  useEffect(() => {
    if (!target) return;
    const update = () => {
      const diff = Math.max(0, dayjs(target).diff(dayjs(), "second"));
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setLeft(`${d}d ${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  const weekday = target ? dayjs(target).format("dddd") : "--";
  return (
    <div className="more-panel">
      <p>
        📆 That date will fall on a <strong>{weekday}</strong>
      </p>
      {target && <p>⏳ Countdown: {left}</p>}
      <button className="button more-btn" onClick={() => nav("/dateFocus")}>
        Tell me even more 🤓
      </button>
    </div>
  );
}
