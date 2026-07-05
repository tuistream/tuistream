import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

// Inertia CSRF: also read token from meta tag and set as X-CSRF-TOKEN header
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
} else {
    // If meta tag not present yet, try to get from cookie (Laravel encrypts XSRF-TOKEN)
    const xsrfCookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
        const token = decodeURIComponent(xsrfCookie.split('=')[1]);
        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
    }
}
