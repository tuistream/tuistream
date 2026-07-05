<?php

namespace App\Policies;

use App\Models\TvChannel;
use App\Models\User;

class TvChannelPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isClient();
    }

    public function view(User $user, TvChannel $tvChannel): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        return $tvChannel->client_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, TvChannel $tvChannel): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        return $tvChannel->client_id === $user->id;
    }

    public function delete(User $user, TvChannel $tvChannel): bool
    {
        return $user->isAdmin();
    }

    public function start(User $user, TvChannel $tvChannel): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->is_suspended) return false;
        return $tvChannel->client_id === $user->id
            && $user->hasPermissionTo('start-streaming');
    }

    public function stop(User $user, TvChannel $tvChannel): bool
    {
        return $this->start($user, $tvChannel);
    }
}
