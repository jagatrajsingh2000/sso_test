/**
 * Configuration File
 * Centralized location for all hardcoded variables and environment variables
 */

// SSO Configuration
export const SSO_CONFIG = {
  clientId: 'diatdevoauth',
  authorizationEndpoint: 'https://pf.ping.aws.mdlzz.com/as/authorization.oauth2',
  responseType: 'code',
  scope: 'openid profile email',
  logoutUrl: 'https://your-ping-domain.com/idp/startSSO.ping?PartnerSpId=your-sp-id',
  redirectUrl: 'http://localhost:3000',
};

// Application Configuration
export const APP_CONFIG = {
  tokenKey: 'token',
  testTokenKey: 'test_token',
};

