import { useState } from "react";

export default function BoothPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("vi");

  const handleTranslate = () => {
    setText(`[${lang}] Nội dung thuyết minh gian hàng VinAI`);
  };

  const handleSpeak = () => {
    const speech = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(speech);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Trang thuyết minh gian hàng</h2>

      <label>Ngôn ngữ: </label>
      <select onChange={(e) => setLang(e.target.value)}>
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </select>

      <br /><br />

      <button onClick={handleTranslate}>Dịch</button>
      <button onClick={handleSpeak}>Phát</button>

      <p>{text}</p>
    </div>
  );
}
