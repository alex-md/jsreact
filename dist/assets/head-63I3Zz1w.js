import"./footer-G77DEKXn.js";function S(o,a,y={}){if(typeof window>"u"||typeof document>"u")return console.error("createHead must be run in browser environment"),null;const t=document.getElementsByTagName("head")[0];if(!t)return console.error("Head element not found"),null;const{gaTrackingId:i="G-ZEFG04PXR7",baseUrl:c=window.location.origin,publishDate:f=new Date().toISOString().split("T")[0]}=y,s=e=>{try{return new URL(e,c).toString()}catch(n){return console.error(`Invalid URL construction: ${e}`,n),`${c}${e}`}};document.title=`${o} | JSreact`;const g=document.createElement("style");g.textContent=`
        .js-loading { opacity: 0; }
        .js-ready { opacity: 1; transition: opacity 0.3s; }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            opacity: 0;
            transition: opacity 0.3s;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
    `,t.insertBefore(g,t.firstChild),[{type:"link",rel:"manifest",href:"/manifest.json"},{type:"link",rel:"manifest",href:"/site.webmanifest"},{type:"link",rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",crossOrigin:"anonymous",referrerPolicy:"no-referrer"},{type:"link",rel:"preconnect",href:"https://fonts.googleapis.com"},{type:"link",rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}].forEach(e=>{const n=document.createElement(e.type);Object.entries(e).forEach(([r,d])=>{r!=="type"&&n.setAttribute(r,d)}),t.appendChild(n)});const l=document.createElement("link");l.rel="canonical",l.href=window.location.href.split("?")[0].split("#")[0],t.appendChild(l);const u=[{charset:"UTF-8"},{name:"viewport",content:"width=device-width, initial-scale=1.0"},{name:"description",content:a},{name:"theme-color",content:"#09090b"},{name:"robots",content:"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"},{name:"googlebot",content:"index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"},{name:"author",content:"JSreact"},{property:"og:type",content:"website"},{property:"og:title",content:`${o} | JSreact`},{property:"og:description",content:a},{property:"og:url",content:window.location.href},{property:"og:site_name",content:"JSreact"},{property:"og:image",content:s("/assets/images/og-image.png")},{property:"og:image:width",content:"1200"},{property:"og:image:height",content:"630"},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:title",content:`${o} | JSreact`},{name:"twitter:description",content:a},{name:"twitter:image",content:s("/assets/images/og-image.png")}];t.querySelectorAll("meta").forEach(e=>e.remove()),u.forEach(e=>{const n=document.createElement("meta");Object.entries(e).forEach(([r,d])=>n.setAttribute(r,d)),t.appendChild(n)});const p=document.createElement("link");if(p.rel="canonical",p.href=window.location.href,t.appendChild(p),i){const e=document.createElement("script");e.async=!0,e.src=`https://www.googletagmanager.com/gtag/js?id=${i}`,t.appendChild(e);const n=document.createElement("script");n.textContent=`
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', '${i}');
        `,t.appendChild(n)}const h={"@context":"https://schema.org","@type":"WebApplication",name:"JSreact",headline:o,description:a,url:window.location.href,applicationCategory:"DeveloperApplication",operatingSystem:"Any",author:{"@type":"Organization",name:"JSreact",url:c,logo:{"@type":"ImageObject",url:s("/assets/images/icon.png")}},datePublished:f,dateModified:new Date().toISOString()},m=document.createElement("script");return m.type="application/ld+json",m.textContent=JSON.stringify(h),t.appendChild(m),document.body.classList.add("js-ready"),{title:o,description:a}}export{S as c};
