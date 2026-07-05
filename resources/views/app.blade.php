<!DOCTYPE html>
<html lang="es" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="reverb-key" content="{{ config('reverb.apps.apps.0.key') }}">
    <meta name="reverb-host" content="{{ config('reverb.host') }}">

    <title inertia>{{ config('app.name', 'TuiStream') }}</title>

    <!-- Favicon (server-side, updated dynamically by useLogo composable) -->
    <link rel="icon" type="image/png" id="dynamic-favicon" href="{{ $faviconUrl ?? '' }}" />

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />

    @vite(['resources/js/app.ts', 'resources/css/app.css'])
    @inertiaHead
</head>
<body class="h-full font-sans antialiased">
    @inertia
</body>
</html>
