import apiClient from "./apiClient";

const visitLogService = {
  log: (data) =>
    apiClient.post("/visitlogs", {
      boothId:      Number(data.boothId),
      languageCode: data.languageCode || "vi",
      deviceType:   data.deviceType   || "Mobile",
      durationSec:  data.durationSec  || 0,
    }),
};

export default visitLogService;
