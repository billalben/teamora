export function getWorkspaceSwitchHref(orgCode: string) {
  const params = new URLSearchParams({
    org_code: orgCode,
    post_login_redirect_url: `/workspace/${orgCode}`,
  });

  return `/api/auth/login?${params.toString()}`;
}
