import { PRESETS, SLIDER, TIME_UNITS, Unit } from "../utils/constants";
import { formatNice } from "../utils/format";

type Props={
  amount:number,setAmount:(n:number)=>void,
  unit:Unit,setUnit:(u:Unit)=>void
}

export default function MilestonePicker({amount,setAmount,unit,setUnit}:Props){
  let idx = SLIDER.indexOf(amount)!==-1 ? SLIDER.indexOf(amount)
                                        : SLIDER.findIndex(v=>v>amount);
  // Clamp index to last slider value if value exceeds defined milestones
  if (idx === -1) idx = SLIDER.length - 1;

  return(
    <section className="card">
      <span className="label">2️⃣ Pick your milestone</span>
      <label className="muted" htmlFor="milestone">I would like to know when I will be&nbsp;</label>
      <div className="chips">
        {PRESETS.map(v=>(
          <button key={v} type="button"
                  className={`chip ${amount===v?"chip--active":""}`}
                  onClick={()=>setAmount(v)}>
            {formatNice(v)}
          </button>
        ))}
      </div>
      <input type="range" min={0} max={SLIDER.length-1} step={1}
             value={idx} onChange={e=>setAmount(SLIDER[+e.target.value])}
             className="slider"/>
      <div className="milestone-row">
        <input type="number" min={1} value={amount}
               onChange={e=>setAmount(+e.target.value)}
               className="input short"/>
        <select value={unit} onChange={e=>setUnit(e.target.value as Unit)} className="select">
          {TIME_UNITS.map(u=> <option key={u}>{u}</option>)}
        </select>
        <span className="muted">old</span>
      </div>
    </section>
  );
}