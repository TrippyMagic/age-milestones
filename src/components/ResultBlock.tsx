type Props={result:string|null,error:string|null,onMore:()=>void,showMore:boolean}

export default function ResultBlock({result,error,onMore,showMore}:Props){
  if(error) return <p className="error">{error}</p>;
  if(!result) return null;

  return(
    <>
      <pre className="result">
        {result.split("\n").map(l=><span key={l}>{l}<br/></span>)}
      </pre>
      <button className="button more-btn" onClick={onMore}>
        {showMore? "Hide":"Tell me more 🧙‍♂️"}
      </button>
    </>
  );
}