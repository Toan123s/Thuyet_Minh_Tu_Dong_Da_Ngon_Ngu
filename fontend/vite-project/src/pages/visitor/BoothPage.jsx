import { useState } from "react";

export default function BoothPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("vi");
  const [booth, setBooth] = useState("VinAI");

  // XỬ LÝ DỊCH (GIẢ LẬP AI)
  const handleTranslate = () => {
    let content = "";

    if (booth === "VinAI") {
      content = "VinAI là công ty trí tuệ nhân tạo hàng đầu Việt Nam, chuyên nghiên cứu và phát triển các sản phẩm AI tiên tiến.";
    } else if (booth === "FPT Software") {
      content = "FPT Software là công ty phần mềm hàng đầu, cung cấp giải pháp công nghệ cho khách hàng toàn cầu.";
    }

    setText(`[${lang}] ${content}`);
  };

  // XỬ LÝ PHÁT ÂM (TEXT TO SPEECH)
  const handleSpeak = () => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);

    // chọn giọng theo ngôn ngữ
    if (lang === "en") {
      speech.lang = "en-US";
    } else {
      speech.lang = "vi-VN";
    }

    speechSynthesis.speak(speech);
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2>🎤 Thuyết minh gian hàng</h2>

      {/* CHỌN BOOTH */}
      <div style={{ marginBottom: "15px" }}>
        <label>Gian hàng: </label>
        <select onChange={(e) => setBooth(e.target.value)}>
          <option value="VinAI">VinAI</option>
          <option value="FPT Software">FPT Software</option>
        </select>
      </div>

      {/* CHỌN NGÔN NGỮ */}
      <div style={{ marginBottom: "15px" }}>
        <label>Ngôn ngữ: </label>
        <select onChange={(e) => setLang(e.target.value)}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* BUTTON */}
      <div>
        <button onClick={handleTranslate}>📄 Dịch</button>

        <button
          onClick={handleSpeak}
          style={{ marginLeft: "10px" }}
        >
          🔊 Phát
        </button>
      </div>

      {/* HIỂN THỊ TEXT */}
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          minHeight: "80px"
        }}
      >
        {text || "Nội dung sẽ hiển thị tại đây..."}
      </div>
    </div>
  );
}
``
