---
project: infrastructure
title: "Configuración del servidor: DGX Spark para fine-tuning local"
date: 2026-04-30
summary: "Unboxing y puesta en marcha del DGX Spark — el servidor de cómputo local para el fine-tuning de modelos de visión-lenguaje."
tags: ["DGX Spark", "Fine-Tuning", "NVIDIA", "Setup"]
lang: es
translation_of: dgx-spark-build-log
---

Los GPUs en la nube funcionan para experimentar, pero iterar en el fine-tuning de modelos de visión-lenguaje para vídeo egocéntrico — secuencias largas, batch sizes grandes, evaluación frecuente de checkpoints — exige acceso de baja latencia a memoria y almacenamiento. El DGX Spark encaja en ese hueco: tamaño de sobremesa, ancho de banda de memoria de nivel datacenter, y el stack completo de NVIDIA preinstalado.

---

### Especificaciones del hardware

<!-- ![Etiqueta de la caja del DGX Spark 4TB con las specs](/assets/logs/egoagent/dgx-01-box.jpg) -->

| Componente | Especificación |
|---|---|
| Chip | NVIDIA GB10 Grace Blackwell Superchip |
| Cómputo IA | 1 PFLOP (FP4) |
| Memoria | 128 GB DDR5x — coherente y unificada (CPU + GPU comparten el mismo pool) |
| CPU | 20 núcleos ARM (10× Cortex-X925 + 10× Cortex-A725) |
| Almacenamiento | 4 TB NVMe |
| Red | WiFi 7 + ConnectX-7 SmartNIC a 200 GB/s |
| Interconexión | NVLink-C2C (Grace–Blackwell) |
| SO | DGX OS — Ubuntu 24.04 |
| Factor de forma | 150 × 150 × 50 mm, ~1,2 kg |

El detalle arquitectónico clave: **NVLink-C2C** une la CPU Grace y la GPU Blackwell en un único dominio de memoria coherente. No hay overhead de bus PCIe, ni transferencias explícitas host↔dispositivo — los tensores viven en un espacio de direcciones plano de 128 GB accesible a pleno ancho de banda desde ambas unidades de cómputo. Para hacer fine-tuning de encoders de visión grandes esto importa: activaciones, gradientes y estados del optimizador pueden coexistir sin spilling.

Con un segundo DGX Spark conectado por el puerto QSFP óptico (ConnectX-7, 200 GB/s), ambas unidades forman un único nodo de 256 GB de memoria unificada — suficiente para ejecutar modelos de 405B parámetros.

---

### Primer arranque y configuración de red

<!-- ![Pegatina del Quick Start Guide con SSID y URL de configuración](/assets/logs/egoagent/dgx-02-sticker.jpg) -->

La Guía de Inicio Rápido incluye una pegatina con tres cosas: SSID del hotspot, contraseña del hotspot y una URL de la página de configuración. En el primer arranque, el DGX emite un hotspot WiFi cerrado — conéctate a él desde un portátil, ignora el aviso de "sin internet" y navega a la URL de configuración manualmente.

El asistente cubre idioma, creación de cuenta de usuario e incorporación a la red WiFi. Una vez el DGX se une a la red local, el hotspot desaparece y el sistema descarga la imagen de software completa. **No apagues durante esta fase** — reinicia de forma autónoma varias veces.

Un gotcha de hardware: **el DGX solo tiene puertos USB-C**. Los periféricos USB-A estándar (teclado, ratón) requieren un adaptador hub si necesitas una sesión física para el setup inicial. HDMI es la salida de vídeo fiable — USB-C/DisplayPort puede fallar en el primer arranque.

---

### Acceso remoto: SSH + Tailscale

El acceso diario es headless por SSH. NVIDIA Sync (app de escritorio, `build.nvidia.com/spark`) gestiona el intercambio de claves inicial y registra el dispositivo. A partir de ahí, configuración estándar de SSH:

```
# ~/.ssh/config (en el equipo cliente)
Host dgx
    HostName 100.x.x.x    # IP de Tailscale
    User enz
```

```bash
ssh dgx
```

NVIDIA Sync instala Tailscale en el DGX automáticamente — verifícalo:

```bash
tailscale status
tailscale ip        # devuelve la dirección estable 100.x.x.x
```

**Importante:** desactiva la expiración de clave en `login.tailscale.com/admin/machines` o Tailscale te bloqueará el acceso pasados 90 días sin alternativa local.

Una nota sobre mDNS: `spark-xxxx.local` se resuelve bien desde macOS/Windows pero no desde WSL (sin daemon avahi por defecto). Usa la IP de Tailscale en la configuración SSH en su lugar.

---

### Verificar disponibilidad de GPU

```bash
nvidia-smi
```

La salida esperada incluye el GB10 Grace Blackwell, 128 GB de memoria unificada y la versión de CUDA. También vale la pena confirmar:

```bash
nvcc -V          # versión del toolkit CUDA
docker -v        # Docker viene preinstalado
lscpu            # 20 núcleos ARM confirmados
lsblk            # ~3,7 TB de NVMe usable
```

<!-- ![Salida de nvidia-smi mostrando el GB10 Grace Blackwell](/assets/logs/egoagent/dgx-03-nvidia-smi.jpg) -->

---

### JupyterLab y DGX Dashboard

El DGX Dashboard corre en `http://localhost:11000` — accesible desde NVIDIA Sync (un clic) o mediante un túnel SSH:

```bash
ssh -L 11000:localhost:11000 dgx
```

Luego abre `http://localhost:11000` en un navegador local. El dashboard expone métricas en tiempo real de GPU/CPU/memoria, gestión de actualizaciones del sistema y una instancia de JupyterLab integrada — sin instalación adicional.

<!-- ![DGX Dashboard mostrando utilización de GPU y el launcher de JupyterLab](/assets/logs/egoagent/dgx-04-dashboard.jpg) -->

---

### Migración desde el clúster del laboratorio (Atenea)

Los proyectos y el contexto de Claude Code se transfirieron directamente desde el clúster existente:

```bash
# En el DGX — traer proyectos
rsync -avz --progress atenea:~/projects/ ~/projects/

# Traer configuración global de Claude Code
rsync -avz atenea:~/.claude/CLAUDE.md ~/.claude/
rsync -avz atenea:~/.claude/settings.json ~/.claude/
rsync -avz atenea:~/.claude/projects/ ~/.claude/projects/
rsync -avz atenea:~/.claude/skills/ ~/.claude/skills/
rsync -avz atenea:~/.claude/history.jsonl ~/.claude/
```

Los entornos Conda/venv no se copiaron — se recrearon desde `environment.yml` directamente en el DGX para aprovechar las builds optimizadas para ARM64.

La configuración SSH del DGX necesita su propia entrada para Atenea (independiente de la del equipo cliente):

```
# ~/.ssh/config en el DGX
Host atenea
    HostName atenea.universidad.es
    User enz
    IdentityFile ~/.ssh/id_ed25519_atenea
```

---

### Resumen de gotchas

| Problema | Causa | Solución |
|---|---|---|
| Sin salida de vídeo | Fallo de inicialización USB-C/DP en primer arranque | Usar HDMI |
| Periféricos USB-A no encajan | El DGX es solo USB-C | Adaptador hub USB-C |
| "Sin internet" en el hotspot | Red local cerrada por diseño | Ignorar, abrir URL de configuración manualmente |
| `ssh: unable to authenticate` | Nombre de usuario incorrecto (sensible a mayúsculas) | Conectar monitor, ver pantalla de login, resetear con `passwd` |
| `spark-xxxx.local` no resuelve desde WSL | Sin mDNS en WSL | Usar IP de Tailscale en configuración SSH |
| Tailscale bloquea acceso a los 90 días | Expiración de clave activada | Desactivar en `login.tailscale.com/admin/machines` |
| `Could not resolve hostname` desde DGX a Atenea | El DGX tiene su propio `~/.ssh/config` | Añadir entrada de Atenea en la configuración SSH del DGX por separado |
