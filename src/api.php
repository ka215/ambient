<?php

namespace Magicmethods;

trait api {
    /** @var ?array */
    private $api_response;

    /**
     * Handler for calling the method corresponding to the API endpoint.
     * 
     * @param  string $method
     * @param  array  $args
     * @return void
     */
    private function api_request_handler( string $method, array $args ): void {
        if ( method_exists( $this, $method ) && is_array( $args ) ) {
            $this->logger( __METHOD__, __TRAIT__, $method, $args );
            // Perform pre-processing when calling API.
            $this->pre_processing_requested_api();

            call_user_func_array( [ $this, $method ], $args );
        }
    }

    /**
     * Perform pre-processing for API requests.
     * For example, you can insert authentication processing, etc.
     */
    private function pre_processing_requested_api(): void {
        $result = true;

        if ( !$result ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 401,
                'data'  => [
                    'message' => $this->__( 'Unauthorized request.' ),
                ]
            ];
            $this->return_response();
        }
    }

    /**
     * This is an API endpoint for obtaining valid playlist data.
     * 
     * @param  ?string $playlist_file
     * @return  void                    At post-processing returns an array for the response.
     */
    private function get_playlist( ?string $playlist_file = null ): void {
        $this->find_playlist();

        if ( empty( $this->playlists ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 404,
                'data'  => [
                    'message' => $this->__( 'Playlist not found. Please create a new playlist.' ),
                ]
            ];
        } else {
            if ( $playlist_file ) {
                if ( array_key_exists( $playlist_file, $this->playlists ) ) {
                    $file_ext = strtolower( pathinfo( $this->playlists[$playlist_file], PATHINFO_EXTENSION ) );
                    $raw_data = file_get_contents( $this->playlists[$playlist_file] );
                    if ( $file_ext === 'json' ) {
                        $playlist_data = $this->normalize_playlist_data( json_decode( $raw_data, true ) );
                    } else {
                        // php requires PECL yaml module extension.
                        //$playlist_data = yaml_parse( $raw_data );
                        $playlist_data = [];
                    }
                    if ( array_key_exists( 'options', $playlist_data ) ) {
                        $playlist_options = $playlist_data['options'];
                        unset( $playlist_data['options'] );
                    }
                    $this->api_response = [
                        'state' => 'ok',
                        'code'  => 200,
                        'data'  => [
                            'filename' => $playlist_file,
                        'src'      => str_replace(
                            str_replace( '\\', '/', APP_ROOT ),
                            '.',
                            str_replace( '\\', '/', $this->playlists[$playlist_file] )
                        ),
                            'media'    => $this->filter_media( $playlist_data ),
                            'options'  => isset( $playlist_options ) ? $playlist_options : null,
                        ],
                    ];
                } else {
                    $this->api_response = [
                        'state' => 'error',
                        'code'  => 404,
                        'data'  => [
                            'message' => $this->__( 'Specified playlist could not be found.' ),
                        ],
                    ];
                }
            } else {
                $relative_playlist = [];
                foreach ( $this->playlists as $_file => $_path ) {
                    //$filename = pathinfo( $_file, PATHINFO_FILENAME );
                    $relative_playlist[$_file] = str_replace( APP_ROOT, '.', $_path );
                }
                $this->api_response = [
                    'state' => 'ok',
                    'code'  => 200,
                    'data'  => $relative_playlist,
                ];
            }
        }
    }

    /**
     * This is an API endpoint for obtaining YouTube video metadata without exposing the API key.
     *
     * @param string $video_id
     * @return void
     */
    private function get_youtube_metadata( string $video_id ): void {
        $video_id = trim( $video_id );
        if ( preg_match( '/^[A-Za-z0-9_-]{6,32}$/', $video_id ) !== 1 ) {
            $this->set_youtube_metadata_error( 400, 'invalid-video-id', $this->__( 'Invalid YouTube video ID.' ) );
            return;
        }

        $api_key = trim( (string)amp_env( 'YOUTUBE_DATA_API_KEY', '' ) );
        if ( $api_key === '' ) {
            $this->set_youtube_metadata_error( 403, 'not-configured', $this->__( 'YouTube metadata assistance is not configured.' ) );
            return;
        }

        $usage = $this->read_youtube_metadata_usage();
        if ( $usage === null ) {
            $this->set_youtube_metadata_error( 500, 'counter-error', $this->__( 'YouTube metadata usage counter could not be read.' ) );
            return;
        }

        $limit = $this->get_youtube_metadata_monthly_limit();
        $allow_over_limit = amp_env_bool( 'YOUTUBE_METADATA_ALLOW_OVER_LIMIT', false );
        $limited = $limit !== null && $usage['count'] >= $limit;
        if ( $limited && !$allow_over_limit ) {
            $usage['limited'] = true;
            $this->set_youtube_metadata_error(
                429,
                'quota-exceeded',
                $this->__( 'YouTube metadata monthly limit has been reached.' ),
                $usage
            );
            return;
        }

        $metadata = $this->request_youtube_metadata_from_api( $video_id, $api_key );
        if ( $metadata['ok'] !== true ) {
            $reason = isset( $metadata['reason'] ) && is_string( $metadata['reason'] )
                ? $metadata['reason']
                : 'upstream-error';
            $code = $reason === 'not-found' ? 404 : 502;
            $this->set_youtube_metadata_error(
                $code,
                $reason,
                $reason === 'not-found'
                    ? $this->__( 'YouTube metadata was not found.' )
                    : $this->__( 'YouTube metadata could not be fetched.' )
            );
            return;
        }

        $next_usage = $this->increment_youtube_metadata_usage();
        if ( $next_usage === null ) {
            $this->set_youtube_metadata_error( 500, 'counter-error', $this->__( 'YouTube metadata usage counter could not be updated.' ) );
            return;
        }

        $next_usage['limited'] = $limit !== null && $next_usage['count'] >= $limit;
        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'videoId' => $video_id,
                'title' => $this->sanitize_text( (string)$metadata['title'], 100 ),
                'artist' => $this->sanitize_text( (string)$metadata['artist'], 100 ),
                'desc' => $this->sanitize_text( (string)$metadata['desc'], 1000, true ),
                'source' => 'youtube-data-api',
                'usage' => $next_usage,
            ],
        ];
    }

    /**
     * Lightweight server-side media URL checker for external local media URLs.
     *
     * The frontend uses this before falling back to HTMLMediaElement metadata loading.
     * It keeps external fetches same-origin from the browser perspective and only reads
     * a small prefix of the remote resource.
     *
     * @param string|null $url
     * @return void
     */
    private function check_external_local_media_url( ?string $url = null ): void {
        $origin_url = trim( (string)$url );
        $resolved = $this->resolve_core_local_media_url( $origin_url );
        $url = $resolved['url'];
        $this->logger( __METHOD__, 'start', [
            'originUrl' => $origin_url,
            'resolvedUrl' => $url,
            'resolved' => $resolved['resolved'],
            'resolvedBy' => $resolved['resolverName'] ?? null,
        ] );
        if ( !$this->is_safe_external_media_check_url( $url ) ) {
            $this->logger( __METHOD__, 'blocked-url', [
                'originUrl' => $origin_url,
                'resolvedUrl' => $url,
                'resolvedBy' => $resolved['resolverName'] ?? null,
            ] );
            $this->set_local_media_check_response(
                400,
                false,
                $origin_url,
                null,
                null,
                'blocked-url',
                $this->__( 'Media URL could not be checked by the server.' ),
                'server'
            );
            return;
        }

        $sample = $this->fetch_external_media_header_sample( $url );
        $this->logger( __METHOD__, 'sample-result', [
            'ok' => $sample['ok'] ?? null,
            'reason' => $sample['reason'] ?? null,
            'httpStatus' => $sample['httpStatus'] ?? null,
            'contentType' => $sample['contentType'] ?? null,
            'contentLength' => $sample['contentLength'] ?? null,
            'acceptRanges' => $sample['acceptRanges'] ?? null,
            'curlErrno' => $sample['curlErrno'] ?? null,
            'curlError' => $sample['curlError'] ?? null,
            'streamError' => $sample['streamError'] ?? null,
            'transport' => $sample['transport'] ?? null,
            'redirects' => $sample['redirects'] ?? null,
        ] );
        if ( !$sample['ok'] ) {
            $reason = $sample['reason'] ?? 'probe-failed';
            $message = $this->resolve_external_media_check_failure_message( $reason, $sample['httpStatus'] ?? null );
            $this->set_local_media_check_response(
                200,
                false,
                $url,
                null,
                null,
                $reason,
                $message,
                'server',
                [
                    'httpStatus' => $sample['httpStatus'] ?? null,
                    'originUrl' => $origin_url,
                    'resolved' => $resolved['resolved'],
                    'resolvedBy' => $resolved['resolverName'] ?? null,
                    'curlErrno' => $sample['curlErrno'] ?? null,
                    'curlError' => $sample['curlError'] ?? null,
                    'streamError' => $sample['streamError'] ?? null,
                    'transport' => $sample['transport'] ?? null,
                    'redirects' => $sample['redirects'] ?? null,
                ]
            );
            return;
        }

        $detected = $this->detect_external_media_mime(
            $sample['body'] ?? '',
            $sample['contentType'] ?? '',
            $url
        );
        $this->logger( __METHOD__, 'detect-result', [
            'kind' => $detected['kind'] ?? null,
            'mime' => $detected['mime'] ?? null,
            'source' => $detected['source'] ?? null,
        ] );
        if ( $detected['kind'] === null || $detected['mime'] === null ) {
            $content_type = $sample['contentType'] ?? '';
            if (
                ( $resolved['resolverName'] ?? null ) === 'ambient-google-drive-shared-url' &&
                is_string( $content_type ) &&
                stripos( $content_type, 'text/html' ) !== false
            ) {
                $this->set_local_media_check_response(
                    200,
                    false,
                    $url,
                    null,
                    null,
                    'upstream-forbidden',
                    $this->__( 'Media URL access is forbidden.' ),
                    'server',
                    [
                        'httpStatus' => 403,
                        'contentType' => $content_type,
                        'contentLength' => $sample['contentLength'] ?? null,
                        'acceptRanges' => $sample['acceptRanges'] ?? '',
                        'originUrl' => $origin_url,
                        'resolved' => $resolved['resolved'],
                        'resolvedBy' => $resolved['resolverName'] ?? null,
                        'transport' => $sample['transport'] ?? null,
                    ]
                );
                return;
            }
            $this->set_local_media_check_response(
                200,
                false,
                $url,
                null,
                null,
                'unsupported-mime',
                $this->__( 'Unsupported media URL format.' ),
                'server',
                [
                    'httpStatus' => $sample['httpStatus'] ?? null,
                    'contentType' => $sample['contentType'] ?? '',
                    'contentLength' => $sample['contentLength'] ?? null,
                    'acceptRanges' => $sample['acceptRanges'] ?? '',
                    'transport' => $sample['transport'] ?? null,
                ]
            );
            return;
        }

        $this->set_local_media_check_response(
            200,
            true,
            $url,
            $detected['kind'],
            $detected['mime'],
            null,
            $this->__( 'Media URL is playable.' ),
            'server',
            [
                'httpStatus' => $sample['httpStatus'] ?? null,
                'contentType' => $sample['contentType'] ?? '',
                'contentLength' => $sample['contentLength'] ?? null,
                'acceptRanges' => $sample['acceptRanges'] ?? '',
                'detection' => $detected['source'],
                'originUrl' => $origin_url,
                'resolved' => $resolved['resolved'],
                'resolvedBy' => $resolved['resolverName'] ?? null,
                'transport' => $sample['transport'] ?? ( function_exists( 'curl_init' ) ? 'curl' : 'stream' ),
            ]
        );
    }

    /**
     * @return array{url:string,resolved:bool,resolverName:?string}
     */
    private function resolve_core_local_media_url( string $origin_url ): array {
        $normalized_url = $this->normalize_external_media_url( $origin_url );
        if ( $normalized_url === null ) {
            return [
                'url' => $origin_url,
                'resolved' => false,
                'resolverName' => null,
            ];
        }

        $dropbox_url = $this->resolve_dropbox_shared_media_url( $normalized_url );
        if ( $dropbox_url !== null ) {
            return [
                'url' => $dropbox_url,
                'resolved' => $dropbox_url !== $normalized_url,
                'resolverName' => 'ambient-dropbox-shared-url',
            ];
        }

        $google_drive_url = $this->resolve_google_drive_shared_media_url( $normalized_url );
        if ( $google_drive_url !== null ) {
            return [
                'url' => $google_drive_url,
                'resolved' => $google_drive_url !== $normalized_url,
                'resolverName' => 'ambient-google-drive-shared-url',
            ];
        }

        return [
            'url' => $normalized_url,
            'resolved' => $normalized_url !== $origin_url,
            'resolverName' => $normalized_url !== $origin_url ? 'ambient-normalize-external-url' : null,
        ];
    }

    private function normalize_external_media_url( string $url ): ?string {
        $url = trim( $url );
        if ( $url === '' || str_starts_with( $url, '//' ) ) {
            return null;
        }
        $parts = parse_url( $url );
        if ( !is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
            return null;
        }
        $scheme = strtolower( (string)$parts['scheme'] );
        if ( $scheme !== 'http' && $scheme !== 'https' ) {
            return null;
        }
        return $url;
    }

    private function resolve_dropbox_shared_media_url( string $url ): ?string {
        $parts = parse_url( $url );
        if ( !is_array( $parts ) || empty( $parts['host'] ) ) {
            return null;
        }
        $host = strtolower( (string)$parts['host'] );
        if ( $host !== 'www.dropbox.com' && $host !== 'dropbox.com' ) {
            return null;
        }

        $path = isset( $parts['path'] ) ? (string)$parts['path'] : '';
        $query = [];
        if ( isset( $parts['query'] ) ) {
            parse_str( (string)$parts['query'], $query );
        }
        unset( $query['dl'], $query['raw'] );
        $resolved_query = http_build_query( $query );
        return 'https://dl.dropboxusercontent.com' . $path . ( $resolved_query !== '' ? '?' . $resolved_query : '' );
    }

    private function resolve_google_drive_shared_media_url( string $url ): ?string {
        $parts = parse_url( $url );
        if ( !is_array( $parts ) || empty( $parts['host'] ) ) {
            return null;
        }
        if ( strtolower( (string)$parts['host'] ) !== 'drive.google.com' ) {
            return null;
        }

        $path = isset( $parts['path'] ) ? (string)$parts['path'] : '';
        $file_id = '';
        if ( preg_match( '#/file/d/([^/]+)#', $path, $matches ) === 1 ) {
            $file_id = $matches[1];
        } elseif ( $path === '/open' || $path === '/uc' ) {
            $query = [];
            if ( isset( $parts['query'] ) ) {
                parse_str( (string)$parts['query'], $query );
            }
            $file_id = isset( $query['id'] ) ? (string)$query['id'] : '';
        }

        if ( preg_match( '/^[A-Za-z0-9_-]{10,}$/', $file_id ) !== 1 ) {
            return null;
        }

        return 'https://drive.google.com/uc?export=download&id=' . rawurlencode( $file_id );
    }

    private function proxy_external_local_media( ?string $playlist_file = null, ?string $media_id = null ): void {
        if ( !$this->is_local() ) {
            $this->send_local_media_proxy_error( 403, 'Range proxy is available only in local mode.' );
        }
        $this->maybe_cleanup_local_media_proxy_cache();

        $playlist_file = trim( (string)$playlist_file );
        $media_id_value = is_numeric( $media_id ) ? (int)$media_id : -1;
        if ( $playlist_file === '' || $media_id_value < 0 ) {
            $this->send_local_media_proxy_error( 400, 'Invalid media proxy request.' );
        }

        $target = $this->resolve_range_proxy_media_target( $playlist_file, $media_id_value );
        if ( $target === null ) {
            $this->send_local_media_proxy_error( 404, 'Range proxy media was not found.' );
        }

        $url = $target['url'];
        if ( !$this->is_safe_external_media_check_url( $url ) ) {
            $this->send_local_media_proxy_error( 400, 'Media URL is not allowed for Range proxy.' );
        }

        $cache = $this->ensure_local_media_proxy_cache( $url, $target['mime'] );
        if ( !$cache['ok'] ) {
            $this->logger( __METHOD__, 'cache-failed', $cache );
            $this->send_local_media_proxy_error( (int)( $cache['code'] ?? 502 ), 'Media proxy cache could not be prepared.' );
        }

        $this->send_local_media_proxy_file( (string)$cache['file'], (string)( $cache['mime'] ?? $target['mime'] ) );
    }

    /**
     * @return array{url:string,mime:string}|null
     */
    private function resolve_range_proxy_media_target( string $playlist_file, int $media_id ): ?array {
        $this->find_playlist();
        if ( !array_key_exists( $playlist_file, $this->playlists ) ) {
            return null;
        }

        $raw_data = file_get_contents( $this->playlists[$playlist_file] );
        if ( $raw_data === false ) {
            return null;
        }
        $playlist_data = $this->normalize_playlist_data( json_decode( $raw_data, true ) );
        $current_id = 0;
        foreach ( $playlist_data as $category => $items ) {
            if ( $category === 'options' || !is_array( $items ) ) {
                continue;
            }
            foreach ( $items as $item ) {
                if ( !is_array( $item ) ) {
                    continue;
                }
                $title = isset( $item['title'] ) ? trim( (string)$item['title'] ) : '';
                if ( $title === '' ) {
                    continue;
                }
                if ( $current_id !== $media_id ) {
                    $current_id++;
                    continue;
                }
                if ( $this->normalize_boolish( $item['rangeProxy'] ?? false ) !== true ) {
                    return null;
                }
                $url = isset( $item['file'] ) && is_string( $item['file'] ) ? trim( $item['file'] ) : '';
                if ( $url === '' || preg_match( '#^https?://#i', $url ) !== 1 ) {
                    return null;
                }
                $resolved = $this->resolve_core_local_media_url( $url );
                $url = $resolved['url'];
                $item_mime = isset( $item['mediaMime'] ) && is_string( $item['mediaMime'] ) ? strtolower( trim( $item['mediaMime'] ) ) : '';
                $mime = preg_match( '#^(audio|video)/#', $item_mime ) === 1
                    ? $item_mime
                    : ( $this->resolve_media_mime_from_url_extension( $url ) ?? 'application/octet-stream' );
                return [
                    'url' => $url,
                    'mime' => $mime,
                ];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function ensure_local_media_proxy_cache( string $url, string $fallback_mime ): array {
        $cache_dir = $this->get_local_media_proxy_cache_dir();
        if ( !is_dir( $cache_dir ) && !@mkdir( $cache_dir, 0755, true ) ) {
            return [ 'ok' => false, 'code' => 500, 'reason' => 'cache-dir-unavailable' ];
        }

        $key = hash( 'sha256', $url );
        $cache_file = $cache_dir . $key . '.bin';
        $meta_file = $cache_dir . $key . '.json';
        $lock_file = $cache_dir . $key . '.lock';
        $meta = $this->read_local_media_proxy_cache_meta( $meta_file );
        if ( is_file( $cache_file ) && filesize( $cache_file ) > 0 ) {
            return [
                'ok' => true,
                'file' => $cache_file,
                'mime' => $meta['mime'] ?? $fallback_mime,
            ];
        }

        $lock = @fopen( $lock_file, 'c' );
        if ( $lock === false ) {
            return [ 'ok' => false, 'code' => 500, 'reason' => 'cache-lock-unavailable' ];
        }
        try {
            if ( !@flock( $lock, LOCK_EX ) ) {
                return [ 'ok' => false, 'code' => 500, 'reason' => 'cache-lock-failed' ];
            }
            clearstatcache( true, $cache_file );
            if ( is_file( $cache_file ) && filesize( $cache_file ) > 0 ) {
                $meta = $this->read_local_media_proxy_cache_meta( $meta_file );
                return [
                    'ok' => true,
                    'file' => $cache_file,
                    'mime' => $meta['mime'] ?? $fallback_mime,
                ];
            }

            $download = $this->download_local_media_proxy_cache( $url, $cache_file, $fallback_mime );
            if ( !$download['ok'] ) {
                return $download;
            }
            @file_put_contents(
                $meta_file,
                json_encode( [
                    'urlHash' => $key,
                    'mime' => $download['mime'] ?? $fallback_mime,
                    'bytes' => filesize( $cache_file ) ?: null,
                    'createdAt' => gmdate( 'c' ),
                    'expiresAt' => $this->resolve_local_media_proxy_cache_expires_at(),
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ),
                LOCK_EX
            );
            return [
                'ok' => true,
                'file' => $cache_file,
                'mime' => $download['mime'] ?? $fallback_mime,
            ];
        } finally {
            @flock( $lock, LOCK_UN );
            @fclose( $lock );
        }
    }

    private function get_local_media_proxy_cache_dir(): string {
        $configured = trim( (string)amp_env( 'AMBIENT_LOCAL_MEDIA_PROXY_CACHE_DIR', '' ) );
        if ( $configured !== '' ) {
            return amp_resolve_dir( $configured, APP_ROOT );
        }
        return APP_ROOT . '.cache/media-proxy/';
    }

    private function get_local_media_proxy_cache_ttl_seconds(): int {
        $value = amp_env( 'AMBIENT_LOCAL_MEDIA_PROXY_CACHE_TTL_SECONDS', '604800' );
        if ( !is_numeric( $value ) ) {
            return 604800;
        }
        return max( 0, (int)$value );
    }

    private function resolve_local_media_proxy_cache_expires_at(): ?string {
        $ttl_seconds = $this->get_local_media_proxy_cache_ttl_seconds();
        if ( $ttl_seconds === 0 ) {
            return null;
        }
        return gmdate( 'c', time() + $ttl_seconds );
    }

    private function maybe_cleanup_local_media_proxy_cache( bool $force = false ): void {
        if ( !$this->is_local() ) {
            return;
        }
        $cache_dir = $this->get_local_media_proxy_cache_dir();
        if ( !is_dir( $cache_dir ) ) {
            return;
        }
        $marker_file = $cache_dir . '.last-cleanup';
        if ( !$force && is_file( $marker_file ) && ( time() - (int)@filemtime( $marker_file ) ) < 86400 ) {
            return;
        }

        $this->cleanup_expired_local_media_proxy_cache( $cache_dir );
        @file_put_contents( $marker_file, gmdate( 'c' ), LOCK_EX );
    }

    private function cleanup_expired_local_media_proxy_cache( string $cache_dir ): void {
        $ttl_seconds = $this->get_local_media_proxy_cache_ttl_seconds();
        $meta_files = glob( $cache_dir . '*.json' );
        if ( !is_array( $meta_files ) ) {
            $meta_files = [];
        }

        foreach ( $meta_files as $meta_file ) {
            $meta = $this->read_local_media_proxy_cache_meta( $meta_file );
            $hash = pathinfo( $meta_file, PATHINFO_FILENAME );
            if ( !is_string( $hash ) || preg_match( '/^[a-f0-9]{64}$/', $hash ) !== 1 ) {
                continue;
            }
            $expired = false;
            $expires_at = isset( $meta['expiresAt'] ) && is_string( $meta['expiresAt'] )
                ? strtotime( $meta['expiresAt'] )
                : false;
            if ( $expires_at !== false ) {
                $expired = $expires_at <= time();
            } elseif ( $ttl_seconds > 0 ) {
                $created_at = isset( $meta['createdAt'] ) && is_string( $meta['createdAt'] )
                    ? strtotime( $meta['createdAt'] )
                    : false;
                $mtime = @filemtime( $meta_file );
                $base_time = $created_at !== false ? $created_at : ( $mtime !== false ? $mtime : time() );
                $expired = ( $base_time + $ttl_seconds ) <= time();
            }
            if ( $expired ) {
                $this->delete_local_media_proxy_cache_by_hash( $hash );
            }
        }

        $tmp_files = glob( $cache_dir . '*.tmp-*' );
        if ( !is_array( $tmp_files ) ) {
            return;
        }
        foreach ( $tmp_files as $tmp_file ) {
            $mtime = @filemtime( $tmp_file );
            if ( $mtime !== false && ( time() - $mtime ) > 86400 ) {
                @unlink( $tmp_file );
            }
        }
    }

    private function delete_local_media_proxy_cache_by_url( string $url ): void {
        $normalized_url = $this->normalize_external_media_url( $url );
        if ( $normalized_url === null ) {
            return;
        }
        $this->delete_local_media_proxy_cache_by_hash( hash( 'sha256', $normalized_url ) );
    }

    private function delete_local_media_proxy_cache_by_hash( string $hash ): void {
        if ( preg_match( '/^[a-f0-9]{64}$/', $hash ) !== 1 ) {
            return;
        }
        $cache_dir = $this->get_local_media_proxy_cache_dir();
        foreach ( [ '.bin', '.json', '.lock' ] as $suffix ) {
            $path = $cache_dir . $hash . $suffix;
            if ( is_file( $path ) ) {
                @unlink( $path );
            }
        }
        $tmp_files = glob( $cache_dir . $hash . '.bin.tmp-*' );
        if ( is_array( $tmp_files ) ) {
            foreach ( $tmp_files as $tmp_file ) {
                @unlink( $tmp_file );
            }
        }
    }

    /**
     * @param array<string, mixed> $playlist_data
     * @return array<string, bool>
     */
    private function collect_local_media_proxy_cache_urls( array $playlist_data ): array {
        $urls = [];
        foreach ( $this->normalize_playlist_data( $playlist_data ) as $category => $items ) {
            if ( $category === 'options' || !is_array( $items ) ) {
                continue;
            }
            foreach ( $items as $item ) {
                if ( !is_array( $item ) || $this->normalize_boolish( $item['rangeProxy'] ?? false ) !== true ) {
                    continue;
                }
                $origin_url = isset( $item['file'] ) && is_string( $item['file'] ) ? trim( $item['file'] ) : '';
                if ( $origin_url === '' || preg_match( '#^https?://#i', $origin_url ) !== 1 ) {
                    continue;
                }
                $resolved = $this->resolve_core_local_media_url( $origin_url );
                $url = $this->normalize_external_media_url( $resolved['url'] );
                if ( $url !== null ) {
                    $urls[$url] = true;
                }
            }
        }
        return $urls;
    }

    /**
     * @param array<string, bool> $before_urls
     * @param array<string, bool> $after_urls
     */
    private function cleanup_removed_local_media_proxy_cache_urls( array $before_urls, array $after_urls ): void {
        if ( empty( $before_urls ) ) {
            return;
        }
        foreach ( $before_urls as $url => $_used ) {
            if ( !array_key_exists( $url, $after_urls ) ) {
                $this->delete_local_media_proxy_cache_by_url( $url );
            }
        }
        $this->maybe_cleanup_local_media_proxy_cache( true );
    }

    /**
     * @return array<string, mixed>
     */
    private function read_local_media_proxy_cache_meta( string $meta_file ): array {
        if ( !is_file( $meta_file ) ) {
            return [];
        }
        $raw = @file_get_contents( $meta_file );
        $decoded = is_string( $raw ) ? json_decode( $raw, true ) : null;
        return is_array( $decoded ) ? $decoded : [];
    }

    /**
     * @return array<string, mixed>
     */
    private function download_local_media_proxy_cache( string $url, string $cache_file, string $fallback_mime ): array {
        $tmp_file = $cache_file . '.tmp-' . bin2hex( random_bytes( 6 ) );
        $fp = @fopen( $tmp_file, 'wb' );
        if ( $fp === false ) {
            return [ 'ok' => false, 'code' => 500, 'reason' => 'cache-write-unavailable' ];
        }

        $headers = [];
        $max_bytes = $this->get_local_media_proxy_max_bytes();
        $written = 0;
        $current_url = $url;
        $max_redirects = 3;
        try {
            for ( $redirect = 0; $redirect <= $max_redirects; $redirect++ ) {
                if ( !$this->is_safe_external_media_check_url( $current_url ) ) {
                    return [ 'ok' => false, 'code' => 400, 'reason' => 'blocked-url' ];
                }
                $result = $this->download_local_media_proxy_cache_once(
                    $current_url,
                    $fp,
                    $headers,
                    $written,
                    $max_bytes
                );
                if ( !( $result['ok'] ?? false ) ) {
                    return [
                        'ok' => false,
                        'code' => ( $result['reason'] ?? '' ) === 'max-size-exceeded' ? 413 : 502,
                        'reason' => $result['reason'] ?? 'upstream-error',
                        'httpStatus' => $result['httpStatus'] ?? null,
                        'curlErrno' => $result['curlErrno'] ?? null,
                        'curlError' => $result['curlError'] ?? null,
                        'streamError' => $result['streamError'] ?? null,
                        'transport' => $result['transport'] ?? null,
                    ];
                }
                $status = (int)( $result['httpStatus'] ?? 0 );
                $location = trim( (string)( $headers['location'] ?? '' ) );
                if ( in_array( $status, [ 301, 302, 303, 307, 308 ], true ) && $location !== '' ) {
                    $next_url = $this->resolve_external_media_redirect_url( $location, $current_url );
                    if ( $next_url === null ) {
                        return [ 'ok' => false, 'code' => 502, 'reason' => 'invalid-redirect' ];
                    }
                    $current_url = $next_url;
                    $headers = [];
                    continue;
                }
                if ( $status < 200 || $status >= 300 ) {
                    return [ 'ok' => false, 'code' => 502, 'reason' => 'upstream-status' ];
                }
                if ( $written <= 0 ) {
                    return [ 'ok' => false, 'code' => 502, 'reason' => 'empty-upstream' ];
                }
                $mime = $this->normalize_header_media_type( $headers['content-type'] ?? '' );
                if ( $this->resolve_media_kind_from_mime( $mime ) === null ) {
                    $mime = $fallback_mime;
                }
                if ( !@rename( $tmp_file, $cache_file ) ) {
                    return [ 'ok' => false, 'code' => 500, 'reason' => 'cache-commit-failed' ];
                }
                return [ 'ok' => true, 'mime' => $mime ];
            }

            return [ 'ok' => false, 'code' => 502, 'reason' => 'too-many-redirects' ];
        } finally {
            @fclose( $fp );
            if ( is_file( $tmp_file ) ) {
                @unlink( $tmp_file );
            }
        }
    }

    private function get_local_media_proxy_max_bytes(): int {
        $value = amp_env( 'AMBIENT_LOCAL_MEDIA_PROXY_MAX_BYTES', '524288000' );
        $max_bytes = is_numeric( $value ) ? (int)$value : 524288000;
        return max( 1024 * 1024, $max_bytes );
    }

    /**
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    private function download_local_media_proxy_cache_once(
        string $url,
        $fp,
        array &$headers,
        int &$written,
        int $max_bytes
    ): array {
        if ( function_exists( 'curl_init' ) ) {
            return $this->download_local_media_proxy_cache_once_with_curl(
                $url,
                $fp,
                $headers,
                $written,
                $max_bytes
            );
        }

        return $this->download_local_media_proxy_cache_once_with_stream(
            $url,
            $fp,
            $headers,
            $written,
            $max_bytes
        );
    }

    /**
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    private function download_local_media_proxy_cache_once_with_curl(
        string $url,
        $fp,
        array &$headers,
        int &$written,
        int $max_bytes
    ): array {
        $ch = curl_init( $url );
        if ( $ch === false ) {
            return [ 'ok' => false, 'reason' => 'curl-init-failed' ];
        }
        @ftruncate( $fp, 0 );
        @rewind( $fp );
        $written = 0;
        $headers = [];
        $options = [
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_USERAGENT => 'Ambient/' . $this->get_version(),
            CURLOPT_HEADERFUNCTION => function( $curl, string $header ) use ( &$headers ): int {
                $length = strlen( $header );
                $trimmed = trim( $header );
                if ( $trimmed === '' || !str_contains( $trimmed, ':' ) ) {
                    return $length;
                }
                [ $name, $value ] = array_map( 'trim', explode( ':', $trimmed, 2 ) );
                $headers[strtolower( $name )] = $value;
                return $length;
            },
            CURLOPT_WRITEFUNCTION => function( $curl, string $chunk ) use ( $fp, &$written, $max_bytes ): int {
                $length = strlen( $chunk );
                if ( $written + $length > $max_bytes ) {
                    return 0;
                }
                $result = fwrite( $fp, $chunk );
                if ( $result === false ) {
                    return 0;
                }
                $written += $result;
                return $result;
            },
        ];
        if ( defined( 'CURLOPT_PROTOCOLS' ) && defined( 'CURLPROTO_HTTP' ) && defined( 'CURLPROTO_HTTPS' ) ) {
            $options[CURLOPT_PROTOCOLS] = CURLPROTO_HTTP | CURLPROTO_HTTPS;
        }
        curl_setopt_array( $ch, $options );
        $executed = curl_exec( $ch );
        $errno = curl_errno( $ch );
        $error = curl_error( $ch );
        $http_code = (int)curl_getinfo( $ch, CURLINFO_HTTP_CODE );
        curl_close( $ch );
        if ( $executed === false ) {
            return [
                'ok' => false,
                'reason' => $errno === 23 ? 'max-size-exceeded' : 'upstream-error',
                'httpStatus' => $http_code,
                'curlErrno' => $errno,
                'curlError' => $error,
                'transport' => 'curl',
            ];
        }
        return [
            'ok' => true,
            'httpStatus' => $http_code,
            'transport' => 'curl',
        ];
    }

    /**
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    private function download_local_media_proxy_cache_once_with_stream(
        string $url,
        $fp,
        array &$headers,
        int &$written,
        int $max_bytes
    ): array {
        if ( !filter_var( ini_get( 'allow_url_fopen' ), FILTER_VALIDATE_BOOLEAN ) ) {
            return [ 'ok' => false, 'reason' => 'stream-unavailable', 'transport' => 'stream' ];
        }

        @ftruncate( $fp, 0 );
        @rewind( $fp );
        $written = 0;
        $headers = [];
        $timeout = 120;
        $error_message = '';
        $context = stream_context_create( [
            'http' => [
                'method' => 'GET',
                'header' => 'User-Agent: Ambient/' . $this->get_version(),
                'follow_location' => 0,
                'ignore_errors' => true,
                'timeout' => $timeout,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ] );

        set_error_handler( static function( int $severity, string $message ) use ( &$error_message ): bool {
            $error_message = $message;
            return true;
        } );
        try {
            $upstream = fopen( $url, 'rb', false, $context );
        } finally {
            restore_error_handler();
        }

        if ( $upstream === false ) {
            return [
                'ok' => false,
                'reason' => 'upstream-error',
                'streamError' => $error_message,
                'transport' => 'stream',
            ];
        }

        stream_set_timeout( $upstream, $timeout );
        while ( !feof( $upstream ) ) {
            $chunk = fread( $upstream, 8192 );
            if ( $chunk === false ) {
                fclose( $upstream );
                return [
                    'ok' => false,
                    'reason' => 'upstream-error',
                    'streamError' => $error_message,
                    'transport' => 'stream',
                ];
            }
            if ( $chunk === '' ) {
                break;
            }
            $length = strlen( $chunk );
            if ( $written + $length > $max_bytes ) {
                fclose( $upstream );
                return [
                    'ok' => false,
                    'reason' => 'max-size-exceeded',
                    'streamError' => $error_message,
                    'transport' => 'stream',
                ];
            }
            $result = fwrite( $fp, $chunk );
            if ( $result === false ) {
                fclose( $upstream );
                return [
                    'ok' => false,
                    'reason' => 'cache-write-failed',
                    'streamError' => $error_message,
                    'transport' => 'stream',
                ];
            }
            $written += $result;
        }

        $meta = stream_get_meta_data( $upstream );
        fclose( $upstream );

        $wrapper_data = $meta['wrapper_data'] ?? [];
        $raw_headers = [];
        if ( is_array( $wrapper_data ) ) {
            foreach ( $wrapper_data as $header ) {
                if ( is_string( $header ) ) {
                    $raw_headers[] = $header;
                }
            }
        }
        $parsed_headers = $this->parse_external_media_response_headers( $raw_headers );
        $headers = $parsed_headers['headers'];

        if ( !empty( $meta['timed_out'] ) && $written <= 0 ) {
            return [
                'ok' => false,
                'reason' => 'timeout',
                'httpStatus' => $parsed_headers['httpStatus'],
                'streamError' => $error_message,
                'transport' => 'stream',
            ];
        }

        return [
            'ok' => true,
            'httpStatus' => $parsed_headers['httpStatus'],
            'transport' => 'stream',
            'streamError' => $error_message,
        ];
    }

    private function send_local_media_proxy_file( string $cache_file, string $mime ): void {
        if ( !is_file( $cache_file ) || !is_readable( $cache_file ) ) {
            $this->send_local_media_proxy_error( 404, 'Range proxy cache file was not found.' );
        }
        $size = filesize( $cache_file );
        if ( $size === false || $size <= 0 ) {
            $this->send_local_media_proxy_error( 502, 'Range proxy cache file is empty.' );
        }

        $start = 0;
        $end = $size - 1;
        $status_code = 200;
        $range = $_SERVER['HTTP_RANGE'] ?? '';
        if ( is_string( $range ) && preg_match( '/bytes=(\d*)-(\d*)/', $range, $matches ) === 1 ) {
            $range_start = $matches[1] !== '' ? (int)$matches[1] : null;
            $range_end = $matches[2] !== '' ? (int)$matches[2] : null;
            if ( $range_start === null && $range_end !== null ) {
                $start = max( 0, $size - $range_end );
            } elseif ( $range_start !== null ) {
                $start = $range_start;
            }
            if ( $range_end !== null && $range_start !== null ) {
                $end = min( $range_end, $size - 1 );
            }
            if ( $start < 0 || $start > $end || $start >= $size ) {
                header( 'HTTP/1.1 416 Range Not Satisfiable' );
                header( 'Content-Range: bytes */' . $size );
                die();
            }
            $status_code = 206;
        }

        $length = $end - $start + 1;
        header( $status_code === 206 ? 'HTTP/1.1 206 Partial Content' : 'HTTP/1.1 200 OK' );
        header( 'Content-Type: ' . ( $this->normalize_header_media_type( $mime ) ?: 'application/octet-stream' ) );
        header( 'Accept-Ranges: bytes' );
        header( 'Content-Length: ' . $length );
        header( 'Cache-Control: private, max-age=3600' );
        if ( $status_code === 206 ) {
            header( sprintf( 'Content-Range: bytes %d-%d/%d', $start, $end, $size ) );
        }

        $fp = fopen( $cache_file, 'rb' );
        if ( $fp === false ) {
            $this->send_local_media_proxy_error( 500, 'Range proxy cache file could not be opened.' );
        }
        fseek( $fp, $start );
        $remaining = $length;
        while ( $remaining > 0 && !feof( $fp ) ) {
            $chunk_size = min( 8192, $remaining );
            $buffer = fread( $fp, $chunk_size );
            if ( $buffer === false || $buffer === '' ) {
                break;
            }
            echo $buffer;
            $remaining -= strlen( $buffer );
            if ( function_exists( 'fastcgi_finish_request' ) ) {
                continue;
            }
            flush();
        }
        fclose( $fp );
        die();
    }

    private function send_local_media_proxy_error( int $code, string $message ): void {
        http_response_code( $code );
        header( 'Content-Type: text/plain; charset=UTF-8' );
        echo $message;
        die();
    }

    /**
     * @param array<string, mixed> $meta
     */
    private function set_local_media_check_response(
        int $code,
        bool $ok,
        string $url,
        ?string $kind,
        ?string $mime,
        ?string $reason,
        string $message,
        string $source,
        array $meta = []
    ): void {
        $data = [
            'ok' => $ok,
            'url' => $url,
            'kind' => $kind,
            'mime' => $mime,
            'reason' => $reason,
            'message' => $message,
            'source' => $source,
        ];
        if ( !empty( $meta ) ) {
            $data['meta'] = $meta;
        }
        $this->api_response = [
            'state' => $ok ? 'ok' : 'error',
            'code' => $code,
            'data' => $data,
        ];
    }

    private function resolve_external_media_check_failure_message( string $reason, $http_status = null ): string {
        $status = is_numeric( $http_status ) ? (int)$http_status : 0;
        if ( $status === 401 ) {
            return $this->__( 'Media URL requires authentication.' );
        }
        if ( $status === 403 ) {
            return $this->__( 'Media URL access is forbidden.' );
        }
        if ( $status === 404 ) {
            return $this->__( 'Media URL was not found.' );
        }
        if ( $status >= 500 ) {
            return $this->__( 'Media URL host returned a server error.' );
        }
        if ( $reason === 'timeout' ) {
            return $this->__( 'Media URL check timed out.' );
        }
        return $this->__( 'Media URL could not be checked by the server.' );
    }

    private function is_safe_external_media_check_url( string $url ): bool {
        if ( $url === '' ) {
            return false;
        }
        $parts = parse_url( $url );
        if ( !is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
            return false;
        }
        $scheme = strtolower( (string)$parts['scheme'] );
        if ( $scheme !== 'http' && $scheme !== 'https' ) {
            return false;
        }
        $host = trim( (string)$parts['host'], "[] \t\n\r\0\x0B" );
        if ( $host === '' ) {
            return false;
        }
        $lower_host = strtolower( $host );
        if (
            $lower_host === 'localhost' ||
            str_ends_with( $lower_host, '.localhost' ) ||
            str_ends_with( $lower_host, '.local' )
        ) {
            return false;
        }
        if ( isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
            return false;
        }
        if ( isset( $parts['port'] ) ) {
            $port = (int)$parts['port'];
            if ( $port < 1 || $port > 65535 ) {
                return false;
            }
        }

        foreach ( $this->resolve_external_media_check_host_ips( $host ) as $ip ) {
            if ( !$this->is_public_ip_address( $ip ) ) {
                return false;
            }
        }

        return count( $this->resolve_external_media_check_host_ips( $host ) ) > 0;
    }

    /**
     * @return string[]
     */
    private function resolve_external_media_check_host_ips( string $host ): array {
        if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
            return [ $host ];
        }

        $ips = [];
        $ipv4 = @gethostbynamel( $host );
        if ( is_array( $ipv4 ) ) {
            $ips = array_merge( $ips, $ipv4 );
        }
        if ( function_exists( 'dns_get_record' ) ) {
            $records = @dns_get_record( $host, DNS_AAAA );
            if ( is_array( $records ) ) {
                foreach ( $records as $record ) {
                    if ( isset( $record['ipv6'] ) && is_string( $record['ipv6'] ) ) {
                        $ips[] = $record['ipv6'];
                    }
                }
            }
        }

        return array_values( array_unique( array_filter( $ips, 'is_string' ) ) );
    }

    private function is_public_ip_address( string $ip ): bool {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    /**
     * @return array<string, mixed>
     */
    private function fetch_external_media_header_sample( string $url ): array {
        $current_url = $url;
        $redirects = [];
        $max_redirects = 3;
        for ( $redirect = 0; $redirect <= $max_redirects; $redirect++ ) {
            if ( !$this->is_safe_external_media_check_url( $current_url ) ) {
                return [ 'ok' => false, 'reason' => 'blocked-url', 'redirects' => $redirects ];
            }

            $result = $this->fetch_external_media_header_sample_once( $current_url );
            $status = (int)( $result['httpStatus'] ?? 0 );
            $location = trim( (string)( $result['location'] ?? '' ) );
            if ( in_array( $status, [ 301, 302, 303, 307, 308 ], true ) && $location !== '' ) {
                $next_url = $this->resolve_external_media_redirect_url( $location, $current_url );
                if ( $next_url === null ) {
                    return array_merge( $result, [ 'ok' => false, 'reason' => 'invalid-redirect', 'redirects' => $redirects ] );
                }
                $redirects[] = [
                    'from' => $current_url,
                    'to' => $next_url,
                    'status' => $status,
                ];
                if ( $this->is_google_drive_auth_redirect( $current_url, $next_url ) ) {
                    return [
                        'ok' => false,
                        'reason' => 'upstream-forbidden',
                        'httpStatus' => 403,
                        'redirects' => $redirects,
                    ];
                }
                $current_url = $next_url;
                continue;
            }

            if ( $status < 200 || $status >= 300 ) {
                return [
                    ...$result,
                    'ok' => false,
                    'reason' => $this->resolve_external_media_upstream_status_reason( $status ),
                    'httpStatus' => $status,
                    'redirects' => $redirects,
                ];
            }

            return [
                'ok' => true,
                'url' => $current_url,
                'httpStatus' => $status,
                'contentType' => $result['contentType'] ?? '',
                'contentLength' => $result['contentLength'] ?? null,
                'acceptRanges' => $result['acceptRanges'] ?? '',
                'body' => $result['body'] ?? '',
                'curlErrno' => $result['curlErrno'] ?? null,
                'curlError' => $result['curlError'] ?? null,
                'streamError' => $result['streamError'] ?? null,
                'transport' => $result['transport'] ?? null,
                'redirects' => $redirects,
            ];
        }

        return [ 'ok' => false, 'reason' => 'too-many-redirects', 'redirects' => $redirects ];
    }

    private function is_google_drive_auth_redirect( string $from_url, string $to_url ): bool {
        $from_parts = parse_url( $from_url );
        $to_parts = parse_url( $to_url );
        if ( !is_array( $from_parts ) || !is_array( $to_parts ) ) {
            return false;
        }
        $from_host = strtolower( (string)( $from_parts['host'] ?? '' ) );
        $to_host = strtolower( (string)( $to_parts['host'] ?? '' ) );
        $from_is_drive = $from_host === 'drive.google.com' || $from_host === 'drive.usercontent.google.com';
        return $from_is_drive && $to_host === 'accounts.google.com';
    }

    private function resolve_external_media_upstream_status_reason( int $status ): string {
        if ( $status === 401 ) {
            return 'upstream-unauthorized';
        }
        if ( $status === 403 ) {
            return 'upstream-forbidden';
        }
        if ( $status === 404 ) {
            return 'upstream-not-found';
        }
        if ( $status >= 500 ) {
            return 'upstream-server-error';
        }
        return 'upstream-status';
    }

    /**
     * @return array<string, mixed>
     */
    private function fetch_external_media_header_sample_once( string $url ): array {
        if ( function_exists( 'curl_init' ) ) {
            return $this->fetch_external_media_header_sample_once_with_curl( $url );
        }

        return $this->fetch_external_media_header_sample_once_with_stream( $url );
    }

    /**
     * @return array<string, mixed>
     */
    private function fetch_external_media_header_sample_once_with_curl( string $url ): array {
        $headers = [];
        $body = '';
        $max_bytes = 4096;
        $timeout = 5;
        $ch = curl_init( $url );
        if ( $ch === false ) {
            return [ 'ok' => false, 'reason' => 'curl-init-failed' ];
        }

        $options = [
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_RANGE => '0-' . ( $max_bytes - 1 ),
            CURLOPT_USERAGENT => 'Ambient/' . $this->get_version(),
            CURLOPT_HEADERFUNCTION => function( $curl, string $header ) use ( &$headers ): int {
                $length = strlen( $header );
                $trimmed = trim( $header );
                if ( $trimmed === '' || !str_contains( $trimmed, ':' ) ) {
                    return $length;
                }
                [ $name, $value ] = array_map( 'trim', explode( ':', $trimmed, 2 ) );
                $headers[strtolower( $name )] = $value;
                return $length;
            },
            CURLOPT_WRITEFUNCTION => function( $curl, string $chunk ) use ( &$body, $max_bytes ): int {
                $remaining = $max_bytes - strlen( $body );
                if ( $remaining <= 0 ) {
                    return 0;
                }
                $chunk_length = strlen( $chunk );
                if ( $chunk_length <= $remaining ) {
                    $body .= $chunk;
                    return $chunk_length;
                }
                $body .= substr( $chunk, 0, $remaining );
                return 0;
            },
        ];
        if ( defined( 'CURLOPT_PROTOCOLS' ) && defined( 'CURLPROTO_HTTP' ) && defined( 'CURLPROTO_HTTPS' ) ) {
            $options[CURLOPT_PROTOCOLS] = CURLPROTO_HTTP | CURLPROTO_HTTPS;
        }
        curl_setopt_array( $ch, $options );

        $executed = curl_exec( $ch );
        $errno = curl_errno( $ch );
        $error = curl_error( $ch );
        $http_code = (int)curl_getinfo( $ch, CURLINFO_HTTP_CODE );
        curl_close( $ch );

        if ( $executed === false && $body === '' ) {
            return [
                'ok' => false,
                'reason' => $errno === 28 ? 'timeout' : 'upstream-error',
                'curlErrno' => $errno,
                'curlError' => $error,
                'httpStatus' => $http_code,
                'transport' => 'curl',
            ];
        }

        return [
            'ok' => true,
            'httpStatus' => $http_code,
            'curlErrno' => $errno,
            'curlError' => $error,
            'transport' => 'curl',
            'contentType' => $this->normalize_header_media_type( $headers['content-type'] ?? '' ),
            'contentLength' => isset( $headers['content-length'] ) && is_numeric( $headers['content-length'] )
                ? (int)$headers['content-length']
                : null,
            'acceptRanges' => $headers['accept-ranges'] ?? '',
            'location' => $headers['location'] ?? '',
            'body' => $body,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fetch_external_media_header_sample_once_with_stream( string $url ): array {
        if ( !filter_var( ini_get( 'allow_url_fopen' ), FILTER_VALIDATE_BOOLEAN ) ) {
            return [ 'ok' => false, 'reason' => 'stream-unavailable' ];
        }

        $headers = [];
        $body = '';
        $max_bytes = 4096;
        $timeout = 5;
        $error_message = '';
        $context = stream_context_create( [
            'http' => [
                'method' => 'GET',
                'header' => implode( "\r\n", [
                    'Range: bytes=0-' . ( $max_bytes - 1 ),
                    'User-Agent: Ambient/' . $this->get_version(),
                ] ),
                'follow_location' => 0,
                'ignore_errors' => true,
                'timeout' => $timeout,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ] );

        set_error_handler( static function( int $severity, string $message ) use ( &$error_message ): bool {
            $error_message = $message;
            return true;
        } );
        try {
            $fp = fopen( $url, 'rb', false, $context );
        } finally {
            restore_error_handler();
        }

        if ( $fp === false ) {
            return [
                'ok' => false,
                'reason' => 'upstream-error',
                'streamError' => $error_message,
                'transport' => 'stream',
            ];
        }

        stream_set_timeout( $fp, $timeout );
        while ( !feof( $fp ) && strlen( $body ) < $max_bytes ) {
            $chunk = fread( $fp, $max_bytes - strlen( $body ) );
            if ( $chunk === false ) {
                break;
            }
            $body .= $chunk;
        }
        $meta = stream_get_meta_data( $fp );
        fclose( $fp );

        $wrapper_data = $meta['wrapper_data'] ?? [];
        if ( is_array( $wrapper_data ) ) {
            foreach ( $wrapper_data as $header ) {
                if ( !is_string( $header ) ) {
                    continue;
                }
                $headers[] = $header;
            }
        }
        $parsed_headers = $this->parse_external_media_response_headers( $headers );

        if ( !empty( $meta['timed_out'] ) && $body === '' ) {
            return [
                'ok' => false,
                'reason' => 'timeout',
                'httpStatus' => $parsed_headers['httpStatus'],
                'streamError' => $error_message,
                'transport' => 'stream',
            ];
        }

        return [
            'ok' => true,
            'httpStatus' => $parsed_headers['httpStatus'],
            'contentType' => $this->normalize_header_media_type( $parsed_headers['headers']['content-type'] ?? '' ),
            'contentLength' => isset( $parsed_headers['headers']['content-length'] ) && is_numeric( $parsed_headers['headers']['content-length'] )
                ? (int)$parsed_headers['headers']['content-length']
                : null,
            'acceptRanges' => $parsed_headers['headers']['accept-ranges'] ?? '',
            'location' => $parsed_headers['headers']['location'] ?? '',
            'body' => $body,
            'streamError' => $error_message,
            'transport' => 'stream',
        ];
    }

    /**
     * @param string[] $raw_headers
     * @return array{httpStatus:int,headers:array<string,string>}
     */
    private function parse_external_media_response_headers( array $raw_headers ): array {
        $headers = [];
        $http_status = 0;
        foreach ( $raw_headers as $header ) {
            $trimmed = trim( $header );
            if ( preg_match( '#^HTTP/\S+\s+(\d{3})#i', $trimmed, $matches ) === 1 ) {
                $http_status = (int)$matches[1];
                $headers = [];
                continue;
            }
            if ( $trimmed === '' || !str_contains( $trimmed, ':' ) ) {
                continue;
            }
            [ $name, $value ] = array_map( 'trim', explode( ':', $trimmed, 2 ) );
            $headers[strtolower( $name )] = $value;
        }

        return [
            'httpStatus' => $http_status,
            'headers' => $headers,
        ];
    }

    private function resolve_external_media_redirect_url( string $location, string $base_url ): ?string {
        if ( preg_match( '#^https?://#i', $location ) === 1 ) {
            return $location;
        }
        if ( str_starts_with( $location, '//' ) ) {
            $scheme = parse_url( $base_url, PHP_URL_SCHEME ) ?: 'https';
            return $scheme . ':' . $location;
        }

        $base = parse_url( $base_url );
        if ( !is_array( $base ) || empty( $base['scheme'] ) || empty( $base['host'] ) ) {
            return null;
        }
        $authority = $base['scheme'] . '://' . $base['host'] . ( isset( $base['port'] ) ? ':' . $base['port'] : '' );
        if ( str_starts_with( $location, '/' ) ) {
            return $authority . $location;
        }
        $path = isset( $base['path'] ) ? preg_replace( '#/[^/]*$#', '/', $base['path'] ) : '/';
        return $authority . $path . $location;
    }

    private function normalize_header_media_type( string $content_type ): string {
        $type = strtolower( trim( explode( ';', $content_type, 2 )[0] ?? '' ) );
        return $type;
    }

    /**
     * @return array{kind:?string,mime:?string,source:string}
     */
    private function detect_external_media_mime( string $body, string $content_type, string $url ): array {
        $content_type = $this->normalize_header_media_type( $content_type );
        $kind = $this->resolve_media_kind_from_mime( $content_type );
        if ( $kind !== null ) {
            return [ 'kind' => $kind, 'mime' => $content_type, 'source' => 'content-type' ];
        }

        $magic_mime = $this->detect_media_mime_from_magic_bytes( $body );
        $kind = $this->resolve_media_kind_from_mime( $magic_mime );
        if ( $kind !== null && $magic_mime !== null ) {
            return [ 'kind' => $kind, 'mime' => $magic_mime, 'source' => 'magic-bytes' ];
        }

        $extension_mime = $this->resolve_media_mime_from_url_extension( $url );
        $kind = $this->resolve_media_kind_from_mime( $extension_mime );
        if ( $kind !== null && $extension_mime !== null ) {
            return [ 'kind' => $kind, 'mime' => $extension_mime, 'source' => 'extension' ];
        }

        return [ 'kind' => null, 'mime' => null, 'source' => 'unknown' ];
    }

    private function resolve_media_kind_from_mime( ?string $mime ): ?string {
        if ( $mime === null || $mime === '' ) {
            return null;
        }
        if ( str_starts_with( $mime, 'audio/' ) ) {
            return 'audio';
        }
        if ( str_starts_with( $mime, 'video/' ) ) {
            return 'video';
        }
        if ( $mime === 'application/ogg' ) {
            return 'audio';
        }
        return null;
    }

    private function detect_media_mime_from_magic_bytes( string $body ): ?string {
        if ( strlen( $body ) < 4 ) {
            return null;
        }
        if ( str_starts_with( $body, 'ID3' ) ) {
            return 'audio/mpeg';
        }
        $first = ord( $body[0] );
        $second = ord( $body[1] );
        if ( $first === 0xFF && ( $second & 0xE0 ) === 0xE0 ) {
            return 'audio/mpeg';
        }
        if ( substr( $body, 4, 4 ) === 'ftyp' ) {
            return 'video/mp4';
        }
        if ( str_starts_with( $body, 'OggS' ) ) {
            return 'application/ogg';
        }
        if ( str_starts_with( $body, 'fLaC' ) ) {
            return 'audio/flac';
        }
        if ( str_starts_with( $body, "RIFF" ) && substr( $body, 8, 4 ) === 'WAVE' ) {
            return 'audio/wav';
        }
        if ( str_starts_with( $body, "RIFF" ) && substr( $body, 8, 4 ) === 'AVI ' ) {
            return 'video/x-msvideo';
        }
        if ( substr( $body, 0, 4 ) === "\x1A\x45\xDF\xA3" ) {
            return 'video/webm';
        }
        if ( $first === 0xFF && ( $second === 0xF1 || $second === 0xF9 ) ) {
            return 'audio/aac';
        }
        return null;
    }

    private function resolve_media_mime_from_url_extension( string $url ): ?string {
        $path = (string)( parse_url( $url, PHP_URL_PATH ) ?? '' );
        $extension = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
        $map = [
            'aac' => 'audio/aac',
            'mid' => 'audio/midi',
            'midi' => 'audio/midi',
            'mp3' => 'audio/mpeg',
            'm4a' => 'audio/mp4',
            'ogg' => 'audio/ogg',
            'opus' => 'audio/opus',
            'wav' => 'audio/wav',
            'weba' => 'audio/webm',
            'wma' => 'audio/x-ms-wma',
            'avi' => 'video/x-msvideo',
            'mpeg' => 'video/mpeg',
            'mpg' => 'video/mpeg',
            'mp4' => 'video/mp4',
            'ogv' => 'video/ogg',
            'ts' => 'video/mp2t',
            'webm' => 'video/webm',
            '3gp' => 'video/3gpp',
            '3g2' => 'video/3gpp2',
        ];
        return $map[$extension] ?? null;
    }

    /**
     * @param array<string, mixed>|null $usage
     */
    private function set_youtube_metadata_error( int $code, string $reason, string $message, ?array $usage = null ): void {
        $data = [
            'message' => $message,
            'reason' => $reason,
        ];
        if ( $usage !== null ) {
            $data['usage'] = $usage;
        }
        $this->api_response = [
            'state' => 'error',
            'code'  => $code,
            'data'  => $data,
        ];
    }

    private function get_youtube_metadata_monthly_limit(): ?int {
        $raw_limit = amp_env( 'YOUTUBE_METADATA_MONTHLY_LIMIT', '10000' );
        if ( $raw_limit !== null && strtolower( trim( $raw_limit ) ) === 'unlimited' ) {
            return null;
        }
        $limit = is_numeric( $raw_limit ) ? (int)$raw_limit : 10000;
        return $limit > 0 ? $limit : 10000;
    }

    private function get_youtube_metadata_timeout_seconds(): int {
        $timeout_ms = amp_env( 'YOUTUBE_METADATA_TIMEOUT_MS', '5000' );
        $timeout = is_numeric( $timeout_ms ) ? (int)$timeout_ms : 5000;
        $timeout = max( 1000, min( 15000, $timeout ) );
        return (int)ceil( $timeout / 1000 );
    }

    private function get_youtube_metadata_counter_path(): string {
        return amp_resolve_path(
            (string)amp_env( 'YOUTUBE_METADATA_COUNTER_PATH', 'logs/youtube-metadata-usage.json' ),
            APP_ROOT
        );
    }

    private function get_youtube_metadata_month_key(): string {
        return ( new \DateTimeImmutable( 'now' ) )->format( 'Y-m' );
    }

    /**
     * @return array{month:string,count:int,limit:int|null,limited:bool}|null
     */
    private function read_youtube_metadata_usage(): ?array {
        $counter = $this->read_youtube_metadata_counter();
        if ( $counter === null ) {
            return null;
        }
        $month = $this->get_youtube_metadata_month_key();
        $count = 0;
        if (
            isset( $counter['months'][$month] ) &&
            is_array( $counter['months'][$month] ) &&
            isset( $counter['months'][$month]['youtubeMetadataRequests'] ) &&
            is_numeric( $counter['months'][$month]['youtubeMetadataRequests'] )
        ) {
            $count = max( 0, (int)$counter['months'][$month]['youtubeMetadataRequests'] );
        }
        $limit = $this->get_youtube_metadata_monthly_limit();
        return [
            'month' => $month,
            'count' => $count,
            'limit' => $limit,
            'limited' => $limit !== null && $count >= $limit,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function read_youtube_metadata_counter(): ?array {
        $path = $this->get_youtube_metadata_counter_path();
        if ( !file_exists( $path ) ) {
            return [
                'version' => 1,
                'months' => [],
            ];
        }
        if ( !is_readable( $path ) ) {
            return null;
        }
        $raw = file_get_contents( $path );
        if ( $raw === false || trim( $raw ) === '' ) {
            return [
                'version' => 1,
                'months' => [],
            ];
        }
        $decoded = json_decode( $raw, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $decoded ) ) {
            return null;
        }
        if ( !isset( $decoded['months'] ) || !is_array( $decoded['months'] ) ) {
            $decoded['months'] = [];
        }
        $decoded['version'] = 1;
        return $decoded;
    }

    /**
     * @return array{month:string,count:int,limit:int|null,limited:bool}|null
     */
    private function increment_youtube_metadata_usage(): ?array {
        $counter = $this->read_youtube_metadata_counter();
        if ( $counter === null ) {
            return null;
        }

        $month = $this->get_youtube_metadata_month_key();
        if ( !isset( $counter['months'][$month] ) || !is_array( $counter['months'][$month] ) ) {
            $counter['months'][$month] = [
                'youtubeMetadataRequests' => 0,
            ];
        }
        $current_count = isset( $counter['months'][$month]['youtubeMetadataRequests'] ) && is_numeric( $counter['months'][$month]['youtubeMetadataRequests'] )
            ? (int)$counter['months'][$month]['youtubeMetadataRequests']
            : 0;
        $counter['months'][$month]['youtubeMetadataRequests'] = max( 0, $current_count ) + 1;
        $counter['months'][$month]['updatedAt'] = ( new \DateTimeImmutable( 'now' ) )->format( DATE_ATOM );

        $path = $this->get_youtube_metadata_counter_path();
        $dir = dirname( $path );
        if ( !is_dir( $dir ) && !@mkdir( $dir, 0755, true ) ) {
            return null;
        }

        $json = json_encode( $counter, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
        if ( $json === false || @file_put_contents( $path, $json . "\n", LOCK_EX ) === false ) {
            return null;
        }

        return $this->read_youtube_metadata_usage();
    }

    /**
     * @return array{ok:bool,title?:string,artist?:string,desc?:string,reason?:string}
     */
    private function request_youtube_metadata_from_api( string $video_id, string $api_key ): array {
        $query = http_build_query( [
            'part' => 'snippet',
            'id' => $video_id,
            'key' => $api_key,
        ] );
        $url = 'https://www.googleapis.com/youtube/v3/videos?' . $query;
        $timeout = $this->get_youtube_metadata_timeout_seconds();
        $body = false;

        if ( function_exists( 'curl_init' ) ) {
            $ch = curl_init( $url );
            if ( $ch !== false ) {
                curl_setopt_array( $ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => $timeout,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_FOLLOWLOCATION => false,
                    CURLOPT_USERAGENT => 'Ambient/' . $this->get_version(),
                ] );
                $body = curl_exec( $ch );
                $http_code = (int)curl_getinfo( $ch, CURLINFO_HTTP_CODE );
                curl_close( $ch );
                if ( $body === false || $http_code < 200 || $http_code >= 300 ) {
                    return [ 'ok' => false, 'reason' => 'upstream-error' ];
                }
            }
        } else {
            $context = stream_context_create( [
                'http' => [
                    'method' => 'GET',
                    'timeout' => $timeout,
                    'ignore_errors' => true,
                    'header' => "User-Agent: Ambient/" . $this->get_version() . "\r\n",
                ],
            ] );
            $body = @file_get_contents( $url, false, $context );
            if ( $body === false ) {
                return [ 'ok' => false, 'reason' => 'upstream-error' ];
            }
        }

        $decoded = json_decode( (string)$body, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $decoded ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }
        if ( isset( $decoded['error'] ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }
        if ( empty( $decoded['items'] ) || !is_array( $decoded['items'] ) ) {
            return [ 'ok' => false, 'reason' => 'not-found' ];
        }
        $snippet = $decoded['items'][0]['snippet'] ?? null;
        if ( !is_array( $snippet ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }

        return [
            'ok' => true,
            'title' => is_string( $snippet['title'] ?? null ) ? $snippet['title'] : '',
            'artist' => is_string( $snippet['channelTitle'] ?? null ) ? $snippet['channelTitle'] : '',
            'desc' => is_string( $snippet['description'] ?? null ) ? $snippet['description'] : '',
        ];
    }

    /**
     * Normalize empty, malformed, or legacy playlist payloads into a safe category map.
     *
     * @param mixed $playlist_data
     * @return array
     */
    private function normalize_playlist_data( $playlist_data ): array {
        if ( !is_array( $playlist_data ) ) {
            return [];
        }

        if (
            array_key_exists( 'media', $playlist_data ) &&
            is_array( $playlist_data['media'] )
        ) {
            $normalized = $playlist_data['media'];
            if ( array_key_exists( 'options', $playlist_data ) ) {
                $normalized['options'] = is_array( $playlist_data['options'] )
                    ? $playlist_data['options']
                    : null;
            }
            return $normalized;
        }

        foreach ( $playlist_data as $category => $items ) {
            if ( $category === 'options' ) {
                continue;
            }
            if ( !is_array( $items ) ) {
                unset( $playlist_data[$category] );
            }
        }

        return $playlist_data;
    }

    /**
     * This is an API endpoint to search for the corresponding file in the media directory 
     * and obtain the relative path.
     * 
     * @param  string $filename
     * @return void             At post-processing returns an array for the response.
     */
    private function get_filepath( string $filename ): void {
        $normalized_filename = str_replace( '\\', '/', trim( $filename ) );
        $basename_filename = basename( $normalized_filename );
        $candidate_needles = array_values( array_unique( array_filter( [
            $normalized_filename,
            $basename_filename,
        ], function( $item ) {
            return $item !== '';
        } ) ) );
        $is_bracket_filename = preg_match( '/\[(.*)\]/', $filename ) === 1;
        $extension = strtolower( pathinfo( $basename_filename, PATHINFO_EXTENSION ) );
        $files = [];

        $scan_media = function( string $real_dir, string $logical_dir, array $ancestor_realpaths = [] ) use ( &$scan_media, &$files, $candidate_needles, $is_bracket_filename, $extension ): void {
            if ( !is_dir( $real_dir ) ) {
                return;
            }

            $entries = @scandir( $real_dir );
            if ( !is_array( $entries ) ) {
                return;
            }

            foreach ( $entries as $entry ) {
                if ( $entry === '.' || $entry === '..' ) {
                    continue;
                }

                $absolute_path = $real_dir . DIRECTORY_SEPARATOR . $entry;
                $logical_path = $logical_dir . '/' . $entry;

                if ( is_dir( $absolute_path ) ) {
                    $resolved_dir = realpath( $absolute_path );
                    if ( $resolved_dir === false ) {
                        continue;
                    }
                    if ( in_array( $resolved_dir, $ancestor_realpaths, true ) ) {
                        continue;
                    }
                    $next_ancestors = $ancestor_realpaths;
                    $next_ancestors[] = $resolved_dir;
                    $scan_media( $resolved_dir, $logical_path, $next_ancestors );
                    continue;
                }

                if ( !is_file( $absolute_path ) ) {
                    continue;
                }

                if ( $is_bracket_filename ) {
                    if ( $extension !== '' && strtolower( pathinfo( $absolute_path, PATHINFO_EXTENSION ) ) !== $extension ) {
                        continue;
                    }
                    $matched = false;
                    foreach ( $candidate_needles as $needle ) {
                        if ( str_contains( str_replace( '\\', '/', $absolute_path ), $needle ) || str_contains( $logical_path, $needle ) ) {
                            $matched = true;
                            break;
                        }
                    }
                    if ( !$matched ) {
                        continue;
                    }
                } else {
                    $matched = false;
                    foreach ( $candidate_needles as $needle ) {
                        if ( $needle === '' ) {
                            continue;
                        }
                        $lower_needle = strtolower( $needle );
                        $absolute_normalized = strtolower( str_replace( '\\', '/', $absolute_path ) );
                        $logical_normalized = strtolower( $logical_path );
                        if ( str_ends_with( $absolute_normalized, $lower_needle ) || str_ends_with( $logical_normalized, $lower_needle ) || strtolower( basename( $absolute_path ) ) === $lower_needle ) {
                            $matched = true;
                            break;
                        }
                    }
                    if ( !$matched ) {
                        continue;
                    }
                }

                $files[] = [
                    'absolute' => str_replace( '\\', '/', $absolute_path ),
                    'logical'  => $logical_path,
                ];
            }
        };

        $media_root_real = realpath( MEDIA_DIR );
        if ( $media_root_real !== false ) {
            $scan_media( $media_root_real, 'assets/media', [ $media_root_real ] );
        }

        $relative_filepath = '';
        if ( !empty( $files ) && !empty( $files[0]['logical'] ) ) {
            $relative_filepath = './' . ltrim( str_replace( '\\', '/', (string)$files[0]['logical'] ), './' );
        } elseif ( $normalized_filename !== '' && file_exists( $normalized_filename ) ) {
            $relative_filepath = str_replace( '\\', '/', $normalized_filename );
        }

        $this->logger( __METHOD__, $filename, $files, $relative_filepath );
        if ( empty( $relative_filepath ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 404,
                'data'  => $this->__( 'File not found in media directory.' ),
            ];
        } else {
            $this->api_response = [
                'state' => 'ok',
                'code'  => 200,
                'data'  => rawurlencode( $relative_filepath ),
            ];
        }
    }

    /**
     * This is an API endpoint that creates a symbolic link for the specified destination 
     * into the media directory.
     * 
     * @param  string $local_media_dir
     * @param  string $symlink_name
     * @return void                    At post-processing returns an array for the response.
     */
    private function create_symlink( string $local_media_dir, string $symlink_name ): void {
        $error_message = '';
        if ( !$this->is_local() ) {
            $error_message = $this->__( 'This feature cannot be performed on remote hosts.' );
        } elseif ( !file_exists( $local_media_dir ) ) {
            $error_message = $this->__( 'The path to link to does not exist.' );
        } elseif ( file_exists( MEDIA_DIR . $symlink_name ) ) {
            $error_message = $this->__( 'A link with the same name already exists.' );
        } else {
            if ( DIRECTORY_SEPARATOR === '\\' ) {
                // Prefer PowerShell New-Item for symbolic links and fallback to mklink.
                $link_path = MEDIA_DIR . $symlink_name;
                $ps_target = str_replace( "'", "''", $local_media_dir );
                $ps_link   = str_replace( "'", "''", $link_path );

                $ps_script = "try { New-Item -ItemType SymbolicLink -Path '$ps_link' -Target '$ps_target' -ErrorAction Stop | Out-Null; exit 0 } catch { Write-Output \$_.Exception.Message; exit 1 }";
                $exec_command = sprintf( 'powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "%s"', $ps_script );
                $output = [];
                $returnCode = 0;
                exec( $exec_command, $output, $returnCode );
                $this->logger( __METHOD__, 'for Windows PowerShell New-Item', $exec_command, $output, $returnCode );

                if ( $returnCode !== 0 ) {
                    $fallback_command = sprintf( 'cmd /c mklink /D "%s" "%s"', $link_path, $local_media_dir );
                    $fallback_output = [];
                    $fallback_return_code = 0;
                    exec( $fallback_command, $fallback_output, $fallback_return_code );
                    $this->logger( __METHOD__, 'for Windows mklink fallback', $fallback_command, $fallback_output, $fallback_return_code );

                    if ( $fallback_return_code !== 0 ) {
                        $error_message = $this->__( 'Failed to create symbolic link.' );
                    }
                }
            } else {
                // Use `ln` on Linux OS etc.
                $command = 'ln';
                $check   = shell_exec( 'which ' . escapeshellarg( $command ) );
                if ( $check == null ) {
                    $error_message = $this->__( 'The command to make symbolic link is not available in the current environment.' );
                } else {
                    $exec_command = sprintf( '%s -s "%s" "%s"', $command, $local_media_dir, MEDIA_DIR . $symlink_name );
                    exec( $exec_command, $output, $returnCode );
                    $this->logger( __METHOD__, 'for Linux', $exec_command, $output, $returnCode );
                    if ( $returnCode !== 0 ) {
                        $error_message = $this->__( 'Failed to create symbolic link.' );
                    }
                }
            }
        }
        if ( !empty( $error_message ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => $error_message,
                //'cmd'   => isset( $exec_command ) ? $exec_command : null,
            ];
        } else {
            $this->api_response = [
                'state' => 'ok',
                'code'  => 200,
                'data'  => $this->__( 'Symbolic link created successfully.' ),
                //'cmd'   => $exec_command,
            ];
        }
    }

    /**
     * This is an API endpoint that saves (upserts) playlist JSON data to the specified file.
     * Accepts JSON body in POST request and writes it to the playlist file.
     *
     * @param  string $playlist_file
     * @return void                    At post-processing returns an array for the response.
     */
    private function upsert_playlist( string $playlist_file ): void {
        $this->find_playlist();

        if ( !array_key_exists( $playlist_file, $this->playlists ) ) {
            $can_create_local_playlist =
                $this->is_local() &&
                preg_match( '/^[A-Za-z0-9._-]+\.json$/i', $playlist_file ) === 1;

            if ( !$can_create_local_playlist ) {
                $this->api_response = [
                    'state' => 'error',
                    'code'  => 404,
                    'data'  => [
                        'message' => $this->__( 'Specified playlist could not be found.' ),
                    ],
                ];
                return;
            }

            if ( !is_dir( ASSETS_DIR ) ) {
                @mkdir( ASSETS_DIR, 0755, true );
            }

            $playlist_path = ASSETS_DIR . basename( $playlist_file );
            $seed_data = json_encode( [ 'options' => new \stdClass() ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
            if ( $seed_data === false ) {
                $seed_data = "{\n    \"options\": {}\n}";
            }
            if ( !file_exists( $playlist_path ) ) {
                @file_put_contents( $playlist_path, $seed_data . "\n", LOCK_EX );
            }
            if ( !file_exists( $playlist_path ) ) {
                $this->api_response = [
                    'state' => 'error',
                    'code'  => 500,
                    'data'  => [
                        'message' => $this->__( 'Failed to write playlist file.' ),
                    ],
                ];
                return;
            }

            $this->playlists[$playlist_file] = $playlist_path;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $data = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $data ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $before_proxy_urls = [];
        $playlist_path = $this->playlists[$playlist_file];
        if ( $this->is_local() && is_file( $playlist_path ) ) {
            $before_raw = @file_get_contents( $playlist_path );
            $before_decoded = is_string( $before_raw ) ? json_decode( $before_raw, true ) : null;
            if ( is_array( $before_decoded ) ) {
                $before_proxy_urls = $this->collect_local_media_proxy_cache_urls( $before_decoded );
            }
        }
        $after_proxy_urls = $this->is_local()
            ? $this->collect_local_media_proxy_cache_urls( $data )
            : [];

        $json_content = json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        $result = file_put_contents( $this->playlists[$playlist_file], $json_content );
        if ( $result === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to write playlist file.' ),
                ],
            ];
            return;
        }
        if ( $this->is_local() ) {
            $this->cleanup_removed_local_media_proxy_cache_urls( $before_proxy_urls, $after_proxy_urls );
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Playlist saved successfully.' ),
            ],
        ];
    }

    /**
     * Import playlist JSON and save it to assets/ in local mode.
     *
     * Request body:
     * {
     *   "filename": "example.json",
     *   "playlist": { ... }
     * }
     */
    private function save_media_thumbnail(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] ) ? trim( $payload['filename'] ) : '';
        $content = isset( $payload['content'] ) && is_string( $payload['content'] ) ? trim( $payload['content'] ) : '';
        if ( $filename === '' || $content === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid request data.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_thumbnail_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only image files are accepted.' ),
                ],
            ];
            return;
        }

        $binary = base64_decode( $content, true );
        if ( $binary === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid image data.' ),
                ],
            ];
            return;
        }

        $target_path = IMAGES_DIR . $safe_filename;
        $written = @file_put_contents( $target_path, $binary );
        if ( $written === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save thumbnail image.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Thumbnail image saved successfully.' ),
                'filename' => $safe_filename,
            ],
        ];
    }

    private function delete_media_thumbnail(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] ) ? trim( $payload['filename'] ) : '';
        if ( $filename === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid request data.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_thumbnail_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only image files are accepted.' ),
                ],
            ];
            return;
        }

        $target_path = IMAGES_DIR . $safe_filename;
        if ( file_exists( $target_path ) && !@unlink( $target_path ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to delete thumbnail image.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Thumbnail image deleted successfully.' ),
                'filename' => $safe_filename,
            ],
        ];
    }

    private function generate_media_thumbnail(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [ 'message' => $this->__( 'This feature cannot be performed on remote hosts.' ) ],
            ];
            return;
        }

        $ffmpeg_path = $this->get_configured_ffmpeg_path();
        if ( $ffmpeg_path === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [ 'message' => $this->__( 'Thumbnail generation is not configured.' ) ],
            ];
            return;
        }

        $payload = json_decode( file_get_contents( 'php://input' ), true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [ 'message' => $this->__( 'Invalid JSON data.' ) ],
            ];
            return;
        }

        $seek_time = isset( $payload['seekTime'] ) && is_numeric( $payload['seekTime'] ) ? max( 0, (float)$payload['seekTime'] ) : null;
        $source_error = null;
        $source = $this->resolve_media_thumbnail_source( $payload, $source_error );
        if ( $seek_time === null || $source === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid request data.' ),
                    'reason' => $seek_time === null ? 'invalid-seek-time' : ( $source_error['reason'] ?? 'invalid-source' ),
                    'details' => $source_error['details'] ?? null,
                ],
            ];
            return;
        }

        $resolved = $source['path'];
        $hash_source = str_replace( '\\', '/', $source['hashSource'] );
        $filename = sha1( $hash_source ) . '.webp';
        $tmp_file = tempnam( sys_get_temp_dir(), 'ambient-thumb-' );
        if ( $tmp_file === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [ 'message' => $this->__( 'Failed to generate thumbnail image.' ) ],
            ];
            return;
        }
        $tmp_output = $tmp_file . '.webp';
        @unlink( $tmp_file );

        $cmd = [
            $ffmpeg_path,
            '-y',
            '-ss',
            (string)$seek_time,
            '-i',
            $resolved,
            '-frames:v',
            '1',
            '-vf',
            'scale=640:-1',
            '-f',
            'webp',
            $tmp_output,
        ];
        $descriptor = [
            0 => [ 'pipe', 'r' ],
            1 => [ 'pipe', 'w' ],
            2 => [ 'pipe', 'w' ],
        ];
        $process = proc_open( $cmd, $descriptor, $pipes );
        if ( !is_resource( $process ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [ 'message' => $this->__( 'Failed to generate thumbnail image.' ) ],
            ];
            return;
        }
        fclose( $pipes[0] );
        stream_get_contents( $pipes[1] );
        $stderr = stream_get_contents( $pipes[2] );
        fclose( $pipes[1] );
        fclose( $pipes[2] );
        $exit_code = proc_close( $process );
        if ( $exit_code !== 0 || !file_exists( $tmp_output ) ) {
            @unlink( $tmp_output );
            $this->logger( __METHOD__, 'ffmpeg failed', $exit_code, $stderr );
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to generate thumbnail image.' ),
                    'reason' => 'ffmpeg-failed',
                    'details' => [
                        'exitCode' => $exit_code,
                        'stderr' => $this->truncate_debug_text( $stderr, 2000 ),
                    ],
                ],
            ];
            return;
        }

        $content = file_get_contents( $tmp_output );
        @unlink( $tmp_output );
        if ( $content === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [ 'message' => $this->__( 'Failed to generate thumbnail image.' ) ],
            ];
            return;
        }

        $base64 = base64_encode( $content );
        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Thumbnail image generated successfully.' ),
                'filename' => $filename,
                'mime' => 'image/webp',
                'content' => $base64,
                'dataUrl' => 'data:image/webp;base64,' . $base64,
            ],
        ];
    }

    /**
     * @param array<string,mixed> $payload
     * @param ?array<string,mixed> $error
     * @return array{path:string,hashSource:string}|null
     */
    private function resolve_media_thumbnail_source( array $payload, ?array &$error = null ): ?array {
        $source = isset( $payload['source'] ) && is_string( $payload['source'] ) ? trim( $payload['source'] ) : '';
        if ( $source === 'range-proxy' ) {
            if ( !function_exists( 'curl_init' ) ) {
                $error = [ 'reason' => 'curl-unavailable' ];
                return null;
            }
            $playlist_file = isset( $payload['playlist'] ) && is_string( $payload['playlist'] ) ? trim( $payload['playlist'] ) : '';
            $media_id = isset( $payload['media'] ) && is_numeric( $payload['media'] ) ? (int)$payload['media'] : -1;
            if ( $playlist_file === '' || $media_id < 0 ) {
                $error = [
                    'reason' => 'invalid-range-proxy-reference',
                    'details' => [
                        'playlist' => $playlist_file,
                        'media' => $media_id,
                    ],
                ];
                return null;
            }
            $target = $this->resolve_range_proxy_media_target( $playlist_file, $media_id );
            if ( $target === null || !$this->is_safe_external_media_check_url( $target['url'] ) ) {
                $error = [
                    'reason' => 'range-proxy-target-not-found',
                    'details' => [
                        'playlist' => $playlist_file,
                        'media' => $media_id,
                    ],
                ];
                return null;
            }
            if ( !$this->is_video_media_source( $target['url'], $target['mime'] ) ) {
                $error = [
                    'reason' => 'range-proxy-target-not-video',
                    'details' => [
                        'mime' => $target['mime'],
                        'url' => $target['url'],
                    ],
                ];
                return null;
            }
            $cache = $this->ensure_local_media_proxy_cache( $target['url'], $target['mime'] );
            if ( !$cache['ok'] || !isset( $cache['file'] ) || !is_string( $cache['file'] ) || !is_file( $cache['file'] ) ) {
                $error = [
                    'reason' => 'range-proxy-cache-unavailable',
                    'details' => [
                        'cacheReason' => $cache['reason'] ?? null,
                        'cacheCode' => $cache['code'] ?? null,
                    ],
                ];
                return null;
            }
            return [
                'path' => $cache['file'],
                'hashSource' => 'range-proxy:' . $playlist_file . ':' . $media_id . ':' . $target['url'],
            ];
        }

        $file = isset( $payload['file'] ) && is_string( $payload['file'] ) ? trim( $payload['file'] ) : '';
        if ( $file === '' ) {
            $error = [ 'reason' => 'missing-file' ];
            return null;
        }
        $resolved = $this->resolve_local_video_media_path( $file );
        if ( $resolved === null ) {
            $error = [
                'reason' => 'invalid-local-video-path',
                'details' => [ 'file' => $file ],
            ];
            return null;
        }
        return [
            'path' => $resolved,
            'hashSource' => $file,
        ];
    }

    private function is_video_media_source( string $url, string $mime ): bool {
        $normalized_mime = strtolower( trim( $mime ) );
        if ( str_starts_with( $normalized_mime, 'video/' ) ) {
            return true;
        }
        $path = parse_url( $url, PHP_URL_PATH );
        $extension = is_string( $path ) ? strtolower( pathinfo( $path, PATHINFO_EXTENSION ) ) : '';
        return in_array( $extension, [ 'mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi', 'mkv' ], true );
    }

    private function truncate_debug_text( string $text, int $max_length ): string {
        if ( strlen( $text ) <= $max_length ) {
            return $text;
        }
        return substr( $text, 0, $max_length ) . '...';
    }

    private function resolve_local_video_media_path( string $file ): ?string {
        $normalized = ltrim( str_replace( '\\', '/', trim( $file ) ), './' );
        $normalized = preg_replace( '#^assets/media/#', '', $normalized ) ?? $normalized;
        if ( $normalized === '' || str_contains( $normalized, '..' ) || preg_match( '/^([a-z][a-z0-9+.-]*):/i', $normalized ) ) {
            return null;
        }
        $extension = strtolower( pathinfo( $normalized, PATHINFO_EXTENSION ) );
        if ( !in_array( $extension, [ 'mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi', 'mkv' ], true ) ) {
            return null;
        }
        $candidate = MEDIA_DIR . $normalized;
        $real_media_dir = realpath( MEDIA_DIR );
        $real_candidate = realpath( $candidate );
        if ( $real_media_dir === false || $real_candidate === false ) {
            return null;
        }
        $media_root = rtrim( str_replace( '\\', '/', $real_media_dir ), '/' ) . '/';
        $target = str_replace( '\\', '/', $real_candidate );
        if ( !str_starts_with( $target, $media_root ) ) {
            return null;
        }
        return $real_candidate;
    }

    private function sanitize_thumbnail_filename( string $filename ): ?string {
        $base = basename( $filename );
        $safe = preg_replace( '/[^A-Za-z0-9._-]/', '_', $base );
        if ( !is_string( $safe ) ) {
            return null;
        }
        $safe = trim( $safe );
        if ( $safe === '' ) {
            return null;
        }
        $extension = strtolower( pathinfo( $safe, PATHINFO_EXTENSION ) );
        if ( !in_array( $extension, [ 'png', 'jpeg', 'jpg', 'gif', 'webp' ], true ) ) {
            return null;
        }
        return $safe;
    }

    private function import_playlist(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] )
            ? trim( $payload['filename'] )
            : '';
        if ( $filename === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Please choose a playlist JSON file.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_import_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only .json files are accepted.' ),
                ],
            ];
            return;
        }

        $playlist = $payload['playlist'] ?? null;
        if ( !is_array( $playlist ) || !$this->validate_playlist_schema_contract( $playlist ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'The selected file does not match the playlist schema.' ),
                ],
            ];
            return;
        }

        $reject_count = 0;
        $total_items = 0;
        $normalized = $this->sanitize_and_normalize_playlist( $playlist, $reject_count, $total_items );
        if ( $normalized === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'Unsafe or invalid media entries exceeded the allowed limit.' ),
                ],
            ];
            return;
        }

        if ( !$this->validate_playlist_schema_contract( $normalized ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'The selected file does not match the playlist schema.' ),
                ],
            ];
            return;
        }

        $resolved_filename = $this->resolve_available_import_filename( $safe_filename, ASSETS_DIR );
        if ( $resolved_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        $target_path = ASSETS_DIR . $resolved_filename;
        $before_proxy_urls = [];
        if ( $this->is_local() && is_file( $target_path ) ) {
            $before_raw = @file_get_contents( $target_path );
            $before_decoded = is_string( $before_raw ) ? json_decode( $before_raw, true ) : null;
            if ( is_array( $before_decoded ) ) {
                $before_proxy_urls = $this->collect_local_media_proxy_cache_urls( $before_decoded );
            }
        }
        $after_proxy_urls = $this->is_local()
            ? $this->collect_local_media_proxy_cache_urls( $normalized )
            : [];

        $json_content = json_encode( $normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
        if ( $json_content === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        $tmp_path = $target_path . '.tmp-' . bin2hex( random_bytes( 8 ) );
        $written = @file_put_contents( $tmp_path, $json_content );
        if ( $written === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        if ( !@rename( $tmp_path, $target_path ) ) {
            @unlink( $tmp_path );
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }
        if ( $this->is_local() ) {
            $this->cleanup_removed_local_media_proxy_cache_urls( $before_proxy_urls, $after_proxy_urls );
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Playlist imported successfully.' ),
                'filename' => $resolved_filename,
                'rejected' => $reject_count,
                'total' => $total_items,
            ],
        ];
    }

    private function sanitize_import_filename( string $filename ): ?string {
        $base = basename( $filename );
        $name = preg_replace( '/[^A-Za-z0-9._-]/', '_', $base );
        if ( !is_string( $name ) ) {
            return null;
        }
        $name = trim( $name );
        if ( $name === '' || !preg_match( '/\.json$/i', $name ) ) {
            return null;
        }
        if ( preg_match( '/^lang(?:-|\.|$)/i', $name ) ) {
            return null;
        }
        return $name;
    }

    private function resolve_available_import_filename( string $safe_filename, string $target_dir ): ?string {
        $extension = pathinfo( $safe_filename, PATHINFO_EXTENSION );
        $base_name = pathinfo( $safe_filename, PATHINFO_FILENAME );
        $candidate = $safe_filename;
        $max_attempts = 1000;

        for ( $i = 0; $i <= $max_attempts; $i++ ) {
            if ( !file_exists( $target_dir . $candidate ) ) {
                return $candidate;
            }
            $candidate = sprintf( '%s-%d.%s', $base_name, $i + 1, $extension );
        }

        return null;
    }

    private function validate_playlist_schema_contract( array $playlist ): bool {
        foreach ( $playlist as $category => $items ) {
            if ( $category === 'options' ) {
                if ( !is_array( $items ) ) {
                    return false;
                }
                continue;
            }
            if ( !is_string( $category ) || trim( $category ) === '' || !is_array( $items ) ) {
                return false;
            }
            foreach ( $items as $item ) {
                if ( !is_array( $item ) ) {
                    return false;
                }
                $title = isset( $item['title'] ) && is_string( $item['title'] ) ? trim( $item['title'] ) : '';
                if ( $title === '' ) {
                    return false;
                }
            }
        }
        return true;
    }

    private function sanitize_and_normalize_playlist( array $playlist, int &$reject_count, int &$total_items ): ?array {
        $normalized = [];
        $reject_count = 0;
        $total_items = 0;

        foreach ( $playlist as $category => $items ) {
            if ( $category === 'options' ) {
                if ( is_array( $items ) ) {
                    $normalized['options'] = $this->sanitize_and_normalize_options( $items );
                }
                continue;
            }

            $safe_category = $this->sanitize_text( $category, 100 );
            if ( $safe_category === '' || !is_array( $items ) ) {
                continue;
            }

            $normalized_items = [];
            foreach ( $items as $item ) {
                if ( !is_array( $item ) ) {
                    $reject_count++;
                    continue;
                }
                $total_items++;
                $safe_item = $this->sanitize_and_normalize_media_item( $item );
                if ( $safe_item === null ) {
                    $reject_count++;
                    continue;
                }
                $normalized_items[] = $safe_item;
            }

            $normalized[$safe_category] = $normalized_items;
        }

        if ( $reject_count > 10 || ( $reject_count / max( 1, $total_items ) ) > 0.05 ) {
            return null;
        }

        if ( count( array_filter( array_keys( $normalized ), function( $key ) {
            return $key !== 'options';
        } ) ) === 0 ) {
            return null;
        }

        return $normalized;
    }

    private function sanitize_and_normalize_options( array $options ): array {
        $normalized = [];

        foreach ( $options as $key => $value ) {
            if ( !is_string( $key ) || trim( $key ) === '' ) {
                continue;
            }
            if ( is_bool( $value ) ) {
                $normalized[$key] = $value;
                continue;
            }
            if ( is_int( $value ) || is_float( $value ) ) {
                $normalized[$key] = $value;
                continue;
            }
            if ( is_string( $value ) ) {
                $normalized[$key] = $this->sanitize_text( $value, 500 );
                continue;
            }
            if ( $value === null ) {
                $normalized[$key] = null;
            }
        }

        if ( isset( $normalized['volume'] ) ) {
            $volume = $this->normalize_non_negative_number( $normalized['volume'] );
            if ( $volume === null ) {
                unset( $normalized['volume'] );
            } else {
                $normalized['volume'] = max( 0, min( 100, $volume ) );
            }
        }

        foreach ( [ 'random', 'shuffle', 'seek', 'fader', 'dark', 'autoplay' ] as $key ) {
            if ( array_key_exists( $key, $normalized ) ) {
                $bool_value = $this->normalize_boolish( $normalized[$key] );
                if ( $bool_value === null ) {
                    unset( $normalized[$key] );
                } else {
                    $normalized[$key] = $bool_value;
                }
            }
        }

        return $normalized;
    }

    private function sanitize_and_normalize_media_item( array $item ): ?array {
        $title = $this->sanitize_text( (string)( $item['title'] ?? '' ), 100 );
        if ( $title === '' ) {
            return null;
        }

        $normalized = [
            'title' => $title,
        ];

        $artist = $this->sanitize_text( (string)( $item['artist'] ?? '' ), 100 );
        if ( $artist !== '' ) {
            $normalized['artist'] = $artist;
        }

        $desc = $this->sanitize_text( (string)( $item['desc'] ?? '' ), 1000, true );
        if ( $desc !== '' ) {
            $normalized['desc'] = $desc;
        }

        foreach ( [ 'file', 'image', 'thumb' ] as $key ) {
            if ( !array_key_exists( $key, $item ) ) {
                continue;
            }
            $value = is_string( $item[$key] ) ? trim( $item[$key] ) : '';
            if ( $value === '' ) {
                continue;
            }
            if ( $this->has_unsafe_scheme( $value ) ) {
                return null;
            }
            $normalized[$key] = $this->sanitize_text( $value, 300 );
        }

        if ( array_key_exists( 'videoid', $item ) && is_string( $item['videoid'] ) ) {
            $videoid = $this->sanitize_text( $item['videoid'], 100 );
            if ( $videoid !== '' ) {
                $normalized['videoid'] = $videoid;
            }
        }

        if ( array_key_exists( 'mediaKind', $item ) && is_string( $item['mediaKind'] ) ) {
            $media_kind = strtolower( trim( $item['mediaKind'] ) );
            if ( $media_kind === 'audio' || $media_kind === 'video' ) {
                $normalized['mediaKind'] = $media_kind;
            }
        }

        if ( array_key_exists( 'mediaMime', $item ) && is_string( $item['mediaMime'] ) ) {
            $media_mime = strtolower( trim( $item['mediaMime'] ) );
            if ( preg_match( '/^(audio|video)\/[a-z0-9.+-]+$/', $media_mime ) ) {
                $normalized['mediaMime'] = $media_mime;
            }
        }

        foreach ( [ 'start', 'end', 'fadein', 'fadeout' ] as $key ) {
            if ( array_key_exists( $key, $item ) ) {
                $number = $this->normalize_non_negative_number( $item[$key] );
                if ( $number !== null ) {
                    $normalized[$key] = $number;
                }
            }
        }

        if ( array_key_exists( 'volume', $item ) ) {
            $volume = $this->normalize_non_negative_number( $item['volume'] );
            if ( $volume !== null ) {
                $normalized['volume'] = max( 0, min( 100, $volume ) );
            }
        }

        foreach ( [ 'fs', 'cc', 'controls', 'disablekb', 'rangeProxy' ] as $key ) {
            if ( array_key_exists( $key, $item ) ) {
                $bool_value = $this->normalize_boolish( $item[$key] );
                if ( $bool_value !== null ) {
                    $normalized[$key] = $bool_value;
                }
            }
        }

        return $normalized;
    }

    private function sanitize_text( string $value, int $max_length, bool $allow_newline = false ): string {
        $value = strip_tags( $value );
        $value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value ) ?? '';
        if ( $allow_newline ) {
            $value = str_replace( [ "\r\n", "\r" ], "\n", $value );
            $value = preg_replace( '/\t/u', ' ', $value ) ?? $value;
            $value = preg_replace( '/ {2,}/u', ' ', $value ) ?? $value;
            $value = preg_replace( '/\n{3,}/u', "\n\n", $value ) ?? $value;
        } else {
            $value = preg_replace( '/\s+/u', ' ', $value ) ?? $value;
        }
        $value = trim( $value );
        if ( mb_strlen( $value ) > $max_length ) {
            $value = mb_substr( $value, 0, $max_length );
        }
        return $value;
    }

    private function normalize_non_negative_number( $value ): ?float {
        if ( is_int( $value ) || is_float( $value ) ) {
            return $value >= 0 ? (float)$value : null;
        }
        if ( is_string( $value ) ) {
            $trimmed = trim( $value );
            if ( $trimmed === '' || !is_numeric( $trimmed ) ) {
                return null;
            }
            $parsed = (float)$trimmed;
            return $parsed >= 0 ? $parsed : null;
        }
        return null;
    }

    private function normalize_boolish( $value ): ?bool {
        if ( is_bool( $value ) ) {
            return $value;
        }
        if ( is_int( $value ) ) {
            if ( $value === 0 ) return false;
            if ( $value === 1 ) return true;
            return null;
        }
        if ( is_string( $value ) ) {
            $trimmed = strtolower( trim( $value ) );
            if ( $trimmed === '0' || $trimmed === 'false' ) return false;
            if ( $trimmed === '1' || $trimmed === 'true' ) return true;
        }
        return null;
    }

    private function has_unsafe_scheme( string $value ): bool {
        $trimmed = trim( $value );
        if ( $trimmed === '' ) {
            return false;
        }
        if ( preg_match( '/^([a-z][a-z0-9+.-]*):/i', $trimmed, $matches ) ) {
            $scheme = strtolower( $matches[1] );
            return !in_array( $scheme, [ 'http', 'https' ], true );
        }
        return false;
    }

    /**
     * Output JSON data as the response of the API endpoint.
     * 
     * @return void
     */
    private function return_response(): void {
        header( 'Content-type: application/json; charset=UTF-8' );
        echo json_encode( $this->api_response );
        die();
    }

}
