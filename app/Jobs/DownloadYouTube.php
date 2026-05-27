<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Modules\Stations\Models\Station;
use Modules\AutoDJ\Models\MediaFile;
use Modules\AutoDJ\Models\Playlist;

class DownloadYouTube implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $url;
    protected $format;
    protected $quality;
    protected $stationId;
    protected $playlistName;

    /**
     * Create a new job instance.
     */
    public function __construct(string $jobId, string $url, string $format, string $quality, ?string $stationId, string $playlistName = 'default')
    {
        $this->jobId = $jobId;
        $this->url = $url;
        $this->format = $format;
        $this->quality = $quality;
        $this->stationId = $stationId;
        $this->playlistName = $playlistName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $jobs = Cache::get('youtube_downloader_jobs', []);
        if (isset($jobs[$this->jobId])) {
            $jobs[$this->jobId]['status'] = 'downloading';
            $jobs[$this->jobId]['progress'] = 5;
            Cache::put('youtube_downloader_jobs', $jobs, 86400);
        }

        // Determine destination folder
        $station = null;
        $destPath = '';
        if ($this->stationId) {
            $station = Station::find($this->stationId);
            if ($station) {
                $basePath = storage_path('app/public/stations/' . $station->slug);
                $destPath = $basePath . '/media';
                if (!File::exists($destPath)) {
                    File::makeDirectory($destPath, 0755, true);
                }
            }
        }

        if (empty($destPath)) {
            $destPath = storage_path('app/public/downloads');
            if (!File::exists($destPath)) {
                File::makeDirectory($destPath, 0755, true);
            }
        }

        // Find yt-dlp binary - check multiple locations
        $ytDlp = PHP_OS_FAMILY === 'Windows' ? 'yt-dlp.exe' : 'yt-dlp';
        $foundBinary = false;
        $binaryPaths = [];

        if (PHP_OS_FAMILY === 'Windows') {
            $binaryPaths = [
                base_path('yt-dlp.exe'),
                base_path('bin/yt-dlp.exe'),
                'C:\\yt-dlp\\yt-dlp.exe',
            ];
        } else {
            $binaryPaths = [
                '/usr/local/bin/yt-dlp',
                '/usr/bin/yt-dlp',
                base_path('yt-dlp'),
                base_path('bin/yt-dlp'),
            ];
        }

        foreach ($binaryPaths as $p) {
            if (File::exists($p) || (!PHP_OS_FAMILY === 'Windows' && is_executable($p))) {
                $ytDlp = $p;
                $foundBinary = true;
                break;
            }
        }

        if (!$foundBinary && PHP_OS_FAMILY === 'Windows') {
            // Check using where command
            $which = new Process(['where', 'yt-dlp']);
            $which->run();
            if ($which->isSuccessful()) {
                $ytDlp = trim($which->getOutput());
                $foundBinary = true;
            }
        }

        if (!$foundBinary) {
            throw new \Exception('yt-dlp no está instalado. Instálelo: pip install yt-dlp (Linux/Mac) o winget install yt-dlp.yt-dlp (Windows).');
        }

        // Build yt-dlp arguments
        // Output template (filename)
        $outputTemplate = $destPath . DIRECTORY_SEPARATOR . '%(title)s.%(ext)s';
        
        $cmd = [];
        $cmd[] = $ytDlp;
        $cmd[] = '--no-playlist';
        
        if ($this->format === 'audio') {
            $cmd[] = '-x';
            $cmd[] = '--audio-format';
            $cmd[] = 'mp3';
            $cmd[] = '--audio-quality';
            $cmd[] = $this->quality . 'k';
        } else {
            $cmd[] = '-f';
            $cmd[] = 'mp4';
        }
        
        $cmd[] = '-o';
        $cmd[] = $outputTemplate;
        $cmd[] = $this->url;

        Log::info("Starting YouTube download command: " . implode(' ', $cmd));

        // Start Symfony process
        $process = new Process($cmd);
        $process->setTimeout(600); // 10 minutes timeout
        
        $lastProgress = 5;

        try {
            $process->run(function ($type, $buffer) use (&$lastProgress) {
                // Parse yt-dlp output for progress percentage
                // Output looks like: [download]  12.5% of 10.34MiB at  2.45MiB/s ETA 00:03
                if (preg_match('/\[download\]\s+(\d+(?:\.\d+)?)\%/', $buffer, $matches)) {
                    $pct = (int) $matches[1];
                    if ($pct > $lastProgress && $pct < 98) {
                        $lastProgress = $pct;
                        $this->updateProgress($pct);
                    }
                }
            });

            if (!$process->isSuccessful()) {
                // Check if it's because yt-dlp is missing (common in fresh setups)
                $output = $process->getErrorOutput() ?: $process->getOutput();
                if (str_contains($output, 'command not found') || str_contains($output, 'is not recognized')) {
                    throw new \Exception("yt-dlp is not installed on this server. Please install it using the install.bin script or package manager.");
                }
                throw new \Exception($output);
            }

            // Download finished! Let's scan files to see what was created
            $this->updateProgress(98);

            // Find the most recently added file in the destination folder
            $files = File::files($destPath);
            $newestFile = null;
            $newestTime = 0;
            foreach ($files as $file) {
                if ($file->getMTime() > $newestTime) {
                    $newestTime = $file->getMTime();
                    $newestFile = $file;
                }
            }

            if ($newestFile && $station) {
                $filename = $newestFile->getFilename();
                $filepath = $newestFile->getRealPath();
                $size = $newestFile->getSize();
                $title = pathinfo($filename, PATHINFO_FILENAME);

                // Save to database as MediaFile
                $media = MediaFile::create([
                    'station_id' => $station->id,
                    'filename' => $filename,
                    'filepath' => $filepath,
                    'title' => $title,
                    'artist' => 'YouTube',
                    'duration' => 180, // Mock duration or read from ID3 if package exists
                    'size' => $size,
                ]);

                // Associate with playlist if selected
                $playlist = Playlist::where('station_id', $station->id)
                    ->where('name', $this->playlistName)
                    ->first();
                
                if (!$playlist) {
                    $playlist = Playlist::where('station_id', $station->id)->first();
                }

                if ($playlist && $media) {
                    $playlist->mediaFiles()->attach($media->id, ['weight' => 0]);
                }
            }

            // Mark job as done
            $jobs = Cache::get('youtube_downloader_jobs', []);
            if (isset($jobs[$this->jobId])) {
                $jobs[$this->jobId]['status'] = 'done';
                $jobs[$this->jobId]['progress'] = 100;
                if ($newestFile) {
                    $jobs[$this->jobId]['title'] = pathinfo($newestFile->getFilename(), PATHINFO_FILENAME);
                }
                Cache::put('youtube_downloader_jobs', $jobs, 86400);
            }

        } catch (\Exception $e) {
            Log::error("YouTube Downloader Job failed: " . $e->getMessage());
            
            $jobs = Cache::get('youtube_downloader_jobs', []);
            if (isset($jobs[$this->jobId])) {
                $jobs[$this->jobId]['status'] = 'error';
                $jobs[$this->jobId]['error'] = $e->getMessage();
                Cache::put('youtube_downloader_jobs', $jobs, 86400);
            }
        }
    }

    /**
     * Update job progress percentage in cache.
     */
    protected function updateProgress(int $pct): void
    {
        $jobs = Cache::get('youtube_downloader_jobs', []);
        if (isset($jobs[$this->jobId])) {
            $jobs[$this->jobId]['progress'] = $pct;
            Cache::put('youtube_downloader_jobs', $jobs, 86400);
        }
    }
}
