/**
 * Authentication Module
 * Handles SSO callback, token management, and user role checking
 */

import { jwtDecode } from 'jwt-decode';
import { getSSOUrl } from './utils.js';

// Hardcoded configuration
const TOKEN_KEY = 'auth_token';
const BACKEND_BASE_URL = 'http://localhost:8000'; // Change this to your backend URL
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
 * Handles SSO callback and exchanges authorization code for JWT
 * @param {string} code - Authorization code from SSO callback
 * @returns {Promise<Object>} Response from backend with JWT token
 */
export const login = async (code) => {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  const callbackUrl = `${BACKEND_BASE_URL}/v1/auth/callback/?code=${encodeURIComponent(code)}`;
  
  try {
    const response = await fetch(callbackUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store JWT token in sessionStorage
    if (data.token || data.access_token || data.jwt) {
      const token = data.token || data.access_token || data.jwt;
      sessionStorage.setItem(TOKEN_KEY, token);
      return data;
    } else {
      throw new Error('No token received from backend');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
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
 * Retrieves the JWT token from sessionStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
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
 * Decodes and retrieves user information from JWT
 * @returns {Object|null} User info object with name, email, memberOf, or null if not authenticated
 */
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return {
      name: decoded.name || decoded.preferred_username || decoded.sub,
      email: decoded.email,
      memberOf: decoded.memberOf || decoded.groups || [],
      sub: decoded.sub,
      ...decoded
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Checks if user belongs to a specific AD group/role
 * @param {string} roleName - The role/group name to check
 * @returns {boolean} True if user has the role
 */
export const hasRole = (roleName) => {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.memberOf) return false;

  // Handle both array and string formats
  const memberOf = Array.isArray(userInfo.memberOf) 
    ? userInfo.memberOf 
    : [userInfo.memberOf];

  return memberOf.some(role => 
    role.toLowerCase() === roleName.toLowerCase() ||
    role.toLowerCase().includes(roleName.toLowerCase())
  );
};

/**
 * Checks if user is an admin
 * @returns {boolean} True if user has admin role
 */
export const isAdmin = () => {
  return hasRole('admin') || hasRole('administrator');
};

/**
 * Checks if user is an uploader
 * @returns {boolean} True if user has uploader role
 */
export const isUploader = () => {
  return hasRole('uploader') || hasRole('upload');
};

/**
 * Checks if user is a viewer
 * @returns {boolean} True if user has viewer role
 */
export const isViewer = () => {
  return hasRole('viewer') || hasRole('view') || hasRole('read');
};

/**
 * Handles SSO callback from URL parameters
 * Extracts code from URL and calls login
 * @returns {Promise<Object|null>} Login result or null if no code found
 */
export const handleSSOCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    console.error('SSO error:', error);
    throw new Error(`SSO authentication error: ${error}`);
  }

  if (code) {
    try {
      const result = await login(code);
      // Clean up URL by removing code parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return result;
    } catch (error) {
      console.error('Callback login error:', error);
      throw error;
    }
  }

  return null;
};

