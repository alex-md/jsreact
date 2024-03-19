// JavaScript

import createFooterAndFetchViewCount from './components/footer.js';
import { createNavbar } from './components/navbar.js';

document.addEventListener("DOMContentLoaded", function () {
    const navbar = createNavbar();
    document.body.insertAdjacentElement('afterbegin', navbar);
});
createFooterAndFetchViewCount();
