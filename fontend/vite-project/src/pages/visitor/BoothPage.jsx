import { useParams } from "react-router-dom";

export default function BoothPage(){

  const { id } = useParams();

  const lang = localStorage.getItem("lang") || "en";

  const data = {
    1:{
      vi:"Pizza Ý truyền thống",
      en:"Italian Pizza"
    }
  };

  const booth = data[id];

  const text = booth ? (booth[lang] || booth.en) : "";

  const label = {
    vi: "Nghe",
    en: "Listen"
  };

  const speak = ()=>{
    if(!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang === "vi" ? "vi-VN" : "en-US";
    speechSynthesis.speak(speech);
  };

  return (
    <div style={{padding:30}}>

      <h2>Booth {id}</h2>

      <p>{text}</p>

      <button onClick={speak}>
        🔊 {label[lang]}
      </button>

    </div>
  );
}