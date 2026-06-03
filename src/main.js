import './style.css';

import { init as initState } from './state.js';
import { init as initFirebase } from './firebase.js';
import { init as initTheme } from './theme.js';
import { init as initAnimations } from './animations.js';
import { init as initRouter } from './router.js';
import { init as initAuth } from './auth.js';
import { init as initSearch } from './search.js';
import { init as initReviews } from './reviews.js';
import { init as initProducts } from './products.js';
import { init as initCart } from './cart.js';
import { init as initCoupons } from './coupons.js';
import { init as initBanners } from './banners.jsx';
import { init as initCheckout } from './checkout.js';
import { init as initAdmin } from './admin.js';

initState();
initFirebase();
initTheme();
initAnimations();
initRouter();
initAuth();
initSearch();
initReviews();
initProducts();
initCart();
initCoupons();
initBanners();
initCheckout();
initAdmin();

window.bootFromFirebase();
