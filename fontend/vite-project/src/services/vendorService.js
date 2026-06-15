import axios from 'axios';

// Cấu hình đường dẫn gốc dẫn tới server Backend ASP.NET Core của nhóm ông
// (Ông có thể sửa lại cái port 5000/7000 này tùy theo cấu hình thực tế bên Backend nhé)
const BASE_URL = 'http://localhost:5000/api'; 

const vendorService = {
  
  getDashboardStats: async (vendorId) => {
    try {
      const response = await axios.get(`${BASE_URL}/vendor/dashboard/${vendorId}`);
      return response.data; 
    } catch (error) {
      console.error("Lỗi lấy dữ liệu Dashboard:", error);
      throw error;
    }
  },

 
  getNarrationDetails: async (boothId) => {
    try {
      const response = await axios.get(`${BASE_URL}/vendor/narrations/${boothId}`);
      return response.data; 
    } catch (error) {
      console.error("Lỗi lấy dữ liệu thuyết minh:", error);
      throw error;
    }
  },

  
  requestAiTranslation: async (boothId, title, content) => {
    try {
      const response = await axios.post(`${BASE_URL}/vendor/narrations/${boothId}/translate`, {
        title,
        content
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi kích hoạt Azure OpenAI:", error);
      throw error;
    }
  },

  
  getBoothMedia: async (boothId) => {
    try {
      const response = await axios.get(`${BASE_URL}/vendor/media/${boothId}`);
      return response.data; 
    } catch (error) {
      console.error("Lỗi lấy dữ liệu đa phương tiện:", error);
      throw error;
    }
  },

  uploadBoothImage: async (boothId, fileObj, caption) => {
    try {
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('caption', caption);

      const response = await axios.post(`${BASE_URL}/vendor/media/${boothId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi upload hình ảnh:", error);
      throw error;
    }
  },

  
  getAnalyticsStats: async (boothId, range) => {
    try {
      const response = await axios.get(`${BASE_URL}/vendor/stats/${boothId}?range=${range}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy dữ liệu thống kê:", error);
      throw error;
    }
  }
};

export default vendorService;