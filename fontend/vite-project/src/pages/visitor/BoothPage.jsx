import { useState } from "react";

export default function BoothPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("vi");

  const handleTranslate = () => {
    if (lang === "vi") setText("VinAI là công ty AI hàng đầu Việt Nam.");
    if (lang === "en") setText("VinAI is a leading AI company in Vietnam.");
  };

  const handleSpeak = () => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang === "en" ? "en-US" : "vi-VN";
    speechSynthesis.speak(speech);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #007bff, #00c6ff)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          width: "320px"
        }}
      >
        <h2 style={{ textAlign: "center" }}>🎤 Booth</h2>

        <select
          onChange={(e) => setLang(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>

        <button onClick={handleTranslate}>Dịch</button>
        <button onClick={handleSpeak} style={{ marginLeft: 10 }}>
          Phát
        </button>

        <div style={{ marginTop: 15 }}>
          {text}
        </div>
      </div>
    </div>
  );
}