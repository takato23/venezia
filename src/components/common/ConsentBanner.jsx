import React, { useEffect, useState } from 'react';

/**
 * ConsentBanner
 * - Minimal GDPR-style consent for analytics cookies.
 * - Stores "venezia_consent" in localStorage as "granted" or "denied".
 * - Hidden once a choice is made.
 * - Non-blocking UI, positioned bottom.
 */
const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('venezia_consent');
      if (!v) setVisible(true);
    } catch {
      // If storage not available, keep hidden to avoid UX breakage
      setVisible(false);
    }
  }, []);

  const decide = (value) => {
    try {
      localStorage.setItem('venezia_consent', value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] md:w-[640px] bg-white shadow-2xl border border-gray-200 rounded-2xl p-4 md:p-5"
      style={{ backdropFilter: 'saturate(180%) blur(8px)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-gray-800">
            Cookies de análisis
          </h3>
          <p className="mt-1 text-xs md:text-sm text-gray-600">
            Usamos cookies para medir el uso del sitio y mejorar la experiencia. Puedes aceptar o rechazar estas cookies en cualquier momento.
          </p>
        </div>
      </div>

      <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          onClick={() => decide('denied')}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Rechazar
        </button>
        <button
          onClick={() => decide('granted')}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-95"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;