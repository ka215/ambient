<?php
// Functions for template of YouTube Player

function amp_set_var( string $var_name, mixed $value ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->set_property( $var_name, $value );
    }
}

/**
 * Minify inline asset content for styles and scripts.
 *
 * @param string $content Raw inline content.
 * @param string $type Asset type ('styles' or 'inline_scripts').
 * @return string
 */
function amp_minify_inline_asset_content( string $content, string $type ): string {
    if ( $type === 'styles' ) {
        $content = preg_replace( '#/\*[\s\S]*?\*/#', '', $content ) ?? $content;
        $content = preg_replace( '/\s+/', ' ', $content ) ?? $content;
        $content = preg_replace( '/\s*([{}:;,>])\s*/', '$1', $content ) ?? $content;
        return trim( $content );
    }

    if ( $type === 'inline_scripts' ) {
        $content = preg_replace( '#/\*[\s\S]*?\*/#', '', $content ) ?? $content;

        $lines = preg_split( '/\R/', $content ) ?: [];
        foreach ( $lines as &$line ) {
            if ( preg_match( '/^\s*\/\//', $line ) ) {
                $line = '';
                continue;
            }
            $line = preg_replace( '/(^|[;{}(),\s])\/\/[^\r\n]*/', '$1', $line ) ?? $line;
        }
        unset( $line );

        $content = implode( ' ', $lines );
        $content = preg_replace( '/\s+/', ' ', $content ) ?? $content;
        return trim( $content );
    }

    return $content;
}

/**
 * Add custom JavaScript to the footer.
 * @param string $content The JavaScript code to add.
 * @param string $type The type of the script (e.g., 'scripts' or 'inline_scripts'). Default is 'scripts'.
 * @param bool $minify Minify inline script/style content when true.
 * @since v2.2.3
 */
function amp_add_footer_script( string $content, string $type = 'scripts', bool $minify = false ): void {
    if ( $minify && in_array( $type, [ 'inline_scripts', 'styles' ], true ) ) {
        $content = amp_minify_inline_asset_content( $content, $type );
    }

    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->enqueue_asset( 'footer', $type, $content );
    }
}

/**
 * Add custom content to the head.
 * @param string $html The HTML code to add to the head.
 * @param string $type The type of the head asset (e.g., 'meta', 'scripts', 'inline_scripts', or 'styles'). Default is 'meta'.
 * @param bool $minify Minify inline script/style content when true.
 * @since v2.2.3
 */
function amp_add_head_content( string $html, string $type = 'meta', bool $minify = false ): void {
    if ( $minify && in_array( $type, [ 'inline_scripts', 'styles' ], true ) ) {
        $html = amp_minify_inline_asset_content( $html, $type );
    }

    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->enqueue_asset( 'head', $type, $html );
    }
}

/**
 * Add trusted custom HTML to the "About Ambient" section.
 * This is intended for site-managed custom.php extensions, not user input.
 *
 * @param string $html The HTML content to add.
 * @since v2.3.3
 */
function amp_add_about_content( string $html ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->enqueue_content( 'about', $html );
    }
}

function amp_get_about_content(): string {
    if ( !isset( $GLOBALS['ambient'] ) ) {
        return '';
    }
    $content = $GLOBALS['ambient']->get_content_slot( 'about' );
    return !empty( $content ) ? implode( "\n", $content ) : '';
}

function is_local(): bool {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->is_local() : false;
}

function is_cloud(): bool {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->is_cloud() : true;
}

function __( string $text ): string {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->__( $text ) : $text;
}

function amp_asset_mode(): string {
    $mode = function_exists( 'amp_env' ) ? amp_env( 'ASSET_MODE' ) : null;
    if ( in_array( $mode, [ 'dev', 'build' ], true ) ) {
        return $mode;
    }

    if ( !empty( amp_vite_dev_server_url() ) && is_local() ) {
        return 'dev';
    }

    return 'build';
}

function amp_vite_dev_server_url(): ?string {
    $value = function_exists( 'amp_env' ) ? amp_env( 'VITE_DEV_SERVER_URL' ) : null;
    if ( !$value ) {
        return null;
    }
    return rtrim( $value, '/' );
}

function amp_vite_dev_origin_url(): ?string {
    $vite_url = amp_vite_dev_server_url();
    if ( !$vite_url ) {
        return null;
    }

    $parts = parse_url( $vite_url );
    if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
        return $vite_url;
    }

    $origin = $parts['scheme'] . '://' . $parts['host'];
    if ( !empty( $parts['port'] ) ) {
        $origin .= ':' . $parts['port'];
    }

    return $origin;
}

function amp_use_vite_dev_server(): bool {
    return amp_asset_mode() === 'dev' && !empty( amp_vite_dev_server_url() );
}

function amp_vite_manifest_path(): string {
    return APP_ROOT . 'dist/manifest.json';
}

function amp_get_vite_manifest(): array {
    static $manifest = null;

    if ( $manifest !== null ) {
        return $manifest;
    }

    $manifest_path = amp_vite_manifest_path();
    if ( !file_exists( $manifest_path ) ) {
        $manifest = [];
        return $manifest;
    }

    $decoded = json_decode( file_get_contents( $manifest_path ), true );
    $manifest = is_array( $decoded ) ? $decoded : [];
    return $manifest;
}

function amp_get_vite_manifest_entry( string $entry ): ?array {
    $manifest = amp_get_vite_manifest();
    return isset( $manifest[$entry] ) && is_array( $manifest[$entry] ) ? $manifest[$entry] : null;
}

function amp_public_asset_url( string $path ): string {
    return './' . ltrim( str_replace( '\\', '/', $path ), './' );
}

function amp_built_asset_path( string $path ): string {
    return APP_ROOT . 'dist/' . ltrim( str_replace( '\\', '/', $path ), './' );
}

function amp_built_asset_url( string $path ): string {
    return './dist/' . ltrim( str_replace( '\\', '/', $path ), './' );
}

function amp_head(): string {
    $ambient = $GLOBALS['ambient'] ?? null;
    $output = [];
    $output[] = '<link rel="preload" href="https://www.youtube.com/player_api" as="script" />';
    // $output[] = '<script src="https://www.youtube.com/iframe_api"></script>';
    // $output[] = '<link href="//mplus-webfonts.sourceforge.jp/mplus_webfonts.css" rel="stylesheet" />';
    $output[] = '<link rel="icon" href="./'. basename( VIEWS_DIR ) .'/images/ambient.ico">';
        $output[] = "<script>
(function () {
    if (window.AmbientHooks && typeof window.AmbientHooks.addFilter === 'function') {
        return;
    }
    var filters = {};
    window.AmbientHooks = {
        addFilter: function (hookName, callback, priority) {
            if (typeof hookName !== 'string' || hookName === '' || typeof callback !== 'function') {
                return;
            }
            var hookPriority = Number.isFinite(Number(priority)) ? Number(priority) : 10;
            filters[hookName] = filters[hookName] || [];
            filters[hookName].push({
                callback: callback,
                priority: hookPriority,
                order: filters[hookName].length
            });
            filters[hookName].sort(function (a, b) {
                return a.priority === b.priority ? a.order - b.order : a.priority - b.priority;
            });
        },
        applyFilters: async function (hookName, value, context) {
            var chain = filters[hookName] || [];
            var nextValue = value;
            for (var i = 0; i < chain.length; i++) {
                try {
                    nextValue = await chain[i].callback(nextValue, context || {});
                } catch (error) {
                    console.error('[AmbientHooks] Filter failed:', hookName, error);
                }
            }
            return nextValue;
        }
    };
})();
</script>";
        $output[] = "<script>
(function () {
    try {
        var appKey = 'AmbientUserData';
        var raw = window.localStorage ? window.localStorage.getItem(appKey) : null;
        if (!raw) return;
        var parsed = JSON.parse(raw);
        var options = parsed && typeof parsed === 'object' ? parsed.options : null;
        if (!options || typeof options !== 'object') return;
        var dark = options.dark;
        var isDark = dark === true || dark === 1 || dark === '1' || dark === 'true';
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } catch (_err) {
        // ignore
    }
})();
</script>";

    if ( amp_use_vite_dev_server() ) {
        $vite_origin = amp_vite_dev_origin_url();
        $output[] = '<script type="module" src="'. $vite_origin .'/@vite/client"></script>';
    } else {
        $manifest_entry = amp_get_vite_manifest_entry( 'src/scripts/ambient.ts' );
        if ( $manifest_entry ) {
            if ( !empty( $manifest_entry['css'] ) && is_array( $manifest_entry['css'] ) ) {
                foreach ( $manifest_entry['css'] as $css_file ) {
                    $css_path = amp_built_asset_path( $css_file );
                    $version = file_exists( $css_path ) ? '?'. filemtime( $css_path ) : '';
                    $output[] = '<link rel="preload" as="style" href="'. amp_built_asset_url( $css_file ) . $version .'" />';
                    $output[] = '<link href="'. amp_built_asset_url( $css_file ) . $version .'" rel="stylesheet" />';
                }
            }
            if ( !empty( $manifest_entry['imports'] ) && is_array( $manifest_entry['imports'] ) ) {
                foreach ( $manifest_entry['imports'] as $import_entry_name ) {
                    $import_entry = amp_get_vite_manifest_entry( $import_entry_name );
                    if ( !empty( $import_entry['file'] ) ) {
                        $output[] = '<link rel="modulepreload" href="'. amp_built_asset_url( $import_entry['file'] ) .'" />';
                    }
                }
            }
        }
    }

    // Include dynamic assets from Ambient instance - @since v2.2.3
    if ( $ambient ) {
        $assets = $ambient->get_assets( 'head' );
        
        // 1. Meta tag (Raw HTML)
        if ( !empty( $assets['meta'] ) ) {
            $output[] = implode( "\n", $assets['meta'] );
        }
        // 2. Script tag
        if ( !empty( $assets['scripts'] ) ) {
            $output[] = implode( "\n", $assets['scripts'] );
        }
        // 3. Inline Scripts (Raw JavaScript)
        if ( !empty( $assets['inline_scripts'] ) ) {
            $output[] = implode( "\n", [ '<script>', implode( "\n", $assets['inline_scripts'] ), '</script>' ] );
        }
        // 4. Inline Styles (Raw CSS)
        if ( !empty( $assets['styles'] ) ) {
            $output[] = "<style>\n" . implode( "\n", $assets['styles'] ) . "\n</style>";
        }
    }

    $output[] = "<style>
body.app-boot-pending #app-root {
    visibility: hidden;
}

body.app-boot-pending.app-boot-transitioning #app-root {
    visibility: visible;
}

html body.app-boot-pending {
    overflow: hidden !important;
}

#app-boot-splash {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
    background: #f9fafb;
    color: #111827;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    overflow: hidden;
    opacity: 1;
    transition: opacity 220ms ease;
    pointer-events: auto;
}

@supports (height: 100dvh) {
    #app-boot-splash {
        height: 100dvh;
        max-height: 100dvh;
    }
}

body.app-boot-pending #app-boot-splash {
    display: flex;
}

#app-boot-splash.app-boot-fadeout {
    opacity: 0;
    pointer-events: none;
}

.dark #app-boot-splash {
    background: #111827;
    color: #f3f4f6;
}

#app-boot-splash .app-boot-loader {
    width: 9rem;
    height: 9rem;
    min-width: 9rem;
    min-height: 9rem;
    max-width: 9rem;
    max-height: 9rem;
    flex: 0 0 auto;
    border: 0;
    display: block;
    pointer-events: none;
}

#app-boot-splash .app-boot-label {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
}
</style>";

    return implode( "\n", $output );
}

function amp_component( string $component ): void {
    $GLOBALS['ambient']->get_component( $component );
}

function amp_footer(): string {
    $ambient = $GLOBALS['ambient'] ?? null;
    $output = [];

    if ( amp_use_vite_dev_server() ) {
        $vite_url = amp_vite_dev_server_url();
        $output[] = '<script type="module" src="'. $vite_url .'/src/scripts/ambient.ts"></script>';
    } else {
        $manifest_entry = amp_get_vite_manifest_entry( 'src/scripts/ambient.ts' );
        if ( $manifest_entry && !empty( $manifest_entry['file'] ) ) {
            $output[] = '<script type="module" src="'. amp_built_asset_url( $manifest_entry['file'] ) .'"></script>';
        } else {
            $output[] = '<!-- Ambient runtime manifest entry was not found. Run npm run build. -->';
        }
    }

    // Include dynamic footer scripts from Ambient instance - @since v2.2.3
    if ( $ambient ) {
        $assets = $ambient->get_assets( 'footer' );
        // 1. Script tag
        if ( !empty( $assets['scripts'] ) ) {
            $output[] = implode( "\n", $assets['scripts'] );
        }
        // 2. Inline Scripts (Raw JavaScript)
        if ( !empty( $assets['inline_scripts'] ) ) {
            $output[] = implode( "\n", [ '<script>', implode( "\n", $assets['inline_scripts'] ), '</script>' ] );
        }
    }

    return implode( "\n", $output );
}
