<?php

namespace App\Services\Streaming;

use Illuminate\Support\Facades\Process;

class ServerMonitorService
{
    public function collectStats(): array
    {
        $cpu = $this->getCpuUsage();
        $ram = $this->getRamUsage();
        $disk = $this->getDiskUsage();
        $network = $this->getNetworkUsage();

        return [
            'cpu_usage' => $cpu,
            'ram_usage' => $ram['used'],
            'ram_total' => $ram['total'],
            'disk_usage' => $disk['used'],
            'disk_total' => $disk['total'],
            'network_in' => $network['in'],
            'network_out' => $network['out'],
            'recorded_at' => now(),
        ];
    }

    protected function getCpuUsage(): float
    {
        $result = Process::run("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'");
        return (float) trim($result->output());
    }

    protected function getRamUsage(): array
    {
        $result = Process::run("free -b | grep Mem | awk '{print $3, $2}'");
        $parts = explode(' ', trim($result->output()));
        return [
            'used' => (int) ($parts[0] ?? 0),
            'total' => (int) ($parts[1] ?? 1),
        ];
    }

    protected function getDiskUsage(): array
    {
        $result = Process::run("df -B1 / | tail -1 | awk '{print $3, $2}'");
        $parts = explode(' ', trim($result->output()));
        return [
            'used' => (int) ($parts[0] ?? 0),
            'total' => (int) ($parts[1] ?? 1),
        ];
    }

    protected function getNetworkUsage(): array
    {
        $result = Process::run("cat /proc/net/dev | grep eth0 | awk '{print $2, $10}'");
        $parts = explode(' ', trim($result->output()));
        return [
            'in' => (int) ($parts[0] ?? 0),
            'out' => (int) ($parts[1] ?? 0),
        ];
    }
}
