<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('server-stats', function ($user) {
    return $user->isAdmin();
});

Broadcast::channel('station.{stationId}', function ($user, $stationId) {
    return $user->isAdmin() || \App\Models\Station::where('id', $stationId)->where('client_id', $user->id)->exists();
});
