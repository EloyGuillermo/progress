# App de entreno — instalación

Una PWA que registra series y sesiones **sin cobertura** y las vuelca en tu Google Sheet
cuando recuperas internet. No usa servidores ajenos: solo tu Sheet y tu móvil.

Tiempo total: unos 15 minutos, una sola vez.

---

## 1. Sube el Sheet a Google (2 min)

1. Sube `Entrenamiento_Eloy.xlsx` a Google Drive.
2. Ábrelo y haz **Archivo → Guardar como Hoja de cálculo de Google**. Importante: si te quedas
   en modo `.xlsx`, Apps Script no puede escribir en él.
3. Borra las filas de ejemplo (fila 2 de `Registro`, `Sesiones` y `Cuerpo`).

---

## 2. Instala el endpoint (5 min)

1. En el Sheet: **Extensiones → Apps Script**.
2. Borra el contenido y pega entero `apps-script/Codigo.gs`.
3. Cambia la primera línea:

   ```js
   var TOKEN = 'CAMBIA-ESTO-POR-ALGO-LARGO-Y-UNICO';
   ```

   Pon cualquier cadena larga que te inventes. Es lo único que impide que alguien que
   descubra tu URL te escriba en la hoja.

4. Ejecuta una vez la función `comprobar` (menú desplegable arriba → `comprobar` → Ejecutar).
   Google te pedirá permisos: acéptalos. En la pantalla de aviso, *Configuración avanzada →
   Ir a (nombre del proyecto)*. Es tu propio script, el aviso es rutinario.
   En el registro debe salir `Registro: OK` y `Sesiones: OK`.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la URL que termina en `/exec`.

> Cada vez que edites `Codigo.gs`, haz **Implementar → Gestionar implementaciones → editar
> (lápiz) → Versión: Nueva versión → Implementar**. Si creas una implementación nueva desde
> cero, cambia la URL y tendrás que actualizarla en la app.

---

## 3. Publica la app (5 min)

Cualquier hosting estático vale. Con GitHub Pages:

```bash
git init
git add index.html sw.js manifest.webmanifest icon-192.png icon-512.png
git commit -m "app de entreno"
git branch -M main
git remote add origin git@github.com:TU_USUARIO/entreno.git
git push -u origin main
```

En el repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
En un par de minutos tendrás `https://TU_USUARIO.github.io/entreno/`.

**Tiene que ser HTTPS.** Sin HTTPS no hay service worker, y sin service worker no hay modo
sin conexión. GitHub Pages ya te lo da. Netlify Drop (arrastrar la carpeta a
`app.netlify.com/drop`) también sirve y es aún más rápido.

El repo puede ser público sin problema: el código no lleva ni tu URL ni tu token. Esos dos
datos los escribes en el móvil y se quedan solo ahí.

---

## 4. Instálala en el móvil (2 min)

1. Abre la URL en **Chrome** (Android) o **Safari** (iPhone).
2. Menú → **Añadir a pantalla de inicio**. A partir de ahí se abre a pantalla completa,
   como una app normal.
3. Dentro, pestaña **Ajustes**: pega la URL `/exec` y el token, y pulsa **Guardar ajustes**.
4. Pulsa **Probar conexión**. Debe decir *Conexión correcta*.

Ábrela una vez con datos antes de ir al gimnasio: así el service worker guarda todo y luego
funciona sin cobertura.

---

## Cómo se usa

- **Hoy** — eliges sesión y semana. Te muestra el plan y, en el día 4, el reto de esa semana.
- **Registrar** — tocas el ejercicio, ajustas kg y reps con los botones grandes, eliges RIR y
  guardas. El cronómetro de descanso arranca solo con el tiempo de ese ejercicio.
- **Sesión** — el resumen de después: rodilla, codo, energía, sueño, finisher y sensaciones.
- **Ajustes** — estado de sincronización, forzar envío, exportar copia.

Arriba a la derecha, el indicador: **✓ al día** o **N pend.** Se sincroniza sola al guardar,
al recuperar conexión y al volver a abrir la app. También puedes forzarla tocando el indicador.

---

## Detalles que importan

**Nada se pierde sin cobertura.** Todo se guarda primero en el móvil y solo se borra de la
cola cuando el Sheet confirma que lo ha escrito. Si falla, se reintenta.

**No se duplica nunca.** Cada registro lleva un identificador único y el script lo ignora si
ya está en la hoja. Puedes reintentar sin miedo.

**No pisa tus fórmulas.** El script escribe solo en las columnas de datos y salta las de
1RM estimado y volumen, que se calculan solas.

**Las columnas M** de `Registro` y `Sesiones` guardan esos identificadores. No las borres ni
escribas en ellas; puedes ocultarlas si te molestan.

**Límites de filas:** 800 en `Registro` y 250 en `Sesiones`, que es hasta donde llegan las
fórmulas. Cuando te acerques, arrastra las fórmulas hacia abajo y sube `FILAS_REGISTRO` y
`FILAS_SESIONES` en `Codigo.gs`.

**Si cambias la rutina** en el Sheet, edita el objeto `DIAS` al principio del `<script>` de
`index.html` para que la app muestre lo mismo. Y sube el número de `CACHE` en `sw.js`
(`entreno-v1` → `entreno-v2`) o el móvil seguirá sirviendo la versión antigua.

---

## Si algo falla

**"No se pudo sincronizar"** — Comprueba en Ajustes que la URL acaba en `/exec` y que el token
es idéntico al de `Codigo.gs`. Prueba a abrir la URL en el navegador: debe devolver
`{"ok":true,...}`.

**Responde pero no escribe nada** — Casi siempre es que el Sheet sigue en formato `.xlsx`.
Vuelve al paso 1.3, o que las hojas no se llaman exactamente `Registro` y `Sesiones`.

**Los cambios no aparecen en el móvil** — Sube la versión de `CACHE` en `sw.js`, o desinstala
y vuelve a añadir a pantalla de inicio.

**Se acumulan registros pendientes** — Es normal sin cobertura. Si persiste con datos, mira
qué dice el mensaje al pulsar *Sincronizar ahora* en Ajustes.
