// activeusers.js
var activeusers_default = {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const now = new Date();
    const clientId = request.headers.get("CF-Connecting-IP") || "anonymous";
    const minute = Math.floor(now.getTime() / 6e4);
    const userKey = `${clientId}-${minute}`;

    // Store this user's presence
    const randomTtl = Math.floor(Math.random() * (300 - 60 + 1)) + 60; // Between 1 and 5 minutes
    await env.ACTIVE_USERS.put(userKey, "1", {
      expirationTtl: randomTtl
    });

    const { keys } = await env.ACTIVE_USERS.list();
    const uniqueUsers = new Set();
    const currentMinute = Math.floor(now.getTime() / 6e4);

    // Time-based user adjustment
    const hour = now.getHours();
    let maxUsers;
    if (hour >= 6 && hour < 12) {
      maxUsers = 30; // Morning peak
    } else if (hour >= 12 && hour < 18) {
      maxUsers = 44; // Afternoon peak
    } else if (hour >= 18 && hour < 22) {
      maxUsers = 38; // Evening activity
    } else {
      maxUsers = 20; // Nighttime lull
    }
    const minUsers = 3;

    // Collect active users and adjust gradually
    for (const key of keys) {
      const [ip, timestamp] = key.name.split("-");
      if (currentMinute - parseInt(timestamp) <= 5) {
        uniqueUsers.add(ip);
      }
    }

    let simulatedUsers = uniqueUsers.size;
    simulatedUsers = Math.min(simulatedUsers + Math.floor(Math.random() * 3), maxUsers); // Gradual increase
    simulatedUsers = Math.max(simulatedUsers - Math.floor(Math.random() * 2), minUsers); // Gradual decrease

    return new Response(
      JSON.stringify({
        activeUsers: simulatedUsers,
        timestamp: now.getTime()
      }),
      { headers: corsHeaders }
    );
  }
};

export {
  activeusers_default as default
};
//# sourceMappingURL=activeusers.js.map
