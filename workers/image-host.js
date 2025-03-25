export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);

            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }

            // Handle image upload
            if (request.method === 'POST' && url.pathname === '/upload') {
                const formData = await request.formData();
                const file = formData.get('file');

                if (!file) {
                    return new Response('No file provided', { status: 400 });
                }

                // Generate unique ID for the image
                const uniqueId = crypto.randomUUID();
                const extension = file.type.split('/')[1];
                const key = `${uniqueId}.${extension}`;

                // Store the file in KV
                await env.IMAGES.put(key, file.stream(), {
                    metadata: {
                        contentType: file.type,
                        uploaded: new Date().toISOString()
                    }
                });

                // Return the public URL
                return new Response(
                    JSON.stringify({
                        url: `${url.origin}/image/${key}`
                    }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                );
            }

            // Handle image retrieval
            if (request.method === 'GET' && url.pathname.startsWith('/image/')) {
                const key = url.pathname.replace('/image/', '');
                const image = await env.IMAGES.get(key, { type: 'stream' });

                if (!image) {
                    return new Response('Image not found', { status: 404 });
                }

                const metadata = await env.IMAGES.getWithMetadata(key);

                return new Response(image, {
                    headers: {
                        'Content-Type': metadata.metadata.contentType,
                        'Cache-Control': 'public, max-age=31536000',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            return new Response('Not found', { status: 404 });
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Internal error', { status: 500 });
        }
    }
};
