import api from "./apiClient";

const eventScanService = {
    log: async (eventId, deviceType) => {
        console.log("QR Scan:", eventId, deviceType);

        // Backend chưa có API
        return Promise.resolve({
            success: true
        });
    }
};

export default eventScanService;