import { DefaultLayout } from '@layouts/DefaultLayout';

export function PolicyPage() {
    return DefaultLayout({
        title: 'Privacy Policy',
        description: 'JSreact Privacy Policy and Terms of Service',
        children: `
            <div class="prose dark:prose-invert max-w-none">
                <h1>Privacy Policy</h1>
                <p>Last updated: February 2024</p>
                
                <h2>Information Collection</h2>
                <p>We collect minimal usage analytics to improve our services.</p>
                
                <h2>Data Usage</h2>
                <p>Any data entered in our tools is processed client-side and not stored.</p>
                
                <h2>Cookies</h2>
                <p>We use essential cookies for site functionality.</p>
            </div>
        `
    });
}
