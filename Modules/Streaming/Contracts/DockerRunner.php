<?php

namespace Modules\Streaming\Contracts;

interface DockerRunner
{
    public function isAvailable(): bool;

    public function up(string $workDir): array;

    public function down(string $workDir): array;
}
