<?php

if ( !function_exists( 'amp_load_env_file' ) ) {
    /**
     * Load key/value pairs from .env into process env when available.
     */
    function amp_load_env_file( string $file_path ): void {
        if ( !file_exists( $file_path ) || !is_readable( $file_path ) ) {
            return;
        }

        $lines = file( $file_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
        if ( $lines === false ) {
            return;
        }

        foreach ( $lines as $line ) {
            $line = trim( $line );
            if ( $line === '' || str_starts_with( $line, '#' ) ) {
                continue;
            }

            $delimiter_pos = strpos( $line, '=' );
            if ( $delimiter_pos === false ) {
                continue;
            }

            $name = trim( substr( $line, 0, $delimiter_pos ) );
            $value = trim( substr( $line, $delimiter_pos + 1 ) );

            if ( $name === '' ) {
                continue;
            }

            $existing = $_ENV[$name] ?? $_SERVER[$name] ?? getenv( $name );
            if ( $existing !== false && $existing !== null && $existing !== '' ) {
                continue;
            }

            if (
                ( str_starts_with( $value, '"' ) && str_ends_with( $value, '"' ) ) ||
                ( str_starts_with( $value, "'" ) && str_ends_with( $value, "'" ) )
            ) {
                $value = substr( $value, 1, -1 );
            }

            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            putenv( $name . '=' . $value );
        }
    }
}

if ( !function_exists( 'amp_env' ) ) {
    /**
     * Get configuration value from environment variables with fallback.
     */
    function amp_env( string $name, ?string $default = null ): ?string {
        $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv( $name );

        if ( $value === false || $value === null || $value === '' ) {
            return $default;
        }

        return (string)$value;
    }
}

if ( !function_exists( 'amp_env_bool' ) ) {
    /**
     * Convert environment values into a boolean flag.
     */
    function amp_env_bool( string $name, bool $default = false ): bool {
        $value = amp_env( $name );
        if ( $value === null ) {
            return $default;
        }

        return in_array( strtolower( $value ), [ '1', 'true', 'yes', 'on' ], true );
    }
}

if ( !function_exists( 'amp_resolve_dir' ) ) {
    /**
     * Resolve absolute directory path from env value or relative default.
     */
    function amp_resolve_dir( string $path, string $root_path ): string {
        $normalized = trim( str_replace( '\\', '/', $path ) );
        if ( $normalized === '' ) {
            $normalized = './';
        }

        $is_windows_absolute = (bool)preg_match( '/^[A-Za-z]:\//', $normalized );
        $is_absolute = $is_windows_absolute || str_starts_with( $normalized, '/' );
        $resolved = $is_absolute ? $normalized : $root_path . ltrim( $normalized, './' );

        return rtrim( str_replace( '\\', '/', $resolved ), '/' ) . '/';
    }
}

if ( !function_exists( 'amp_resolve_path' ) ) {
    /**
     * Resolve absolute file path from env value or relative default.
     */
    function amp_resolve_path( string $path, string $root_path ): string {
        $normalized = trim( str_replace( '\\', '/', $path ) );
        if ( $normalized === '' ) {
            $normalized = './';
        }

        $is_windows_absolute = (bool)preg_match( '/^[A-Za-z]:\//', $normalized );
        $is_absolute = $is_windows_absolute || str_starts_with( $normalized, '/' );
        $resolved = $is_absolute ? $normalized : $root_path . ltrim( $normalized, './' );

        return str_replace( '\\', '/', $resolved );
    }
}

amp_load_env_file( dirname( __DIR__ ) . '/.env' );
