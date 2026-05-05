<?php
/**
 * PHP built-in server router for E2E testing.
 *
 * Serves static files (JS, CSS, images, etc.) directly.
 * Routes all other requests to index.php (the app entry point).
 */
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$staticFile  = __DIR__ . $requestPath;

if ($requestPath !== '/' && file_exists($staticFile) && !is_dir($staticFile)) {
    // Let the built-in server handle static files directly.
    return false;
}

require __DIR__ . '/index.php';
