import { timezones } from "../utils/constants"

type Props={tzOff:number,setTzOff:(n:number)=>void}

export default function TimezoneSelect({tzOff,setTzOff}:Props){
  return(
    <section className="card">
      <span className="label">2️⃣ Timezone (optional)</span>
      <select className="select" value={tzOff} onChange={e=>setTzOff(+e.target.value)}>
        {timezones.map(({off,city})=>(
          <option key={off} value={off*60}>
            UTC{off>=0?"+":""}{off} — {city}
          </option>
        ))}
      </select>
    </section>
  );
}