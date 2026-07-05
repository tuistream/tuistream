<?php

namespace App\Policies;

use App\Models\Station;
use App\Models\User;

class StationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isClient();
    }

    public function view(User $user, Station $station): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        return $station->client_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Station $station): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        return $station->client_id === $user->id;
    }

    public function delete(User $user, Station $station): bool
    {
        return $user->isAdmin();
    }

    public function start(User $user, Station $station): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        if ($station->client_id !== $user->id) return false;
        return $user->hasPermissionTo('start-streaming');
    }

    public function stop(User $user, Station $station): bool
    {
        return $this->start($user, $station);
    }
}
