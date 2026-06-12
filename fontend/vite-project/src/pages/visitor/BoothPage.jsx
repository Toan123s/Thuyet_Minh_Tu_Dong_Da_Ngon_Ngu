import { useState } from "react";

export default function BoothPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("vi");
  const [booth, setBooth] = useState("VinAI");

  const handleTranslate = () => {
    let content = "";

    if (booth === "VinAI") {
      content =
        "VinAI là công ty trí tuệ nhân tạo hàng đầu Việt Nam, chuyên nghiên cứu và phát triển công nghệ AI tiên tiến.";
    } else {
      content =
        "FPT Software là công ty công nghệ hàng đầu cung cấp giải pháp phần mềm cho khách hàng toàn cầu.";
    }

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
        backgroundColor: "#f4f6f9",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Segoe UI",
      }}
    >
      {/* CARD */}
      <div
        style={{
          maxWidth: "800px",
          margin: "auto",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* HEADER */}
        <h2 style={{ marginBottom: "20px" }}>
          🎤 Thuyết minh gian hàng
        </h2>

        {/* SELECT BOOTH */}
        <div style={{ marginBottom: "15px" }}>
          <label>Gian hàng:</label>
          <br />
          <select
            onChange={(e) => setBooth(e.target.value)}
            style={{ padding: "5px", width: "200px" }}
          >
            <option value="VinAI">VinAI</option>
            <option value="FPT Software">FPT Software</option>
          </select>
        </div>

        {/* SELECT LANG */}
        <div style={{ marginBottom: "20px" }}>
          <label>Ngôn ngữ:</label>
          <br />
          <select
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: "5px", width: "200px" }}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* BUTTON */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleTranslate}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "white",
              cursor: "pointer",
            }}
          >
            📄 Dịch
          </button>

          <button
            onClick={handleSpeak}
            style={{
              padding: "10px 20px",
              marginLeft: "10px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2196F3",
              color: "white",
              cursor: "pointer",
            }}
          >
            🔊 Phát
          </button>
        </div>

        {/* CONTENT */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            minHeight: "120px",
            backgroundColor: "#fafafa",
          }}
        >
          {text || "Nội dung thuyết minh sẽ hiển thị tại đây..."}
        </div>
      </div>
    </div>
  );
}
