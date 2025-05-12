// src/pages/NoMatch.tsx

import { Link } from "react-router-dom";

function NoMatch() {
  return (
    <>
      <h1>404 - Not Found!</h1>
      <Link to="/">Go Home</Link>
    </>
  );
}

export default NoMatch;