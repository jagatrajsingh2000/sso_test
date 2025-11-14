/**
 * SSO Utility Functions
 * Builds Ping SSO authorization URL
 */

import { SSO_CONFIG } from './config.js';

const getSSOUrl = (redirectUri) => {
  const { clientId, authorizationEndpoint, responseType, scope } = SSO_CONFIG;
  const slash = redirectUri.indexOf("global") > -1 && !redirectUri?.includes("predev") ? "/" : ""; // TODO: work with the SSO team during the week of 24th June to remove "/"

  return `${authorizationEndpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}${slash}&scope=${scope}`;
};

export { getSSOUrl };

