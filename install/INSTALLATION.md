# TuiStream Installation Guide

El script de instalación soporta múltiples métodos para descargar e instalar TuiStream.

## Métodos de Instalación

### 1. **GitHub (Clonación)**

El método más recomendado. Clona directamente desde un repositorio de GitHub.

#### Instalación interactiva:
```bash
curl -sSL https://install.tuistream.sh | bash
```
El script te pedirá que selecciones el método y proporciones los detalles.

#### Instalación automatizada:
```bash
DOMAIN=tuistream.example.com \
ADMIN_EMAIL=admin@example.com \
REPO_URL=https://github.com/tu-usuario/tuistream.git \
REPO_BRANCH=main \
INSTALL_METHOD=github \
bash <(curl -sSL https://install.tuistream.sh)
```

---

### 2. **Tarball (Descarga)**

Útil para descargar versiones específicas desde GitHub releases o tu propio servidor.

#### Instalación interactiva:
```bash
INSTALL_METHOD=tarball bash <(curl -sSL https://install.tuistream.sh)
```

#### Instalación automatizada desde GitHub release:
```bash
DOMAIN=tuistream.example.com \
ADMIN_EMAIL=admin@example.com \
TARBALL_URL=https://github.com/tu-usuario/tuistream/archive/refs/heads/main.tar.gz \
INSTALL_METHOD=tarball \
bash <(curl -sSL https://install.tuistream.sh)
```

#### Instalación desde tu subdominio:
```bash
DOMAIN=tuistream.example.com \
ADMIN_EMAIL=admin@example.com \
TARBALL_URL=https://instalar.hostuis.com/tuistream-latest.tar.gz \
INSTALL_METHOD=tarball \
bash <(curl -sSL https://install.tuistream.sh)
```

---

### 3. **Manual**

Para cuando ya tienes los archivos en el servidor.

```bash
# 1. Sube los archivos a tu servidor
scp -r tuistream/ root@server.com:/var/www/

# 2. Ejecuta el instalador en modo manual
DOMAIN=tuistream.example.com \
ADMIN_EMAIL=admin@example.com \
INSTALL_METHOD=manual \
bash <(curl -sSL https://install.tuistream.sh)
```

---

## Instalación desde tu Subdominio

Si deseas alojar el script en tu propio servidor (`instalar.hostuis.com`):

### Opción A: Alojar el Script

1. **Configura el subdominio DNS:**
   ```
   instalar.hostuis.com → 123.456.789.000 (tu servidor)
   ```

2. **Sube el script a tu servidor web:**
   ```bash
   scp install.tuistream.sh root@server.com:/var/www/instalar.hostuis.com/
   ```

3. **Configura Nginx/Apache para servir el script**

4. **Ejecuta desde tu subdominio:**
   ```bash
   curl -sSL https://instalar.hostuis.com/install.tuistream.sh | bash
   ```

### Opción B: Alojar el Tarball

1. **Genera un tarball de TuiStream:**
   ```bash
   tar -czf tuistream-latest.tar.gz tuistream/
   ```

2. **Sube a tu servidor:**
   ```bash
   scp tuistream-latest.tar.gz root@server.com:/var/www/instalar.hostuis.com/
   ```

3. **Configura descarga automática:**
   ```bash
   DOMAIN=tuistream.hostuis.com \
   ADMIN_EMAIL=admin@hostuis.com \
   TARBALL_URL=https://instalar.hostuis.com/tuistream-latest.tar.gz \
   INSTALL_METHOD=tarball \
   bash <(curl -sSL https://instalar.hostuis.com/install.tuistream.sh)
   ```

---

## Variables de Entorno

Todas estas variables se pueden configurar antes de ejecutar el script:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DOMAIN` | Dominio para TuiStream | `tuistream.example.com` |
| `ADMIN_EMAIL` | Email para certificado SSL | `admin@example.com` |
| `INSTALL_DIR` | Directorio de instalación | `/var/www/tuistream` |
| `MYSQL_DB` | Nombre de la BD | `tuistream` |
| `MYSQL_USER` | Usuario MySQL | `tuistream` |
| `PHP_VERSION` | Versión de PHP | `8.4` |
| `NODE_VERSION` | Versión de Node.js | `22` |
| `REPO_URL` | URL del repositorio Git | `https://github.com/...` |
| `REPO_BRANCH` | Rama del repositorio | `main` |
| `TARBALL_URL` | URL del tarball | `https://...tar.gz` |
| `INSTALL_METHOD` | Método de instalación | `github`, `tarball`, `manual` |

---

## Ejemplos Completos

### Ejemplo 1: Instalación desde GitHub con todas las opciones
```bash
DOMAIN=tuistream.example.com \
ADMIN_EMAIL=admin@example.com \
REPO_URL=https://github.com/hostuis/tuistream.git \
REPO_BRANCH=main \
INSTALL_METHOD=github \
INSTALL_DIR=/var/www/tuistream \
MYSQL_DB=tuistream_prod \
bash <(curl -sSL https://install.tuistream.sh)
```

### Ejemplo 2: Instalación desde tu subdominio (tarball)
```bash
DOMAIN=tuistream.hostuis.com \
ADMIN_EMAIL=admin@hostuis.com \
TARBALL_URL=https://instalar.hostuis.com/releases/tuistream-v1.0.tar.gz \
INSTALL_METHOD=tarball \
bash <(curl -sSL https://instalar.hostuis.com/install.sh)
```

### Ejemplo 3: Instalación interactiva (sin variables de entorno)
```bash
bash <(curl -sSL https://install.tuistream.sh)
# El script te pedirá que selecciones las opciones interactivamente
```

---

## Verificación Post-Instalación

Después de completar la instalación, verifica que todo funciona:

```bash
# Verifica los servicios
systemctl status nginx php-fpm redis mysql icecast

# Verifica los logs
tail -f /var/log/tuistream/*.log

# Accede a la aplicación
https://tuistream.example.com
```

---

## Troubleshooting

### El script no encuentra los archivos en instalación manual
```bash
# Verifica que los archivos están en el lugar correcto
ls -la /var/www/tuistream/

# Debe contener: composer.json, artisan, public/index.php, etc.
```

### Error al clonar desde GitHub
```bash
# Verifica la conectividad de red
ping github.com

# Verifica la URL del repositorio
git ls-remote https://github.com/tu-usuario/tuistream.git
```

### Error al descargar tarball
```bash
# Verifica que la URL es válida
curl -I https://instalar.hostuis.com/tuistream-latest.tar.gz
```

---

## Soporte

Para reportar problemas o solicitar funcionalidades, abre un issue en el repositorio de GitHub.
