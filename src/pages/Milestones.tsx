import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMilestone } from "../hooks/useMilestone";
import { TAB_ROWS } from "../utils/otherTimeUnitsConst";
import MilestonePicker from "../components/MilestonePicker";
import ResultBlock from "../components/ResultBlock";
import AgeTable from "../components/AgeTable";    
import Footer from "../components/Footer";    
import "../css/index.css";

export default function Milestones() {
  /* data / actions */
  const { state, actions } = useMilestone();
  const { amount, unit, result, error, targetDate, birthDate } = state;
  const { setAmount, setUnit, calc } = actions;
  const [stage, setStage] = useState<"age" | "milestone">("age"); 
  const [showMore, setShowMore] = useState(false);
  const [tab, setTab] = useState<keyof typeof TAB_ROWS>("Classic");
  const allTabs = Object.keys(TAB_ROWS) as Array<keyof typeof TAB_ROWS>;
  const safeTab = allTabs.includes(tab) ? tab : "Classic";
  const rows = TAB_ROWS[safeTab];
  const nav = useNavigate();

  useEffect(() => { if (!birthDate) nav("/"); }, [birthDate, nav]);

  useEffect(() => {
    document.body.style.backgroundColor = "#111827";
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  return (
    <>
      {/* ------------ nav bar ------------ */}
      <header className="navbar">
        <Link to="/">← Edit date of birth</Link>
      </header>

      <main className="page">
        <h1 className="title">AGE MILESTONES</h1>

        {stage === "age" && (
          <>
            <div className="tabs">
              {Object.keys(TAB_ROWS).map(t => (
                <button
                  key={t}
                  className={`tab ${t === tab ? "tab--active" : ""}`}
                  onClick={() => setTab(t as keyof typeof TAB_ROWS)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="table-wrap">
              <h2 className="subtitle">Your age in {tab.toLocaleLowerCase()} perspective</h2>
              <AgeTable rows={rows} />
            </div>
            <button className="button" onClick={() => setStage("milestone")}>
              Your next milestones →
            </button>
          </>
        )}
        {stage === "milestone" && (
          <>
            <div className="wrapper">
              <MilestonePicker {...{ amount, setAmount, unit, setUnit }} />
            </div>
            <button className="button" onClick={calc}>
              Tell me! 🧙‍♂️
            </button>
            <ResultBlock
              result={result}
              error={error}
              showMore={showMore}
              onMore={() => setShowMore(!showMore)}
              target={targetDate}
            />
          </>
        )}
      </main>
      <Footer/>
    </>
  );
}
