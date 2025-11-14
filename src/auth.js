/**
 * Authentication Module
 * Handles SSO callback and displays whatever Ping returns
 */

import { jwtDecode } from 'jwt-decode';
import { getSSOUrl } from './utils.js';

// Hardcoded configuration
const TOKEN_KEY = 'auth_token';
const SSO_LOGOUT_URL = 'https://your-ping-domain.com/idp/startSSO.ping?PartnerSpId=your-sp-id';

/**
 * Initiates SSO login by redirecting to Ping Identity
 * @param {string} redirectUri - Optional redirect URI (defaults to current URL)
 */
export const initiateLogin = (redirectUri) => {
  const currentUrl = window.location.origin + window.location.pathname;
  const finalRedirectUri = redirectUri || currentUrl;
  
  const ssoUrl = getSSOUrl(finalRedirectUri);
  window.location.href = ssoUrl;
};

/**
 * Logs out the user by clearing the token
 * @param {boolean} redirectToSSO - Whether to redirect to Ping logout URL
 */
export const logout = (redirectToSSO = false) => {
  sessionStorage.removeItem(TOKEN_KEY);
  
  if (redirectToSSO) {
    window.location.href = SSO_LOGOUT_URL;
  }
};

/**
 * Retrieves the JWT token from sessionStorage or URL
 * @returns {string|null} The JWT token or null if not found
 */
export const getToken = () => {
  // First check sessionStorage
  const storedToken = sessionStorage.getItem(TOKEN_KEY);
  if (storedToken) return storedToken;

  // Check URL fragment (for implicit flow: #access_token=...)
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token') || params.get('id_token');
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      return token;
    }
  }

  // Check URL query params (for some flows: ?token=... or ?id_token=...)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || urlParams.get('id_token') || urlParams.get('access_token');
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    return token;
  }

  return null;
};

/**
 * Checks if user is currently authenticated
 * @returns {boolean} True if token exists and is valid
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      logout();
      return false;
    }
    return true;
  } catch (error) {
    // Invalid token
    logout();
    return false;
  }
};

/**
 * Decodes and retrieves all information from JWT
 * Returns the complete decoded JWT payload
 * @returns {Object|null} Complete decoded JWT payload or null if not authenticated
 */
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Handles SSO callback from URL parameters
 * Extracts token from URL and stores it
 * @returns {Object|null} User info or null if no token found
 */
export const handleSSOCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const hash = window.location.hash;

  if (error) {
    console.error('SSO error:', error);
    throw new Error(`SSO authentication error: ${error}`);
  }

  // Try to get token from URL
  const token = getToken();
  
  if (token) {
    // Clean up URL by removing token parameters
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    return getUserInfo();
  }

  return null;
};

