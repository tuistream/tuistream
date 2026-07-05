<?php

namespace App\Enums;

enum StationStatus: string
{
    case Online = 'online';
    case Offline = 'offline';
    case Error = 'error';
    case Starting = 'starting';
}
