export function resolveLocalMediaCheckEndpointFromHref(href: string): string {
  const currentUrl = new URL(href);
  const pathname = currentUrl.pathname.replace(/\\/g, '/');
  const indexPath = pathname.toLowerCase().lastIndexOf('/index.php');
  const basePath = indexPath >= 0
    ? pathname.slice(0, indexPath + 1)
    : pathname.replace(/\/?$/, '/');

  return `${currentUrl.origin}${basePath}local-media-check`;
}

export function resolveLocalMediaCheckEndpoint(): string {
  return resolveLocalMediaCheckEndpointFromHref(window.location.href);
}
