import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ⚠ Mặc định Vite chỉ lắng nghe "localhost" — điện thoại quét QR
    // trong cùng mạng WiFi sẽ KHÔNG kết nối được. host:true cho phép
    // các máy khác trong mạng LAN truy cập qua địa chỉ IP của máy này
    // (vd http://192.168.1.x:5173).
    host: true,
  },
})
