import React from 'react';
import { Analytics } from '../../utils/analytics';

/**
 * Higher-order component to gate children rendering behind consent.
 * If no consent is granted, it renders null by default.
 * Optionally accepts a fallback.
 */
const withConsentGate = (Component, Fallback = null) => {
  const Wrapped = (props) => {
    try {
      if (Analytics.hasConsent()) return <Component {...props} />;
      return Fallback;
    } catch {
      return Fallback;
    }
  };
  Wrapped.displayName = `WithConsentGate(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};

export default withConsentGate;