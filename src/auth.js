/**
 * Authentication Module
 * Sample test implementation based on reference structure
 */

import { jwtDecode } from 'jwt-decode';
import { getSSOUrl } from './utils.js';

// Hardcoded configuration
const SSO_LOGOUT_URL = 'https://your-ping-domain.com/idp/startSSO.ping?PartnerSpId=your-sp-id';
const LOCALHOST_ACTION = true; // For testing on localhost

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

  // If code is provided but no token in URL, simulate token extraction
  // (In real implementation, this would call backend: /v1/auth/callback/?code=${code})
  if (code && !access_token) {
    // For sample test: you can manually set a test token here
    // In production, this would be: const response = await apiAxios.get(`/v1/auth/callback/?code=${code}`);
    console.warn('Code provided but no token in URL. For sample test, token should be in URL.');
  }

  if (access_token) {
    sessionStorage.setItem('token', access_token);
    // Clean up URL
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
  sessionStorage.removeItem('token');
};

/**
 * Retrieves the JWT token from sessionStorage
 * @returns {string|null} The JWT token or null if not found
 */
const getToken = () => {
  return sessionStorage.getItem('token');
};

/**
 * Decodes and retrieves user information from JWT
 * @returns {Object} User info object with name, displayName, email, memberOf, exp, or empty object if not authenticated
 */
const getUserInfo = () => {
  const token = sessionStorage.getItem('token');
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
 * Checks if user is an admin based on memberOf groups and hostname
 * @param {Array} memberOf - Array of groups the user belongs to
 * @returns {boolean} True if user is admin
 */
const isAdmin = (memberOf) => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost') {
    return LOCALHOST_ACTION;
  }

  memberOf = memberOf || [];

  if (hostname.indexOf('global') > -1) {
    return memberOf.indexOf('mdz-diat-admin-glbl-grp') > -1 || memberOf.indexOf('mdz-diat-admin-amer-grp') > -1;
  }

  if (hostname.indexOf('amea') > -1) {
    return memberOf.indexOf('mdz-diat-admin-amea-grp') > -1;
  }

  if (hostname.indexOf('meu') > -1) {
    return memberOf.indexOf('mdz-diat-admin-meu-grp') > -1;
  }

  return false;
};

/**
 * Checks if user is a developer
 * @param {Array} memberOf - Array of groups the user belongs to
 * @returns {boolean} True if user is developer or admin
 */
const isDeveloper = (memberOf) => {
  const isAnAdmin = isAdmin(memberOf);
  if (isAnAdmin) {
    return isAnAdmin;
  }

  const hostname = window.location.hostname;
  
  if (hostname === 'localhost') {
    return LOCALHOST_ACTION;
  }

  memberOf = memberOf || [];

  if (hostname.indexOf('global') > -1) {
    return memberOf.indexOf('mdz-diat-dev-glbl-grp') > -1 || memberOf.indexOf('mdz-diat-dev-amer-grp') > -1;
  }

  if (hostname.indexOf('amea') > -1) {
    return memberOf.indexOf('mdz-diat-dev-amea-grp') > -1;
  }

  if (hostname.indexOf('meu') > -1) {
    return memberOf.indexOf('mdz-diat-dev-meu-grp') > -1;
  }

  return false;
};

/**
 * Checks if user is a project member
 * @param {Array} memberOf - Array of groups the user belongs to
 * @returns {boolean} True if user is project member, developer, or admin
 */
const isProjectMember = (memberOf) => {
  const isADeveloper = isDeveloper(memberOf);
  if (isADeveloper) {
    return isADeveloper;
  }

  const hostname = window.location.hostname;
  
  if (hostname === 'localhost') {
    return LOCALHOST_ACTION;
  }

  memberOf = memberOf || [];

  if (hostname.indexOf('global') > -1) {
    return memberOf.indexOf('mdz-diat-prj-glbl-grp') > -1 || memberOf.indexOf('mdz-diat-prj-amer-grp') > -1;
  }

  if (hostname.indexOf('amea') > -1) {
    return memberOf.indexOf('mdz-diat-prj-amea-grp') > -1;
  }

  if (hostname.indexOf('meu') > -1) {
    return memberOf.indexOf('mdz-diat-prj-meu-grp') > -1;
  }

  return false;
};

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

export { login, logout, getToken, getUserInfo, isAdmin, isDeveloper, isProjectMember };

