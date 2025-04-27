import { useEffect, useState } from "react";
import { useMilestone } from "./hooks/useMilestone";
import DateTimePicker from "./components/DateTimePicker";
// import TimezoneSelect from "./components/TimezoneSelect";
import MilestonePicker from "./components/MilestonePicker";
import ResultBlock from "./components/ResultBlock";
import MorePanel from "./components/MorePanel";
import "./css/App.css";

export default function App() {

  const {state,actions} = useMilestone();
  const {birthDate,birthTime,amount,unit,result,error} = state;
  const {setBirthDate,setBirthTime,setAmount,setUnit,calc} = actions;
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#111827"; 
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  /* ─────────  UI  ───────── */
  return (
    <>
    <header></header>
    <main className="page">
      <h1 className="title">AGE MILESTONES</h1>
      <div className="wrapper">
        <DateTimePicker {...{birthDate,setBirthDate,birthTime,setBirthTime}}/>
        {/*<TimezoneSelect {...{tzOff,setTzOff}}/>*/}
        <MilestonePicker {...{amount,setAmount,unit,setUnit}}/>
      </div>
      <button className="button" onClick={calc}>
        Tell me! 🧙‍♂️
      </button>
      <ResultBlock
        result={result}
        error={error}
        showMore={showMore}
        onMore={()=>setShowMore(!showMore)}
      />
      {showMore && <MorePanel/>}
    </main>
    <footer></footer>
    </>
  );
}
