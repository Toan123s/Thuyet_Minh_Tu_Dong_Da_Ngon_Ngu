export function getEvent(id) {
  console.log("GET /api/events/" + id);

  return {
    name: "Tech Expo 2026",
    location: "TP.HCM",
    date: "2026"
  };
}

export function getNearestBooth() {
  console.log("POST /api/booths/nearest");
  return 1;
}