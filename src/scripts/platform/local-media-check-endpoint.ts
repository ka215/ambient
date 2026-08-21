export function resolveAmbientEndpointFromHref(href: string, endpointName: string): string {
  const currentUrl = new URL(href);
  const pathname = currentUrl.pathname.replace(/\\/g, '/');
  const indexPath = pathname.toLowerCase().lastIndexOf('/index.php');
  const basePath = indexPath >= 0
    ? pathname.slice(0, indexPath + 1)
    : pathname.replace(/\/?$/, '/');
  const normalizedEndpoint = endpointName.replace(/^\/+/, '');

  return `${currentUrl.origin}${basePath}${normalizedEndpoint}`;
}

export function resolveLocalMediaCheckEndpointFromHref(href: string): string {
  return resolveAmbientEndpointFromHref(href, 'local-media-check');
}

export function resolveLocalMediaCheckEndpoint(): string {
  return resolveLocalMediaCheckEndpointFromHref(window.location.href);
}
