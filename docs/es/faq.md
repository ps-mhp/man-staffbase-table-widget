# Preguntas frecuentes

**Pregunta:** En lugar del editor de tablas, solo veo un campo de texto con
un contenido críptico que empieza por `b64:`.

Respuesta: Ese es el campo **Datos de la tabla**: la forma guardada de la
tabla que el editor suele ocultar. Nunca edites este texto manualmente
. Al hacer clic en **Editar tabla** o al volver a abrir el
cuadro de diálogo, volverá a aparecer el editor. La codificación protege la tabla para que no
se vea afectada por la traducción automática de la página.

**Pregunta:** Mis cambios han desaparecido al cerrar.

Respuesta: Al **cerrar** no se guardan los cambios. Si hay cambios pendientes, el
editor te lo preguntará; allí, selecciona **Aplicar**, no **Descartar**. Mientras en el
título aparezca «… – no aplicado», significa que hay algo pendiente. A continuación, guarda la página en
Studio con **Guardar**.

**Pregunta:** ¿Cómo escribo en una celda?

Respuesta: **Haz doble clic** en la celda y, a continuación, escribe. Un simple clic
solo selecciona la celda (para aplicar formatos), pero no la abre para
editarla.

**Pregunta:** No puedo borrar la primera fila ni la primera columna.

Respuesta: Así está previsto: la primera fila es el encabezado y la primera
columna, la etiqueta de la fila. Si no las necesitas, simplemente déjalas
en blanco.

**Pregunta:** ¿Qué formatos de archivo puedo importar?

Respuesta: `.csv`, así como `.xlsx`/`.xls`. En el caso de CSV, el punto y coma y la coma se
reconocen automáticamente como separadores. En el caso de Excel, se importa la primera hoja de cálculo,
junto con las celdas unidas, el formato de texto, los colores, los tamaños de fuente
y la alineación. Una importación **siempre sustituye a toda la tabla**.

**Pregunta:** Aparece el mensaje «Importación fallida».

Respuesta: No se ha podido leer el archivo. Comprueba si realmente se trata de un
archivo `.csv`, `.xlsx` o `.xls` (y no, por ejemplo, un archivo renombrado o
protegido con contraseña) y si contiene datos. Si es necesario,
guárdalo de nuevo en Excel como `.xlsx`.

**Pregunta:** No se muestran todas las filas en la página.

Respuesta: Se trata de la configuración **Líneas visibles** (panel «Tabla» a la derecha),
configurada por defecto en 5 líneas de datos. El resto aparece al hacer clic en el botón situado debajo
de la tabla. Si quieres que se vean todas las líneas desde el principio, establece el valor en `0`
.

**Pregunta:** ¿Por qué no veo la opción de exportar en la aplicación?

Respuesta: En la aplicación de Staffbase (iOS/Android), la tabla oculta deliberadamente la opción de exportar y
las casillas de selección de filas, ya que las descargas no
funcionan de forma fiable allí. En el navegador —también en el móvil— la opción de exportación
sí está disponible.

**Pregunta:** Una imagen desborda toda la tabla.

Respuesta: En la parte derecha del panel **Tabla**, activa el botón **Ajustar imágenes**.
Esto limita todas las imágenes al ancho de la tabla. Si está desactivado, cada
imagen aparece en su tamaño original.

**Pregunta:** Varias imágenes tienen tamaños diferentes.

Respuesta: Selecciona todas las celdas con imágenes y, en la pestaña **Imágenes**, en
**Tamaño de imagen**, selecciona «Misma altura que la primera imagen» o «Misma anchura que la primera
imagen». Deben estar seleccionadas al menos dos imágenes.

**Pregunta:** Un lector ha ordenado la tabla de forma diferente a como yo la guardé
.

Respuesta: En la página publicada, cada lector puede reordenarla por sí mismo haciendo clic
en el encabezado de una columna. Esto solo se aplica a su vista
y no modifica la tabla guardada. La **Primera
ordenación** establecida en el editor (panel «Tabla») sigue siendo la vista inicial.

**Pregunta:** ¿Puedo insertar un enlace en una celda?

Respuesta: No. Las celdas admiten texto, imágenes y caracteres en superíndice o subíndice,
pero no enlaces. Los enlaces deben colocarse en un elemento de texto junto a la tabla.

**Pregunta:** ¿Hay una opción de «Deshacer»?

Respuesta: No. Por eso, en caso de modificaciones importantes, guarda el trabajo de vez en cuando y,
antes de realizar una importación, ten en cuenta que esta sustituirá toda la tabla.

**Pregunta:** ¿Qué ocurre con mi tabla cuando se traduce automáticamente
la página?

Respuesta: Solo se traduce el contenido de las celdas. Las celdas unidas,
los formatos, las imágenes y la ordenación se mantienen sin cambios.

**Pregunta:** La tabla queda demasiado ancha en el móvil.

Respuesta: Se puede desplazar lateralmente. Para pantallas estrechas, resulta útil
agrupar columnas, utilizar encabezados más cortos o eliminar las imágenes grandes
de las celdas.
