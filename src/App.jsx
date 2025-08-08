// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { Link, useNavigate } from "react-router";

function App() {
  // const [count, setCount] = useState(0);
  const navigate = useNavigate()
  return (
    <div className="flex justify-center gap-2 flex-col p-4 mt-6">
      <h1 className="text-3xl font-bold underline">Home Page!</h1>
      
      <button className="btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl" onClick={()=>navigate('/auth/login')}>Login</button>
      <button className="btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl" onClick={()=>navigate('/auth/register')}>Register</button>
    </div>
  );
}

export default App;
