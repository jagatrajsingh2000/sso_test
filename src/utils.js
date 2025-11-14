/**
 * SSO Utility Functions
 * Builds Ping SSO authorization URL
 */

const getSSOUrl = (redirectUri) => {
  const clientId = 'diatdevoauth';
  const authorizationEndpoint = 'https://pf.ping.aws.mdlz.com/as/authorization.oauth2';
  const responseType = 'code';
  const scope = 'openid profile email';
  const slash = redirectUri.indexOf("global") > -1 && !redirectUri?.includes("predev") ? "/" : ""; // TODO: work with the SSO team during the week of 24th June to remove "/"

  return `${authorizationEndpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}${slash}&scope=${scope}`;
};

export { getSSOUrl };

