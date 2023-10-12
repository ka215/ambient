<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= __( 'Ambient Media Player' ) ?></title>
    <?= amp_head() ?>
</head>
<body class="font-sans antialiased w-screen h-screen bg-white dark:bg-gray-800 overflow-hidden">
<?php 
    $this->logger($this->amp_error, $this->is_error());
    if ( $this->is_error() ) {
        amp_component( 'notice' );
    }
    amp_component( 'player' );
    amp_component( 'menu' );
    amp_component( 'drawer-left' );
    amp_component( 'drawer-right' );
    amp_component( 'modal' );
?>
<?= amp_footer() ?>
</body>
</html>
