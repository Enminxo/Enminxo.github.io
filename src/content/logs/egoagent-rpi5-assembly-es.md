---
project: egoagent
title: "Montaje: Raspberry Pi 5 + AI HAT+ 2"
date: 2026-05-03
summary: "Montaje físico de la Pi 5 16GB + AI HAT+ 2, instalación del driver para el NPU Hailo-10H y primera verificación de inferencia."
tags: ["Raspberry Pi", "Hailo", "Hardware", "Setup"]
img: /assets/Raspberry/Raspberry/IMG_8290.jpeg
img_alt: "Raspberry Pi 5 y disipador activo recién sacados de la caja"
lang: es
translation_of: egoagent-rpi5-assembly
---

La Raspberry Pi 5 es el nodo de cómputo en el borde para EgoAgent — ejecutará inferencia en tiempo real sobre el vídeo de una cámara portable. El AI HAT+ 2 añade un NPU Hailo-10H dedicado con 40 TOPS, que es lo que hace factible la inferencia de modelos de visión-lenguaje en el dispositivo sin depender de la nube.

Esta entrada cubre el montaje del hardware y la puesta en marcha del driver del NPU. Llevó una tarde entera, con la mayor parte del tiempo perdida en un problema con los drivers que detallo más abajo — tómate ese atajo.

---

### Lo que necesitas

- Raspberry Pi 5 (variante de 16 GB)
- Raspberry Pi AI HAT+ 2 (Hailo-10H, 40 TOPS INT4, 8 GB de SRAM dedicada)
- Raspberry Pi Active Cooler — obligatorio cuando el NPU está bajo carga
- Fuente USB-C 5V/5A — la oficial de la Pi 5 o equivalente; con menos amperios aparece throttling
- Tarjeta microSD clase A2, 64 GB o más — no puedes usar NVMe aquí, el slot PCIe lo ocupa el HAT
- Cable Ethernet — útil para el setup inicial antes de tener SSH por Tailscale

Un detalle importante: el HAT+ 2 viene con su propio disipador (una tira negra con aletas) para el chip Hailo-10H. Está dentro de la caja — no lo tires pensando que es embalaje.

---

### Montaje físico

**Paso 1 — El disipador activo en la Pi, primero.** Antes de tocar el HAT, monta el disipador activo en la Pi 5. El disipador se engancha sobre el SoC y el conector del ventilador va al conector de 4 pines dedicado cerca de los puertos USB. Asienta bien la almohadilla térmica. Este paso es más fácil sin el HAT en medio.

![Raspberry Pi 5 con el disipador activo instalado](/assets/Raspberry/Raspberry/IMG_8298.jpeg)

**Paso 2 — Aplica el disipador del HAT.** El disipador incluido va en la parte trasera de la placa del HAT (el lado con el die del Hailo-10H). Usa la almohadilla térmica incluida. No te lo saltes — el Hailo-10H se calienta bajo inferencia sostenida y el disipador marca una diferencia real.

**Paso 3 — El cable flex PCIe.** Esta es la parte que pilla a la gente desprevenida. El HAT+ 2 se conecta a la Pi 5 por dos vías: el conector GPIO de 40 pines (alimentación y señales) y un cable FPC flex PCIe corto (el carril de datos real hacia el NPU). El cable flex es la cinta marrón etiquetada como "30mm PCIe" en la placa del HAT.

![Parte inferior del AI HAT+ 2, con el chip Hailo-10H y el conector PCIe flex](/assets/Raspberry/Raspberry/IMG_8311.jpeg)

Conecta el cable flex antes de bajar el HAT: un extremo al conector FPC del HAT, el otro al slot FPC PCIe de la Pi 5 (parte inferior de la placa, cerca de la microSD). Ambos conectores tienen un pestillo de bloqueo — levanta para abrir, empuja hacia abajo para cerrar.

![HAT alineándose sobre la Pi 5](/assets/Raspberry/Raspberry/IMG_8317.jpeg)

**Paso 4 — Asienta y atornilla.** Alinea el conector GPIO de 40 pines y baja el HAT sobre la Pi. Presiona uniformemente hasta que el conector esté completamente encajado, luego fija los cuatro tornillos de los separadores. El HAT debe quedar a ras, sin hueco.

![Montaje completo — AI HAT+ 2 sobre Raspberry Pi 5](/assets/Raspberry/Raspberry/IMG_8320.jpeg)

**Paso 5 — Graba la microSD.** Usa Raspberry Pi Imager para escribir Raspberry Pi OS Bookworm 64 bits. En la configuración avanzada, activa SSH y establece el hostname y las credenciales antes de grabar — te ahorra una sesión con teclado y monitor.

---

### Primer arranque y configuración del OS

Conecta el Ethernet, inserta la microSD y enciende. Si tienes un monitor a mano para el primer arranque, conéctalo por HDMI — ver el asistente de configuración en pantalla da confianza.

![Primer arranque — asistente de configuración de Raspberry Pi OS](/assets/Raspberry/Raspberry/IMG_8307.jpeg)

Una vez terminado el asistente, actualiza todo antes de tocar la pila de Hailo:

```bash
# Verifica que estás en 64 bits — los paquetes Hailo requieren aarch64
uname -m

# Actualización completa del sistema primero
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

Tras el reinicio, únete a la misma red Tailscale que el DGX para que ambas máquinas sean accesibles por nombre desde cualquier lugar:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale ip -4   # anota esta IP para tu configuración SSH
```

A partir de aquí, SSH usa la IP de Tailscale — sin dependencia de la red local.

---

### Configuración PCIe

El AI HAT+ 2 se comunica con la Pi por PCIe. Raspberry Pi OS no activa el carril PCIe ni la velocidad Gen 3 por defecto, así que hay que añadir dos líneas al config de arranque:

```bash
# Comprueba qué hay configurado actualmente
grep -i pcie /boot/firmware/config.txt

# Añade las dos líneas necesarias si no están
echo "dtparam=pciex1" | sudo tee -a /boot/firmware/config.txt
echo "dtparam=pciex1_gen=3" | sudo tee -a /boot/firmware/config.txt

sudo reboot
```

Tras reiniciar, verifica que el chip Hailo aparece en el bus PCIe:

```bash
lspci | grep -i hailo
# Esperado: 0001:01:00.0 Co-processor: Hailo Technologies Ltd. Hailo-10H AI Processor (rev 01)
```

Si aparece esa línea, el hardware está correctamente conectado.

---

### Instalación del driver — donde perdí el tiempo

> **El gotcha que nadie documenta bien:** el repositorio oficial de Raspberry Pi incluye `hailo-all`, que es el metapaquete para el *AI HAT original* (Hailo-8, PCI ID `1e60:2864`). El AI HAT+ **2** usa el Hailo-10H (PCI ID `1e60:45c4`). Si instalas `hailo-all` en hardware con Hailo-10H, el driver se carga sin ningún error — pero `/dev/hailo0` nunca se crea y `hailortcli` simplemente devuelve silencio. Sin mensajes útiles.

El paquete correcto para el HAT+ 2 es `hailo-h10-all`:

```bash
sudo apt install hailo-h10-all
sudo reboot
```

Esto instala el módulo del kernel (`hailo_pci`), el runtime (`hailortcli`), bindings de Python, el toolkit de pipeline GStreamer (TAPPAS) y un zoo de modelos precompilados.

**Opcional: actualizar a HailoRT 5.2.0.** El repositorio incluye la 5.1.1. Si necesitas la 5.2.0 (necesaria para compatibilidad con el Hailo Dataflow Compiler para modelos más nuevos), descarga los paquetes `.deb` desde la [Zona de Desarrolladores de Hailo](https://hailo.ai/developer-zone/) e instálalos manualmente:

```bash
# Transfiere a la Pi
scp hailort-pcie-driver_5.2.0_all.deb \
    hailort_5.2.0_arm64.deb \
    hailo_gen_ai_model_zoo_5.2.0_arm64.deb \
    enmin@<tailscale-ip>:~/

# Instala en orden: driver → runtime → modelos
sudo dpkg --install hailort-pcie-driver_5.2.0_all.deb
sudo dpkg --install hailort_5.2.0_arm64.deb
sudo dpkg --install hailo_gen_ai_model_zoo_5.2.0_arm64.deb

sudo apt --fix-broken install   # repara cualquier dependencia rota
sudo ldconfig                   # reconstruye la caché de librerías compartidas
sudo reboot
```

El paso `ldconfig` importa: con instalaciones manuales de `.deb` sobre una versión anterior, el script de postinstalación a veces no lo ejecuta, y Python no encuentra las librerías de Hailo.

---

### Verificación

```bash
# ¿Módulo cargado?
lsmod | grep hailo
# hailo_pci  147456  0

# ¿Nodo de dispositivo presente?
ls /dev/hailo*
# /dev/hailo0

# Identificación completa del chip
hailortcli fw-control identify
```

La salida que quieres ver:

```
Device Architecture: HAILO10H
Firmware Version: 5.1.1 (release,app)
```

`HAILO10H` es la línea que importa. Si muestra `HAILO8`, instalaste el paquete equivocado.

---

### Primera inferencia

Comprobación rápida — acceso Python al dispositivo:

```bash
python3 - <<'EOF'
from hailo_platform import VDevice
with VDevice() as device:
    print("Hailo-10H OK:", device.get_physical_devices())
EOF
```

Si recibes `Permission denied`, añade tu usuario al grupo `hailo`:

```bash
sudo usermod -aG hailo $USER && newgrp hailo
```

Luego haz un benchmark con cualquier modelo del zoo:

```bash
hailortcli run /usr/share/hailo-models/resnet_v1_50.hef --measure-fps
```

Para un ResNet-50 en INT8, deberías ver cientos de FPS — los 40 TOPS son reales.

![Montaje completo encendido y funcionando](/assets/Raspberry/Raspberry/IMG_8322.jpeg)

---

### Próximos pasos

- Conseguir el Camera Module 3 Wide y probar la latencia de inferencia en tiempo real de extremo a extremo
- Actualizar a HailoRT 5.2.0 y verificar compatibilidad con el Dataflow Compiler para Gemma 4 E4B
- Empezar a construir el pipeline de datos egocéntrico con los elementos GStreamer de TAPPAS

El fine-tuning correrá en el DGX Spark, no en la Pi — para el setup de cómputo, ver [Configuración del servidor: DGX Spark para fine-tuning local](/es/log/dgx-spark-build-log/).
