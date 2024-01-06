(function () {
    // This function will be called when the script loads
    function initAnalytics () {
        // Make a request to your Cloudflare Worker
        fetch('https://ga.vs.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Send any data you need
                path: window.location.pathname,
                userAgent: navigator.userAgent,
            }),
        });
    }

    // Call the function
    initAnalytics();
})();
