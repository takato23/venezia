/**
 * Lightweight GA4 wrapper with consent gating.
 * - No-ops when GA ID is missing or gtag is not loaded.
 * - Respects localStorage consent "venezia_consent" === "granted".
 */
export const Analytics = (() => {
  const GA_ID = (typeof window !== 'undefined' && window.ENV && window.ENV.GA_MEASUREMENT_ID) || process.env.GA_MEASUREMENT_ID || '';
  const hasConsent = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem('venezia_consent') === 'granted';
    } catch {
      return false;
    }
  };
  const canSend = () => typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_ID && hasConsent();

  const gtagSafe = (...args) => {
    if (!canSend()) return;
    window.gtag(...args);
  };

  const init = () => {
    // Intentionally no script injection here; wrapper is safe even if GA is absent.
    // If later we want to auto-inject, do it behind a feature flag and respecting consent.
  };

  const pageView = (path, title) => {
    gtagSafe('event', 'page_view', {
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      page_title: title || document?.title
    });
  };

  const addToCart = ({ item_id, item_name, price, quantity, currency = 'ARS' }) => {
    gtagSafe('event', 'add_to_cart', {
      currency,
      value: (price || 0) * (quantity || 1),
      items: [{ item_id, item_name, price, quantity }]
    });
  };

  const beginCheckout = ({ value, currency = 'ARS', items = [] }) => {
    gtagSafe('event', 'begin_checkout', { currency, value, items });
  };

  const purchase = ({ transaction_id, value, shipping = 0, tax = 0, currency = 'ARS', items = [] }) => {
    gtagSafe('event', 'purchase', { transaction_id, value, shipping, tax, currency, items });
  };

  return { init, pageView, addToCart, beginCheckout, purchase, hasConsent };
})();