import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

function App() {

  const [page, setPage] = useState("landing");
  const [lang, setLang] = useState(localStorage.getItem("lang") || "");

  const text = {
  vi: {
    title: "TRIỂN LÃM 2026",
    start: "Bắt đầu",
    pay: "Thanh toán",
    next: "Tiếp tục",
    booth: "Pizza Ý truyền thống",
    listen: "Nghe"
  },
  en: {
    title: "EXHIBITION 2026",
    start: "Start",
    pay: "Payment",
    next: "Next",
    booth: "Italian Pizza",
    listen: "Listen"
  },
  it: {
    title: "MOSTRA 2026",
    start: "Inizia",
    pay: "Pagamento",
    next: "Avanti",
    booth: "Pizza Italiana",
    listen: "Ascolta"
  },
  fr: {
    title: "EXPOSITION 2026",
    start: "Commencer",
    pay: "Paiement",
    next: "Suivant",
    booth: "Pizza Italienne",
    listen: "Écouter"
  },
  ru: {
    title: "ВЫСТАВКА 2026",
    start: "Начать",
    pay: "Оплата",
    next: "Далее",
    booth: "Итальянская пицца",
    listen: "Слушать"
  },
  cn: {
    title: "展览会 2026",
    start: "开始",
    pay: "支付",
    next: "继续",
    booth: "意大利披萨",
    listen: "播放"
  },
  kr: {
    title: "전시회 2026",
    start: "시작",
    pay: "결제",
    next: "다음",
    booth: "이탈리아 피자",
    listen: "듣기"
  },
  jp: {
    title: "展示会 2026",
    start: "開始",
    pay: "支払い",
    next: "次へ",
    booth: "イタリアンピザ",
    listen: "聞く"
  },
  th: {
    title: "นิทรรศการ 2026",
    start: "เริ่ม",
    pay: "ชำระเงิน",
    next: "ถัดไป",
    booth: "พิซซ่า",
    listen: "ฟัง"
  },
  kh: {
    title: "ពិព័រណ៍ 2026",
    start: "ចាប់ផ្តើម",
    pay: "បង់ប្រាក់",
    next: "បន្ត",
    booth: "ភីហ្សា",
    listen: "ស្តាប់"
  }
};


  const t = text[lang] || text.en;

  useEffect(() => {
  if (page === "location") {

    navigator.geolocation.getCurrentPosition((pos) => {

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // ✅ DANH SÁCH BOOTH (GIẢ LẬP)
      const booths = [
        { id: 1, lat: 10.7625, lng: 106.6602, name: "Pizza Ý" },
        { id: 2, lat: 10.7635, lng: 106.6610, name: "Phở Việt" },
        { id: 3, lat: 10.7615, lng: 106.6595, name: "Bún bò" }
      ];

      // ✅ TÌM BOOTH GẦN NHẤT
      let nearest = booths[0];
      let minDist = Math.abs(lat - nearest.lat) + Math.abs(lng - nearest.lng);

      booths.forEach((b) => {
        const dist = Math.abs(lat - b.lat) + Math.abs(lng - b.lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      });

      console.log("Booth gần nhất:", nearest.name);

      // ✅ HIỆN MAP THEO GPS
      const map = document.getElementById("map");
      if (map) {
        map.src =
          "https://maps.google.com/maps?q=" +
          lat +
          "," +
          lng +
          "&z=15&output=embed";
      }

      // ✅ HIỆN KHOẢNG CÁCH
      const distance = Math.round(minDist * 111000);
      alert("Booth gần nhất: " + nearest.name + "\nKhoảng cách: " + distance + " mét");

      // ✅ TỰ ĐỘNG CHUYỂN SAU 2 GIÂY
      setTimeout(() => {
        setPage("booth");
      }, 2000);

    });

  }
}, [page]);

  if (page === "landing") {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <h2>{t.title}</h2>
          <p>📍 TP.HCM</p>
          <p>📅 2026</p>

          <select
            value={lang}
            onChange={(e)=>{
             setLang(e.target.value);
             localStorage.setItem("lang", e.target.value);
           }}
          style={styles.select}
        >
            <option value="">Select</option>
            <option value="vi">🇻🇳 Việt</option>
            <option value="en">🇺🇸 English</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="cn">🇨🇳 中文</option>
            <option value="kr">🇰🇷 한국어</option>
            <option value="jp">🇯🇵 日本語</option>
            <option value="th">🇹🇭 ไทย</option>
            <option value="kh">🇰🇭 ខ្មែរ</option>
            </select>

          <button disabled={!lang} style={styles.btn} onClick={()=>setPage("payment")}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  if (page === "payment") {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <h2>{t.pay}</h2>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=payment"
            alt="QR"
          />

          <button style={styles.btn} onClick={()=>setPage("location")}>
            {t.next}
          </button>
        </div>
      </div>
    );
  }

  if (page === "location") {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <h2>
            📍 {lang === "vi" ? "Đang định vị..." : "Detecting location..."}
          </h2>

          <iframe
            id="map"
            width="100%"
            height="200"
            style={{ marginTop: 10 }}
          ></iframe>

          <button style={styles.btn} onClick={()=>setPage("booth")}>
            {t.next}
          </button>
        </div>
      </div>
    );
  }

  // Booth
  const speak = () => {
  const speech = new SpeechSynthesisUtterance(t.booth);

  const langMap = {
    vi: "vi-VN",
    en: "en-US",
    it: "it-IT",
    fr: "fr-FR",
    ru: "ru-RU",
    cn: "zh-CN",
    kr: "ko-KR",
    jp: "ja-JP",
    th: "th-TH",
    kh: "km-KH"
  };

  speech.lang = langMap[lang] || "en-US";
  speechSynthesis.speak(speech);
};

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h2>🍕 Booth</h2>
        <p>{t.booth}</p>

        <button style={styles.btn} onClick={speak}>
          🔊 {t.listen}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#4f46e5,#9333ea)"
  },
  card: {
    background: "white",
    padding: 30,
    borderRadius: 20,
    width: 300,
    textAlign: "center"
  },
  btn: {
    marginTop: 15,
    padding: 10,
    width: "100%"
  },
  select: {
    marginTop: 10,
    padding: 10,
    width: "100%"
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);