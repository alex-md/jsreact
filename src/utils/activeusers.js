export async function getActiveUsers() {
  try {
    let response = await fetch("https://activeusers.vs.workers.dev/", {
      headers: { "Cache-Control": "no-cache" },
      mode: "cors"
    });
    if (!response.ok) throw Error(`HTTP error! status: ${response.status}`);
    let data = await response.json();
    return 0 === data.activeUsers ? "0" : data.activeUsers || "Unavailable";
  } catch (error) {
    return console.error("Error fetching active users:", error), "0";
  }
}
