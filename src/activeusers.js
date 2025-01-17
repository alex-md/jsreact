export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const now = Date.now();
        const clientId = request.headers.get('CF-Connecting-IP') || 'anonymous';
        const minute = Math.floor(now / 60000);
        const userKey = `${clientId}-${minute}`;

        // Store this user's presence
        await env.ACTIVE_USERS.put(userKey, '1', {
            expirationTtl: 300 // 5 minutes
        });

        // Count unique users
        const { keys } = await env.ACTIVE_USERS.list();
        const uniqueUsers = new Set();
        const currentMinute = Math.floor(now / 60000);

        for (const key of keys) {
            const [ip, timestamp] = key.name.split('-');
            if (currentMinute - parseInt(timestamp) <= 5) {
                uniqueUsers.add(ip);
            }
        }

        return new Response(
            JSON.stringify({
                activeUsers: uniqueUsers.size,
                timestamp: now
            }),
            { headers: corsHeaders }
        );
    }
};
