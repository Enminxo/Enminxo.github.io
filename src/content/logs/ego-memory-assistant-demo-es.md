---
project: ego-memory-assistant
title: "Un diario que recuerda: preguntarle a mis gafas qué hice"
date: 2026-10-28
summary: "Una cámara en las gafas escribe un diario de texto del día y un modelo de lenguaje responde preguntas a partir de él. Qué funciona, qué falla y cómo saqué el vídeo en directo de las gafas Neon con una wifi floja."
tags: ["Egocentric AI", "VLM", "Pupil Labs Neon", "Episodic Memory", "Open Source"]
img: /assets/logs/ego-memory-assistant/cover.jpg
img_alt: "Lo que vieron las gafas: mi mano empujando la ventana de la oficina para cerrarla"
lang: es
translation_of: ego-memory-assistant-demo
---

"¿Me he tomado la pastilla?" "¿Dónde he dejado las llaves?" "¿He apagado el fuego?" Para alguien con deterioro cognitivo leve o alzhéimer en fase inicial, estas preguntas pequeñas aparecen cada día, y puede que nadie alrededor sepa la respuesta. Una cámara a la altura de los ojos lo ve todo. Lo difícil no es grabar, sino responder.

Esta entrada va de un prototipo que intenta hacerlo, de la demo que he montado sobre él y de lo que aprendí al hacerlo funcionar en directo con unas gafas reales. El código ya es abierto: [github.com/Enminxo/ego-memory-assistant](https://github.com/Enminxo/ego-memory-assistant).

---

### La idea: del vídeo al texto, y del texto a una respuesta

<a href="/assets/logs/ego-memory-assistant/pipeline.jpg"><img src="/assets/logs/ego-memory-assistant/pipeline.jpg" alt="Flujo: cámara en las gafas, clips de 15 s, un modelo de visión escribe el diario, un modelo de lenguaje lo lee y responde con el momento" style="width:100%;display:block;margin:0 auto;" /></a>

El vídeo se corta en clips de 15 segundos. En cada clip, un modelo de visión y lenguaje (Gemma 4 de 31B, en local, en un DGX Spark) mira 8 fotogramas y escribe una línea en primera persona: *"En la cocina, removí verduras en una olla con unos palillos."* Esas líneas, cada una con su hora, son el diario. Cuando preguntas algo, un modelo de lenguaje lee solo el diario y responde citando el momento en que se apoya, para que puedas saltar a ese punto del vídeo y comprobarlo.

¿Por qué texto y no el propio vídeo?

- **Ocupa muy poco.** Ocho minutos de vida caben en unos 5 kB de texto; esos mismos ocho minutos de vídeo pesan entre 60 y 90 MB.
- **Una persona lo puede leer.** Si la respuesta está mal, se ve por qué: o el diario nunca lo mencionó, o el lector lo entendió mal.
- **Puede ser privado.** Una vez escrita la línea, los fotogramas se pueden tirar. Guardarlos o no es una decisión, no una necesidad técnica.

El diseño sigue dos artículos del grupo de Antonino Furnari en la Universidad de Catania, que estudian este enfoque de "describir y luego leer" para la memoria episódica con modelos multimodales ya entrenados.

### ¿Funciona?

Lo probé con cuatro clips de 8 minutos de Ego4D, uno por cada necesidad cotidiana (el fuego, las llaves, la medicación, la cartera), con 59 preguntas de cuatro opciones de QAEgo4D. La clave es el control: el mismo lector respondiendo **sin** el diario. Ese control importa porque muchas opciones incorrectas del conjunto de datos son absurdas ("en el techo"), así que un modelo acierta bastante más que el azar sin ver nada.

<a href="/assets/logs/ego-memory-assistant/results.jpg"><img src="/assets/logs/ego-memory-assistant/results.jpg" alt="Aciertos con y sin diario en 59 preguntas, con intervalos del 95 %" style="width:100%;display:block;margin:0 auto;" /></a>

Con el diario, el lector acertó entre el 47 y el 54 %; sin él, entre el 41 y el 42 %. Son de 5 a 14 puntos más en tres repeticiones, pero todos los intervalos del 95 % llegan a cero. **Con 59 preguntas, la mejora no está establecida.** Es una dirección prometedora, todavía no un resultado.

Los fallos enseñaron más que la nota, porque se repiten:

- **Malinterpreta gestos.** La mano toca el panel de la cocina y el diario dice que se apagó el fuego. No se apagó.
- **Escribe negaciones que nadie pidió.** "No se tomó ninguna medicación" apareció en 15 de 128 entradas, algo peligroso justo en este uso.
- **Se pierde lo que sale borroso.** Las llaves están en la mesa, pero en el único fotograma en que aparecen, la imagen está movida.

Y un modelo más pequeño (Gemma 4 E4B) falló de una forma que importa todavía más: se inventaba cosas. En un salón sin nadie más, escribió que pasaba junto a una persona sentada. Un diario que crea recuerdos falsos es peor que no tener diario.

### De un conjunto de datos a mis propias gafas

Ego4D es una buena prueba, pero la idea es que funcione con lo que veo *yo*. Usé las gafas **Neon** de Pupil Labs. Neon es un sensor, no un ordenador: las gafas van por cable a un móvil con la app Companion, que graba y puede emitir el vídeo por wifi.

**Grabar y luego preguntar** funciona bien. Grabas con el móvil, subes la grabación a la página de la demo y el diario se escribe a medida que se lee. Esta es la grabación de ejemplo que ahora acompaña al código: voy hasta una ventana, la cierro empujándola y paso por dos puertas.

<a href="/assets/logs/ego-memory-assistant/app.jpg"><img src="/assets/logs/ego-memory-assistant/app.jpg" alt="La página de la demo: la mano empuja la ventana para cerrarla mientras el diario dice que la ventana siguió cerrada" style="width:100%;display:block;margin:0 auto;" /></a>

Responde "¿Qué hice en la ventana?" y "¿Abrí una puerta?", cada una con su momento. Y falla "¿Cerré la ventana?". En los fotogramas se ve la mano empujando la ventana, pero el diario dice que la ventana "siguió cerrada". El lector solo puede responder lo que el descriptor dejó escrito. Dejé este fallo en el ejemplo a propósito, porque enseña en una sola imagen dónde está el eslabón débil.

### En directo: el problema era la wifi

En directo costó más. La primera versión leía el vídeo normal de la Companion, que viaja por UDP, y la cola de cada imagen completa se perdía por el camino. Leer el mismo vídeo por el WebSocket de la Companion (TCP) acabó con las pérdidas, pero no con el problema de fondo: el vídeo de la escena ocupa unos 4,9 Mbit/s, y la wifi de la oficina daba unos 9 Mbit/s cuando la medí. Una tarde con la red cargada, el vídeo se fue retrasando y 13 de 22 clips en directo se descartaron porque no había llegado vídeo reciente.

La solución fue dejar de mandar el vídeo. Un pequeño relé corre **en el propio móvil**, en Termux, junto a la app Companion. Dentro del móvil el vídeo llega por 127.0.0.1 sin nada en medio. El relé elige las 8 fotos que necesita cada clip y manda solo esas, unos 0,7 Mbit/s, la séptima parte del vídeo. Si la red se corta, las fotos esperan en el móvil y se ponen al día después, cada una con la hora en que se tomó.

<a href="/assets/logs/ego-memory-assistant/relay.jpg"><img src="/assets/logs/ego-memory-assistant/relay.jpg" alt="Antes: el vídeo entero cruza la wifi y se pierden clips. Después: un relé dentro del móvil manda 8 fotos cada 15 s" style="width:100%;display:block;margin:0 auto;" /></a>

En una prueba de 10 minutos llegaron las 403 fotos, ninguna perdida, alrededor de medio segundo después de tomarse.

<a href="/assets/logs/ego-memory-assistant/relay-live.jpg"><img src="/assets/logs/ego-memory-assistant/relay-live.jpg" alt="Diez minutos en directo a través del móvil: todas las fotos llegaron con 0,4 s de retraso; cerca de la mitad de los clips se descartaron porque el descriptor era lento" style="width:100%;display:block;margin:0 auto;" /></a>

### Ahora el cuello de botella es el descriptor

En cuanto la red dejó de perder cosas, apareció el siguiente límite. Al tamaño completo de imagen de las gafas, el modelo de 31B tarda unos 26 segundos en describir un clip de 15 segundos. No llega, así que en esa prueba se descartaron unos 4 de cada 10 clips. La app los descarta a propósito y lo dice, en lugar de describir una imagen vieja como si fuera el presente.

<a href="/assets/logs/ego-memory-assistant/describer-speed.jpg"><img src="/assets/logs/ego-memory-assistant/describer-speed.jpg" alt="Segundos para describir un clip según el modelo y el tamaño de imagen" style="width:100%;display:block;margin:0 auto;" /></a>

Casi todo ese tiempo se va en leer la imagen, así que crece con su tamaño: unos 11 s a 960×540, 18 s a 1280×960 y 26 s a tamaño completo. Los modelos pequeños son lo bastante rápidos, pero el que probé se inventaba objetos. Encontrar un descriptor rápido y a la vez fiel es el principal problema abierto.

### Un experimento aparte: saludar a los compañeros por su nombre

Como el relé ya estaba en el móvil, puede hacer una cosa más: servir la foto más reciente tres veces por segundo y hablar por el altavoz del móvil. Con eso, un pequeño reconocedor de caras en el DGX (YuNet para encontrar caras y SFace para compararlas, los dos en CPU) saludaba a los compañeros por su nombre al entrar en el campo de visión. Todo el grupo aceptó participar, y las plantillas de las caras son datos biométricos, así que se quedan en una sola máquina y **no** están en el código público.

Funcionó, y también enseñó prudencia: a lo largo de una tarde, tres detecciones sueltas se asignaron a un compañero que no estaba en la oficina. No se llegó a saludar solo porque exigí dos coincidencias seguidas. Una tarde no basta para decir que es fiable.

### Pruébalo

El repositorio tiene todo lo necesario para correr la demo en tu máquina, con cualquier servidor que hable la API de OpenAI (yo uso Ollama):

- una **grabación de ejemplo** (66 s, sin audio) para probar el ciclo completo sin ningún conjunto de datos;
- el **relé del móvil**, un único archivo de Python que corre en Termux y sirve para cualquier cosa que quieras calcular junto a la app Companion;
- un lector por WebSocket del vídeo en directo de Neon, para redes donde su emisión RTSP normal pierde imágenes;
- la evaluación con su **control sin diario**, que yo exigiría a cualquiera que compare métodos de memoria.

Los problemas abiertos están como issues: un descriptor lo bastante pequeño para ir en directo, darse cuenta de los cambios de estado (la ventana), usar el audio de las gafas y llevar el diario en directo fuera de la red de la oficina. Si alguno te interesa, me encantará saber de ti.

### Con qué me quedo

La idea de un diario que recuerda por ti es sencilla, y la fontanería se puede hacer robusta: llevar el trabajo al móvil convirtió un enlace que perdía datos en uno que no perdió nada. Lo que decide si ayuda a una persona es la línea que escribe el descriptor. Cuando escribe "la ventana siguió cerrada" mientras la mano la está empujando, ningún lector puede arreglarlo. Ahí está el siguiente paso.
