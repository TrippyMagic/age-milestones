import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props={
  birthDate:Date|null,
  setBirthDate:(d:Date|null)=>void,
  birthTime:string,
  setBirthTime:(t:string)=>void
}

export default function DateTimePicker({birthDate,setBirthDate,birthTime,setBirthTime}:Props){
  return(
    <section className="card">
      <span className="label">1️⃣ Add your date and time of birth</span>
      <div>
        <label className="muted" htmlFor="date">Date (required)&nbsp;</label>
        <DatePicker
          selected={birthDate}
          onChange={setBirthDate}
          dateFormat="dd-MM-yyyy"
          maxDate={new Date()}
          showYearDropdown scrollableYearDropdown yearDropdownItemNumber={120}
          className="input" placeholderText="Type dd-MM-YYYY or pick"/>
      </div>
      <div className="time-row">
        <label className="muted" htmlFor="time">Time (optional)&nbsp;</label>
        <input id="time" type="time" step={60}
               value={birthTime} onChange={e=>setBirthTime(e.target.value)}
               className="input"/>
      </div>
    </section>
  );
}