export const featureFlags = {
  miniCart: true,
  freeShippingProgress: true,
  trustBar: true,
  consentBanner: true,
  analytics: true,
};

export function isFeatureEnabled(flag) {
  return !!featureFlags[flag];
}