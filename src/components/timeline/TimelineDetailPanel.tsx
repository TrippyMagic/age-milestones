import { motion } from "framer-motion";
import { useMemo } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { DetailPanelItem } from "./types";

type TimelineDetailPanelProps = {
  items: DetailPanelItem[];
  onClose: () => void;
};

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function TimelineDetailPanel({ items, onClose }: TimelineDetailPanelProps) {
  const isMobile = useMediaQuery("(max-width:719px)");

  const sorted = useMemo(
    () => items.slice().sort((a, b) => a.value - b.value),
    [items],
  );

  return (
    <motion.aside
      className="timeline__detail-panel"
      role="dialog"
      aria-label="Event details"
      initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 12 }}
      animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      drag={isMobile ? "y" : false}
      dragConstraints={isMobile ? { top: 0, bottom: 240 } : undefined}
      dragElastic={0.2}
      onDragEnd={isMobile ? (_, info) => {
        if (info.offset.y > 120 || info.velocity.y > 450) onClose();
      } : undefined}
    >
      <header className="timeline__detail-header">
        <h3>Selected events</h3>
        <button type="button" className="timeline__detail-close" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </header>

      <ul className="timeline__detail-list">
        {sorted.map(item => (
          <li key={item.id} className="timeline__detail-item">
            <span className="timeline__detail-title">{item.label}</span>
            {item.subLabel && <span className="timeline__detail-sub">{item.subLabel}</span>}
            <span className="timeline__detail-date">{dateFmt.format(new Date(item.value))}</span>
          </li>
        ))}
      </ul>
    </motion.aside>
  );
}
