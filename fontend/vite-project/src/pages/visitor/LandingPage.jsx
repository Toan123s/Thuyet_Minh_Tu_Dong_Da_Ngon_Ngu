export default function LandingPage({ setPage, lang, setLang }) {

  const text = {
    vi: {
      title: "TRIỂN LÃM 2026",
      start: "Bắt đầu"
    },
    en: {
      title: "EXHIBITION 2026",
      start: "Start"
    }
  };

  const t = text[lang] || text.en;

  return (
    <div>
      <h2>{t.title}</h2>

      <select value={lang} onChange={(e)=>setLang(e.target.value)}>
        <option value="">Select</option>
        <option value="vi">Việt</option>
        <option value="en">English</option>
      </select>

      <button onClick={()=>setPage("payment")}>
        {t.start}
      </button>
    </div>
  );
}