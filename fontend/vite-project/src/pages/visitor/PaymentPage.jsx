import { useNavigate } from "react-router-dom";

export default function PaymentPage() {

  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      
      <h2>Payment</h2>

      {/* ✅ ĐÚNG: phải là img */}
      <img 
        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=payment"
        alt="QR"
      />

      <br /><br />

      <button onClick={() => navigate("/location")}>
        NEXT
      </button>

    </div>
  );
}