export function getWorkspaceSwitchHref(orgCode: string) {
  const params = new URLSearchParams({
    org_code: orgCode,
    post_login_redirect_url: `/workspace/${orgCode}`,
  });

  return `/api/auth/login?${params.toString()}`;
}

/**
 * Where to send a user after they leave (or are removed from) a workspace.
 * Prefer switching straight to another workspace they still belong to. When
 * none remain, force a fresh Kinde session so the stale `org_code` is dropped
 * from the token before landing on the workspace picker.
 */
export function getWorkspaceDepartureHref({
  leftOrgCode,
  remainingOrgCodes,
}: {
  leftOrgCode: string;
  remainingOrgCodes: string[];
}) {
  const nextOrgCode = remainingOrgCodes.find((orgCode) => orgCode !== leftOrgCode);

  if (nextOrgCode) {
    return getWorkspaceSwitchHref(nextOrgCode);
  }

  const loginHref = `/api/auth/login?post_login_redirect_url=${encodeURIComponent("/workspace")}`;

  return `/api/auth/logout?post_logout_redirect_url=${encodeURIComponent(loginHref)}`;
}
