<?php

namespace Modules\Streaming\Services;

use Modules\Stations\Models\Station;

class IcecastConfigGenerator
{
    /**
     * Generar el XML de configuración para el servidor Icecast2 de la emisora.
     *
     * @param Station $station
     * @param string $sourcePassword Contraseña para que Liquidsoap envíe el stream.
     * @param string $adminPassword Contraseña del administrador de Icecast.
     * @param string $relayPassword Contraseña para repetidores.
     * @5param string $adminUsername Nombre de usuario del administrador de Icecast (default: admin).
     * @return string
     */
    public function generate(
        Station $station,
        string $sourcePassword,
        string $adminPassword,
        string $relayPassword,
        string $adminUsername = 'admin'
    ): string {
        $maxListeners = $station->max_listeners;

        return <<<XML
<icecast>
    <!-- Límites del servidor -->
    <limits>
        <clients>{$maxListeners}</clients>
        <sources>2</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <burst-on-connect>1</burst-on-connect>
        <burst-size>65536</burst-size>
    </limits>

    <!-- Credenciales de autenticación -->
    <authentication>
        <source-password>{$sourcePassword}</source-password>
        <relay-password>{$relayPassword}</relay-password>
        <admin-user>{$adminUsername}</admin-user>
        <admin-password>{$adminPassword}</admin-password>
    </authentication>

    <!-- Configuración del directorio de red y hostname -->
    <hostname>localhost</hostname>

    <!-- Configuración de Puertos del contenedor (siempre corre interno en 8000) -->
    <listen-socket>
        <port>8000</port>
        <!-- Bind-address permite conexiones desde la red Docker -->
        <bind-address>0.0.0.0</bind-address>
    </listen-socket>

    <http-headers>
        <header name="Access-Control-Allow-Origin" value="*" />
    </http-headers>

    <!-- Directorios de recursos de Icecast -->
    <paths>
        <logdir>/var/log/icecast</logdir>
        <webroot>/usr/share/icecast2/web</webroot>
        <adminroot>/usr/share/icecast2/admin</adminroot>
        <alias source="/" destination="/status.xsl"/>
    </paths>

    <!-- Logs -->
    <logging>
        <accesslog>access.log</accesslog>
        <errorlog>error.log</errorlog>
        <loglevel>3</loglevel> <!-- 3 = info, 4 = debug -->
        <logsize>10000</logsize>
    </logging>

    <security>
        <chroot>0</chroot>
    </security>
</icecast>
XML;
    }
}
