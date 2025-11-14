/**
 * Authentication Module
 * Sample test implementation based on reference structure
 */

import { jwtDecode } from 'jwt-decode';
import { getSSOUrl } from './utils.js';
import { SSO_CONFIG, APP_CONFIG } from './config.js';

/**
 * Login function - extracts token from URL (no backend call for sample test)
 * @param {string} code - Authorization code from SSO callback (optional, will extract from URL if not provided)
 * @returns {Promise<string>} The access token
 */
const login = async (code) => {
  // For sample test: extract token directly from URL instead of calling backend
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  let access_token = null;

  // Check URL fragment (for implicit flow: #access_token=...)
  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    access_token = hashParams.get('access_token') || hashParams.get('id_token');
  }

  // Check URL query params
  if (!access_token) {
    access_token = urlParams.get('access_token') || urlParams.get('id_token') || urlParams.get('token');
  }

  // If code is provided but no token in URL
  // For testing: Check if there's a test token in localStorage or URL param
  if (code && !access_token) {
    // Check for test token in localStorage (for manual testing)
    const testToken = localStorage.getItem(APP_CONFIG.testTokenKey);
    if (testToken) {
      access_token = testToken;
      console.log('Using test token from localStorage');
    } else {
      // Check URL for test token parameter
      const testTokenParam = urlParams.get('test_token');
      if (testTokenParam) {
        access_token = testTokenParam;
        localStorage.setItem(APP_CONFIG.testTokenKey, testTokenParam);
        console.log('Using test token from URL parameter');
      } else {
        console.warn('Authorization code received but no token found. For testing:');
        console.warn('1. Add ?test_token=YOUR_JWT_TOKEN to the URL, or');
        console.warn(`2. Set localStorage.setItem("${APP_CONFIG.testTokenKey}", "YOUR_JWT_TOKEN") in browser console`);
        throw new Error('No access token found. Ping returned authorization code which requires backend exchange. For testing, provide a test token.');
      }
    }
  }

  if (access_token) {
    sessionStorage.setItem(APP_CONFIG.tokenKey, access_token);
    // Clean up URL (remove test_token if present)
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    return access_token;
  }

  throw new Error('No access token found in URL');
};

/**
 * Logs out the user by clearing the token
 */
const logout = () => {
  sessionStorage.removeItem(APP_CONFIG.tokenKey);
};

/**
 * Retrieves the JWT token from sessionStorage
 * @returns {string|null} The JWT token or null if not found
 */
const getToken = () => {
  return sessionStorage.getItem(APP_CONFIG.tokenKey);
};

/**
 * Decodes and retrieves user information from JWT
 * @returns {Object} User info object with name, displayName, email, memberOf, exp, or empty object if not authenticated
 */
const getUserInfo = () => {
  const token = sessionStorage.getItem(APP_CONFIG.tokenKey);
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      return {
        name: decodedToken.name,
        displayName: decodedToken.displayName,
        email: decodedToken.email,
        memberOf: decodedToken.memberOf,
        exp: decodedToken.exp,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  return {};
};


/**
 * Initiates SSO login by redirecting to Ping Identity
 * @param {string} redirectUri - Optional redirect URI (defaults to current URL)
 */
export const initiateLogin = (redirectUri) => {
  const currentUrl = window.location.origin + window.location.pathname;
  const finalRedirectUri = redirectUri || SSO_CONFIG.redirectUrl || currentUrl;
  
  const ssoUrl = getSSOUrl(finalRedirectUri);
  window.location.href = ssoUrl;
};

/**
 * Gets the authorization code from URL if present
 * @returns {string|null} The authorization code or null
 */
export const getAuthorizationCode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

/**
 * Handles SSO callback from URL parameters
 * Extracts code/token from URL and calls login
 * @returns {Promise<Object>} User info or null if no token found
 */
export const handleSSOCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    console.error('SSO error:', error);
    throw new Error(`SSO authentication error: ${error}`);
  }

  try {
    await login(code);
    return getUserInfo();
  } catch (err) {
    console.error('Login error:', err);
    // Return code info even if login fails
    if (code) {
      return { code, error: err.message };
    }
    return null;
  }
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

export { login, logout, getToken, getUserInfo };

