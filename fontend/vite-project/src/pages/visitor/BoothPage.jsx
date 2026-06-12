import { useState } from "react";

export default function BoothPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("vi");
  const [booth, setBooth] = useState("VinAI");

  const handleTranslate = () => {
    let content =
      booth === "VinAI"
        ? "VinAI là công ty trí tuệ nhân tạo hàng đầu Việt Nam."
        : "FPT Software là công ty công nghệ hàng đầu.";

    setText(`[${lang}] ${content}`);
  };

  const handleSpeak = () => {
    if (!text) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang === "en" ? "en-US" : "vi-VN";
    speechSynthesis.speak(speech);
  };

  return (
    <div
      style={{
        backgroundColor: "#eef2f7",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Segoe UI",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          🎤 Thuyết minh gian hàng
        </h2>

        {/* Booth */}
        <div style={{ marginBottom: "15px" }}>
          <label>Gian hàng</label>
          <br />
          <select
            onChange={(e) => setBooth(e.target.value)}
            style={{ padding: "8px", width: "100%" }}
          >
            <option>VinAI</option>
            <option>FPT Software</option>
          </select>
        </div>

        {/* Language */}
        <div style={{ marginBottom: "20px" }}>
          <label>Ngôn ngữ</label>
          <br />
          <select
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: "8px", width: "100%" }}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleTranslate}
            style={{
              background: "#4CAF50",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📄 Dịch
          </button>

          <button
            onClick={handleSpeak}
            style={{
              background: "#2196F3",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              marginLeft: "10px",
              cursor: "pointer",
            }}
          >
            🔊 Phát
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            background: "#f9fafc",
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            minHeight: "100px",
          }}
        >
          {text || "Nội dung thuyết minh sẽ hiển thị tại đây..."}
        </div>
      </div>
    </div>
  );
}