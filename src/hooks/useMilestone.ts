import { useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import type { Unit } from "../utils/constants";
import { formatNice } from "../utils/format";

dayjs.extend(duration);
dayjs.extend(utc);

export function useMilestone() {
  const LOCAL_OFFSET = dayjs().utcOffset();

  /* state */
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthTime, setBirthTime] = useState("00:00");
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<Unit>("days");
  const [result, setResult] = useState<string | null>(null);
  const [targetDate, setTarget] = useState<Date|null>(null);
  const [error,setError] = useState<string | null>(null);

  /* calc */
  const calc = () => {
    if (!birthDate) { setError("Insert your birth date first! ✋"); setResult(null); return; }
    setError(null);

    const dt     = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`)
                   .utcOffset(LOCAL_OFFSET);
    const target = dt.add(amount, unit).utcOffset(LOCAL_OFFSET);
    const nice   = formatNice(amount);
    const now    = dayjs().utcOffset(LOCAL_OFFSET);
    const verb   = target.isBefore(now) ? "were" : "will be";

    if (target.isValid()) {
      setTarget(target.toDate())
      setResult(
        `📅 You ${verb} ${nice} ${unit} old on:\n` +
        target.format("D MMMM YYYY HH:mm:ss") +
        `  (UTC${LOCAL_OFFSET >= 0 ? "+" : ""}${LOCAL_OFFSET / 60})`
      );
    } else {
      const years  = dayjs.duration({ [unit]: amount }).asYears();
      const approx = dayjs(birthDate).year() + Math.round(years);
      setTarget(null);
      setResult(
        `≈ Year ${approx} (about ${nice} ${unit} from your birth)\n` +
        "The exact calendar date is beyond what this tool can represent. 🙂"
      );
    }
  };

  return {
    state:{birthDate,birthTime,amount,unit,result,error,targetDate},
    actions: { setBirthDate, setBirthTime, setAmount, setUnit, calc }
  };
}
