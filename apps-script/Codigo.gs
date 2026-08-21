/**
 * Endpoint para la app de entreno.
 * Recibe series y sesiones desde el móvil y las añade al Sheet.
 *
 * INSTALACIÓN (5 minutos):
 *  1. Abre tu Google Sheet -> Extensiones -> Apps Script.
 *  2. Borra lo que haya y pega este archivo entero.
 *  3. Cambia TOKEN por una cadena larga inventada (la misma que pondrás en la app).
 *  4. Implementar -> Nueva implementación -> tipo "Aplicación web".
 *       Ejecutar como:      Yo
 *       Quién tiene acceso: Cualquier usuario
 *  5. Copia la URL que acaba en /exec y pégala en Ajustes de la app.
 *
 * Si cambias este código, haz "Implementar -> Gestionar implementaciones -> editar ->
 * versión nueva", o la URL seguirá sirviendo la versión antigua.
 */

var TOKEN = 'CAMBIA-ESTO-POR-ALGO-LARGO-Y-UNICO';

var HOJA_REGISTRO = 'Registro';
var HOJA_SESIONES = 'Sesiones';
var COL_ID = 13;          // columna M: guarda el id para no duplicar nunca una fila
var FILAS_REGISTRO = 800; // hasta donde llegan las fórmulas de la hoja Registro
var FILAS_SESIONES = 250; // hasta donde llegan las fórmulas de la hoja Sesiones

function doGet(e) {
  return json({ ok: true, msg: 'Endpoint activo' });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (TOKEN && body.token !== TOKEN) return json({ ok: false, error: 'Token incorrecto' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var acked = [];

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (body.sets && body.sets.length) {
        insertar(ss.getSheetByName(HOJA_REGISTRO), body.sets, filaRegistro, FILAS_REGISTRO, acked);
      }
      if (body.sesiones && body.sesiones.length) {
        insertar(ss.getSheetByName(HOJA_SESIONES), body.sesiones, filaSesion, FILAS_SESIONES, acked);
      }
    } finally {
      lock.releaseLock();
    }

    return json({ ok: true, acked: acked });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * Escribe cada item en la primera fila libre (columna A vacía).
 * No toca las columnas con fórmulas: las escribe por tramos.
 */
function insertar(hoja, items, mapper, maxFilas, acked) {
  if (!hoja) throw new Error('No existe la hoja indicada');

  var colA = hoja.getRange(2, 1, maxFilas - 1, 1).getValues();
  var ids  = hoja.getRange(2, COL_ID, maxFilas - 1, 1).getValues();

  var vistos = {};
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0]) vistos[String(ids[i][0])] = true;
  }

  var libre = 0;
  while (libre < colA.length && colA[libre][0] !== '') libre++;

  for (var k = 0; k < items.length; k++) {
    var it = items[k];

    // Ya estaba: confirmamos igual para que la app lo saque de la cola.
    if (vistos[it.id]) { acked.push(it.id); continue; }

    if (libre >= colA.length) throw new Error('No quedan filas libres en ' + hoja.getName() + '. Amplia las formulas y el limite.');

    var fila = libre + 2;
    var tramos = mapper(it);
    for (var t = 0; t < tramos.length; t++) {
      hoja.getRange(fila, tramos[t].col, 1, tramos[t].vals.length).setValues([tramos[t].vals]);
    }
    hoja.getRange(fila, COL_ID).setValue(it.id);

    vistos[it.id] = true;
    acked.push(it.id);
    libre++;
  }
}

/** Registro: A-I datos, J y K son fórmulas (se saltan), L notas. */
function filaRegistro(it) {
  return [
    { col: 1, vals: [
        fecha(it.fecha), num(it.semana), it.dia || '', it.ejercicio || '',
        num(it.serie), num(it.kg), num(it.reps), num(it.seg), num(it.rir)
      ] },
    { col: 12, vals: [ it.notas || '' ] }
  ];
}

/** Sesiones: A-I datos, J es fórmula (se salta), K finisher, L notas. */
function filaSesion(it) {
  return [
    { col: 1, vals: [
        fecha(it.fecha), num(it.semana), it.dia || '', num(it.duracion),
        num(it.rodilla), num(it.codo), num(it.energia), num(it.sueno), num(it.pasos)
      ] },
    { col: 11, vals: [ it.finisher || '', it.notas || '' ] }
  ];
}

function fecha(s) {
  if (!s) return '';
  var p = String(s).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function num(v) {
  if (v === '' || v === null || v === undefined) return '';
  var n = Number(v);
  return isNaN(n) ? v : n;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Ejecútalo desde el editor una vez para comprobar que ve las hojas. */
function comprobar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = ss.getSheetByName(HOJA_REGISTRO);
  var s = ss.getSheetByName(HOJA_SESIONES);
  Logger.log('Registro: ' + (r ? 'OK' : 'NO ENCONTRADA'));
  Logger.log('Sesiones: ' + (s ? 'OK' : 'NO ENCONTRADA'));
}
