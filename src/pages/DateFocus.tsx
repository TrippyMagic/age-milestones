import "../css/Landing.css";        
import  Footer  from "../components/Footer";
import { Link } from "react-router-dom";

export default function DateFocus(){
  return (
    <>
    <header className="navbar">
        <Link to="/">← Edit date of birth</Link>
    </header>
    <main className="page">
      <h1 className="title">DATE FOCUS</h1>
      <p className="result">🚧 Coming soon!</p>
    </main>
    <Footer/>
    </>
  );
}