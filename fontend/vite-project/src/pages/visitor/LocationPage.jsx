import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LocationPage(){

  const navigate = useNavigate();

  useEffect(()=>{
    navigator.geolocation.getCurrentPosition(

      ()=>navigate("/booth/1"),

      ()=>{
        alert("Enable GPS or use map");
        navigate("/map");
      }

    );
  },[]);

  return (
    <div style={styles}>
      <h2>📍 Detecting location...</h2>
    </div>
  );
}

const styles={
  height:"100vh",
  display:"flex",
  justifyContent:"center",
  alignItems:"center"
};