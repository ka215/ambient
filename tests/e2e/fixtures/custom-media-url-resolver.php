<?php
declare(strict_types=1);

/**
 * E2E-only fixture for the localMediaUrl.beforeCheck hook.
 *
 * The resolver intentionally avoids outbound network access. It accepts a fixed
 * HTML page URL and extracts an extensionless media URL from embedded markup.
 */

const AMBIENT_E2E_HTML_PAGE_URL = 'https://ambient-e2e.invalid/page-with-extensionless-media';
const AMBIENT_E2E_MEDIA_URL = 'https://media.example.test/stream/e2e-local-media?asset=video';

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

$pageUrl = trim((string) ($_GET['url'] ?? ''));
if ($pageUrl !== AMBIENT_E2E_HTML_PAGE_URL) {
    respond_json(false, '', 'Unexpected E2E fixture URL.', 400);
}

$mediaUrl = extract_media_url(e2e_fixture_html(), $pageUrl);
if ($mediaUrl === '') {
    respond_json(false, '', 'No media URL was found in the E2E fixture HTML.', 404);
}

respond_json(true, $mediaUrl, 'E2E media URL resolved.');

function respond_json(bool $ok, string $mediaUrl, string $message, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode(
        [
            'ok' => $ok,
            'mediaUrl' => $mediaUrl,
            'message' => $message,
        ],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    exit;
}

function e2e_fixture_html(): string
{
    return '<!doctype html><html><head>'
        . '<meta property="og:video" content="' . htmlspecialchars(AMBIENT_E2E_MEDIA_URL, ENT_QUOTES, 'UTF-8') . '">'
        . '</head><body><video controls><source src="' . htmlspecialchars(AMBIENT_E2E_MEDIA_URL, ENT_QUOTES, 'UTF-8') . '"></video></body></html>';
}

function extract_media_url(string $html, string $baseUrl): string
{
    $previous = libxml_use_internal_errors(true);
    $document = new DOMDocument();
    $loaded = $document->loadHTML($html);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if (!$loaded) {
        return '';
    }

    $xpath = new DOMXPath($document);
    $queries = [
        '//meta[translate(@property, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="og:video"]/@content',
        '//video/@src',
        '//source/@src',
        '//a/@href',
    ];

    foreach ($queries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList) {
            continue;
        }

        foreach ($nodes as $node) {
            $candidate = resolve_url(trim((string) $node->nodeValue), $baseUrl);
            if ($candidate !== '' && is_http_url($candidate)) {
                return $candidate;
            }
        }
    }

    return '';
}

function is_http_url(string $url): bool
{
    $scheme = strtolower((string) (parse_url($url, PHP_URL_SCHEME) ?? ''));
    return $scheme === 'http' || $scheme === 'https';
}

function resolve_url(string $url, string $baseUrl): string
{
    if ($url === '' || str_starts_with($url, 'data:') || str_starts_with($url, 'blob:')) {
        return '';
    }
    if (parse_url($url, PHP_URL_SCHEME) !== null) {
        return $url;
    }
    if (str_starts_with($url, '//')) {
        $scheme = (string) parse_url($baseUrl, PHP_URL_SCHEME);
        return ($scheme !== '' ? $scheme : 'https') . ':' . $url;
    }

    $base = parse_url($baseUrl);
    if (!is_array($base) || empty($base['scheme']) || empty($base['host'])) {
        return '';
    }

    $authority = $base['scheme'] . '://' . $base['host'] . (isset($base['port']) ? ':' . $base['port'] : '');
    if (str_starts_with($url, '/')) {
        return $authority . $url;
    }

    $basePath = isset($base['path']) ? preg_replace('#/[^/]*$#', '/', $base['path']) : '/';
    return $authority . $basePath . $url;
}
