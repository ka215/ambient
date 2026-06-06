<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title><?= __( 'Ambient Media Player' ) ?></title>
    <?= amp_head() ?>
</head>
<body class="font-sans antialiased w-screen h-screen bg-white dark:bg-gray-800 overflow-hidden app-boot-pending" data-boot="pending">
<div id="app-boot-splash" aria-live="polite" aria-busy="true">
    <object
        class="app-boot-loader"
        type="image/svg+xml"
        data="./views/images/ambient-loading-type1.svg"
        aria-hidden="true"
        tabindex="-1"
    ></object>
    <p class="app-boot-label"><?= __( 'Loading...' ) ?></p>
</div>
<div id="app-root">
<?php 
    $this->logger($this->amp_error, $this->is_error());
    amp_component( 'notice' );
    amp_component( 'player' );
    amp_component( 'menu' );
    amp_component( 'drawer-left' );
    amp_component( 'drawer-right' );
    amp_component( 'modal' );
?>
</div>
<?= amp_footer() ?>
</body>
</html>
