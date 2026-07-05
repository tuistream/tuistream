<?php

namespace App\Enums;

enum ChannelType: string
{
    case Tv247 = 'tv_247';
    case WebTv = 'web_tv';
    case VisualRadio = 'visual_radio';
    case LiveEvent = 'live_event';
}
