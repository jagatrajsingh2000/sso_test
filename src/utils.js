/**
 * SSO Utility Functions
 * Builds Ping SSO authorization URL with hardcoded values
 */

// Hardcoded SSO configuration
const SSO_CLIENT_ID = 'your-client-id-here';
const SSO_AUTH_URL = 'https://your-ping-domain.com/as/authorization.oauth2';
const SSO_REDIRECT_URL = 'http://localhost:5173';

/**
 * Gets the SSO authorization URL for Ping Identity
 * @param {string} redirectUri - The redirect URI after authentication
 * @returns {string} The complete SSO authorization URL
 */
export const getSSOUrl = (redirectUri) => {
  // Use provided redirectUri or fall back to hardcoded default
  const finalRedirectUri = redirectUri || SSO_REDIRECT_URL;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SSO_CLIENT_ID,
    redirect_uri: finalRedirectUri,
    scope: 'openid profile email'
  });

  return `${SSO_AUTH_URL}?${params.toString()}`;
};

