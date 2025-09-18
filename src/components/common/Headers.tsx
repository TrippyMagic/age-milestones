import {Link} from "react-router-dom";

export function Title() {
    return (
        <h1 className="title">AGE MILESTONES</h1>
    )
}

export function Navbar() {
    return (
        <header className="navbar">
            <Link to="/">← Edit date of birth</Link>
        </header>
    )
}