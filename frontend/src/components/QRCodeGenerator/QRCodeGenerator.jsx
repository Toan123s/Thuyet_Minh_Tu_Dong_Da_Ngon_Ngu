import { useEffect, useRef, useState } from "react";
import "./QRCodeGenerator.css";

/**
 * Dùng thư viện qrcode (npm i qrcode) để generate QR client-side.
 * Không cần gọi API backend cho việc hiển thị — chỉ gọi API khi cần URL chính thức.
 *
 * Props:
 *  - boothId  : string | number
 *  - boothName: string
 *  - url      : string  — URL sẽ encode vào QR (VD: https://app.xyz/?booth=B001)
 */
export default function QRCodeGenerator({ boothId, boothName, url }) {
  const canvasRef = useRef(null);
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate QR lên canvas
  useEffect(() => {
    if (!url || !canvasRef.current) return;
    setLoading(true);

    // Lazy-load qrcode library
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      }, (err) => {
        if (!err) setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, [url]);

  // Tải PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Upscale lên 1024x1024
    const hi = document.createElement("canvas");
    hi.width = hi.height = 1024;
    const ctx = hi.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, 1024, 1024);

    const link = document.createElement("a");
    link.download = `QR_${boothName || boothId}.png`;
    link.href = hi.toDataURL("image/png");
    link.click();
  };

  // Copy URL
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  // In QR
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>QR – ${boothName}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center;
               justify-content:center; min-height:100vh; font-family:sans-serif; }
        img  { width:320px; height:320px; }
        p    { margin-top:16px; font-size:14px; color:#374151; }
      </style></head>
      <body>
        <img src="${img}" />
        <p>${boothName || boothId}</p>
        <p style="font-size:12px;color:#9ca3af;">${url}</p>
        <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
  };

  return (
    <div className="qrgen">
      <div className="qrgen__card">
        {loading && <div className="qrgen__loader" />}
        <canvas
          ref={canvasRef}
          className="qrgen__canvas"
          style={{ opacity: loading ? 0 : 1 }}
        />
        <p className="qrgen__booth-name">{boothName}</p>
      </div>

      <div className="qrgen__url-box">
        <span className="qrgen__url-label">URL:</span>
        <span className="qrgen__url-text">{url}</span>
      </div>

      <div className="qrgen__actions">
        <button className="qrgen-btn qrgen-btn--primary" onClick={handleDownload}>
          📥 Tải PNG
        </button>
        <button
          className={`qrgen-btn qrgen-btn--outline ${copied ? "qrgen-btn--copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? "✅ Đã copy" : "📋 Copy URL"}
        </button>
        <button className="qrgen-btn qrgen-btn--ghost" onClick={handlePrint}>
          🖨 In QR
        </button>
      </div>
    </div>
  );
}