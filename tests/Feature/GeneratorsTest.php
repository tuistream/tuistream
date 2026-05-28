<?php

use Modules\Streaming\Services\IcecastConfigGenerator;
use Modules\Streaming\Services\DockerComposeGenerator;
use Modules\AutoDJ\Services\LiquidsoapConfigGenerator;
use Modules\Streaming\Services\StationOrchestrator;
use Modules\Stations\Models\Station;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->icecastGenerator = app(IcecastConfigGenerator::class);
    $this->composeGenerator = app(DockerComposeGenerator::class);
    $this->liquidsoapGenerator = app(LiquidsoapConfigGenerator::class);
});

// ── IcecastConfigGenerator ────────────────────────────────

test('icecast xml escapes special characters in passwords', function () {
    $station = new Station([
        'slug' => 'test-radio',
        'max_listeners' => 100,
    ]);

    $xml = $this->icecastGenerator->generate(
        $station,
        'pass&<word>',
        'admin"pass\'',
        'relay><pass',
        'admin'
    );

    expect($xml)->toContain('pass&amp;&lt;word&gt;');
    expect($xml)->toContain('admin&quot;pass&apos;');
    expect($xml)->toContain('relay&gt;&lt;pass');
    expect($xml)->not->toContain('<admin-password>admin"pass\'</admin-password>');
});

test('icecast xml generates valid xml structure', function () {
    $station = new Station([
        'slug' => 'test-radio',
        'max_listeners' => 500,
    ]);

    $xml = $this->icecastGenerator->generate(
        $station,
        'source123',
        'admin456',
        'relay789',
        'admin'
    );

    $dom = new DOMDocument();
    $dom->loadXML($xml);

    expect($dom->getElementsByTagName('clients')->item(0)->textContent)->toBe('500');
    expect($dom->getElementsByTagName('source-password')->item(0)->textContent)->toBe('source123');
    expect($dom->getElementsByTagName('admin-password')->item(0)->textContent)->toBe('admin456');
    expect($dom->getElementsByTagName('relay-password')->item(0)->textContent)->toBe('relay789');
});

// ── LiquidsoapConfigGenerator ──────────────────────────────

test('liquidsoap escapes quotes and backslashes in passwords', function () {
    $station = new Station([
        'slug' => 'test-radio',
        'name' => 'Mi Radio',
        'bitrate' => 128,
        'port' => 8000,
        'frontend' => 'icecast',
    ]);

    $liq = $this->liquidsoapGenerator->generate(
        $station,
        'pass\\"test\\word',
        'dj"pass\\here',
        'icecast'
    );

    expect($liq)->toContain('pass\\\\\\"test\\\\word');
    expect($liq)->toContain('dj\\"pass\\\\here');
    expect($liq)->not->toContain('password = "pass"test');
});

test('liquidsoap generates shoutcast output when frontend is shoutcast', function () {
    $station = new Station([
        'slug' => 'test-radio',
        'name' => 'Mi Radio Shoutcast',
        'bitrate' => 96,
        'port' => 8000,
        'frontend' => 'shoutcast',
    ]);

    $liq = $this->liquidsoapGenerator->generate(
        $station,
        'source_pass',
        'dj_pass',
        'shoutcast'
    );

    expect($liq)->toContain('output.shoutcast');
    expect($liq)->not->toContain('output.icecast');
});

// ── DockerComposeGenerator ─────────────────────────────────

test('docker compose yaml does not contain version field', function () {
    $station = new Station([
        'slug' => 'test-radio',
        'type' => 'audio',
        'frontend' => 'icecast',
        'port' => 8000,
        'autodj_service' => 'liquidsoap',
        'autodj_enabled' => true,
    ]);

    $yaml = $this->composeGenerator->generate(
        $station,
        'source_pass',
        'admin_pass',
        'relay_pass',
        'dj_pass'
    );

    expect($yaml)->not->toContain('version:');
    expect($yaml)->not->toContain("version: '3.8'");
    expect($yaml)->toContain('services:');
});

test('docker compose video station generates nginx-rtmp service', function () {
    $station = new Station([
        'slug' => 'test-video',
        'type' => 'video',
        'frontend' => 'nginx-rtmp',
        'port' => 1935,
        'autodj_service' => 'liquidsoap',
        'autodj_enabled' => false,
    ]);

    $yaml = $this->composeGenerator->generate(
        $station,
        'source_pass',
        'admin_pass',
        'relay_pass',
        'dj_pass'
    );

    expect($yaml)->toContain('nginx-rtmp');
    expect($yaml)->not->toContain('icecast');
});

// ── StationOrchestrator Path Traversal ──────────────────────

test('station orchestrator rejects dangerous slugs', function () {
    $station = new Station([
        'id' => 1,
        'slug' => '../../etc/passwd',
        'name' => 'Hacked',
    ]);

    $orchestrator = app(StationOrchestrator::class);

    $this->expectException(RuntimeException::class);
    $this->expectExceptionMessage('Slug inválido');

    $orchestrator->getStationPath($station);
});

test('station orchestrator accepts valid slugs', function () {
    $station = new Station([
        'id' => 1,
        'slug' => 'mi-radio-abc123',
        'name' => 'Mi Radio',
    ]);

    $orchestrator = app(StationOrchestrator::class);
    $path = $orchestrator->getStationPath($station);

    expect($path)->toContain('mi-radio-abc123');
    expect($path)->not->toContain('..');
});

test('station orchestrator rejects slugs with special characters', function () {
    $station = new Station([
        'id' => 1,
        'slug' => 'radio; rm -rf /',
        'name' => 'Malicious',
    ]);

    $orchestrator = app(StationOrchestrator::class);

    $this->expectException(RuntimeException::class);
    $orchestrator->getStationPath($station);
});

// ── Station Model slug validation ───────────────────────────

test('station model auto-generates slug when empty', function () {
    $station = new Station([
        'name' => 'Mi Radio Nueva',
        'type' => 'audio',
        'frontend' => 'icecast',
        'port' => 8010,
        'user_id' => 1,
        'status' => 'offline',
        'is_active' => true,
    ]);

    $station->save();

    expect($station->slug)->not->toBeEmpty();
    expect($station->slug)->toMatch('/^[a-z0-9]+(?:-[a-z0-9]+)*$/');
    expect(strlen($station->slug))->toBeGreaterThan(5);

    $station->delete();
});

test('station model rejects invalid slugs on save', function () {
    $station = new Station([
        'name' => 'Test',
        'slug' => 'con<caracteres>',
        'type' => 'audio',
        'frontend' => 'icecast',
        'port' => 8010,
        'user_id' => 1,
        'status' => 'offline',
        'is_active' => true,
    ]);

    $this->expectException(InvalidArgumentException::class);
    $this->expectExceptionMessage('Slug inválido');

    $station->save();
});

// ── ApiAuthenticate Middleware ──────────────────────────────

test('api middleware returns 401 without token', function () {
    $response = $this->getJson('/api/v1/stations');
    $response->assertStatus(401);
});

test('api middleware returns 401 with invalid token', function () {
    $response = $this->getJson('/api/v1/stations?api_token=tui_invalidtoken123');
    $response->assertStatus(401);
});

test('api middleware returns 403 when api_access is disabled', function () {
    $user = \App\Models\User::factory()->create([
        'api_access' => 'disabled',
        'status' => 'active',
    ]);

    $plainToken = $user->generateApiToken();

    $response = $this->getJson('/api/v1/stations?api_token=' . $plainToken);
    $response->assertStatus(403);

    $user->delete();
});

test('api middleware returns 403 when account is disabled', function () {
    $user = \App\Models\User::factory()->create([
        'api_access' => 'active',
        'status' => 'disabled',
    ]);

    $plainToken = $user->generateApiToken();

    $response = $this->getJson('/api/v1/stations?api_token=' . $plainToken);
    $response->assertStatus(403);

    $user->delete();
});

test('health endpoint is accessible without auth', function () {
    $response = $this->get('/health');
    $response->assertOk();
    $response->assertJson(['status' => 'ok']);
});

// ── Admin middleware ────────────────────────────────────────

test('client user cannot access admin backup list', function () {
    $client = \App\Models\User::factory()->create([
        'role' => 'client',
        'status' => 'active',
    ]);

    $this->actingAs($client)
        ->get('/admin/backups')
        ->assertRedirect('/dashboard');

    $client->delete();
});

test('admin role middleware redirects non-super-admin from admin routes', function () {
    $client = \App\Models\User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->actingAs($client)
        ->get('/admin/dashboard')
        ->assertRedirect('/dashboard');

    $client->delete();
});
