# Preguntas frecuentes

**Pregunta:** En lugar del editor de tablas, solo veo un campo de texto con
un contenido críptico que comienza por `b64:`.

Respuesta: Ese es el campo **Datos de la tabla**, es decir, la forma almacenada de la
tabla que normalmente queda oculto tras el editor. Nunca edites este texto
manualmente. Al hacer clic en **Editar tabla** o al volver a abrir el
cuadro de diálogo, volverá a aparecer el editor. La codificación protege la tabla para que no
se vea dañada por la traducción automática de la página.

**Pregunta:** Mis cambios han desaparecido al cerrar.

Respuesta: **Cerrar** no guarda. Antes de cerrar, haz siempre clic en
**Guardar**; mientras aparezca «Cambios no guardados» junto a los botones,
hay algo abierto.

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
reconocen automáticamente como separadores. En el caso de Excel, se importa la primera hoja de cálculo
, incluyendo las celdas unidas, el formato de texto, los colores, los tamaños de fuente
y la alineación. Una importación **sustituye siempre toda la tabla**.

**Pregunta:** Aparece el mensaje «Importación fallida».

Respuesta: No se ha podido leer el archivo. Comprueba si realmente se trata de un
archivo `.csv`, `.xlsx` o `.xls` (y no, por ejemplo, un archivo renombrado o
protegido con contraseña) y si contiene datos. Si es necesario,
guárdalo de nuevo en Excel como `.xlsx`.

**Pregunta:** No se muestran todas las filas en la página.

Respuesta: Se trata de la configuración **Líneas visibles** (pestaña «Datos»),
configurada por defecto en 5 filas de datos. El resto aparece al hacer clic en el botón situado debajo
de la tabla. Si se desea que se vean todas las filas desde el principio, establece el valor en `0`
.

**Pregunta:** Una imagen desborda toda la tabla.

Respuesta: En la pestaña **Imágenes**, activa la opción **Ajustar imágenes**.
Esto limita todas las imágenes al ancho de la tabla. Si está desactivada, cada
imagen aparecerá en su tamaño original.

**Pregunta:** Varias imágenes tienen tamaños diferentes.

Respuesta: Selecciona todas las celdas de imagen y, en la pestaña **Imágenes**, en
**Tamaño de imagen**, selecciona «Misma altura que la primera imagen» o «Misma anchura que la primera
imagen». Deben estar seleccionadas al menos dos imágenes.

**Pregunta:** Un lector tiene la tabla ordenada de forma diferente a como la guardé
yo.

Respuesta: En la página publicada, cualquier lector puede reordenarla por sí mismo haciendo clic
en el encabezado de una columna. Esto solo afecta a su vista
y no modifica la tabla guardada. El orden establecido en el editor
sigue siendo la vista inicial.

**Pregunta:** ¿Puedo insertar un enlace en una celda?

Respuesta: No. Las celdas admiten texto, imágenes y caracteres en superíndice o subíndice,
pero no enlaces. Los enlaces deben colocarse en un elemento de texto junto a la tabla.

**Pregunta:** ¿Hay una opción de «Deshacer»?

Respuesta: No. Por eso, en caso de modificaciones importantes, guarda el documento de vez en cuando y,
antes de importar, recuerda que la importación sustituirá toda la tabla.

**Pregunta:** Mi texto aparece completamente en mayúsculas, aunque lo haya
escrito normalmente.

Respuesta: Eso se debe al diseño de la página, no a la tabla. Selecciona las
celdas afectadas y, en la pestaña **Fuente**, haz clic en **Quitar mayúsculas**.

**Pregunta:** ¿Qué ocurre con mi tabla al traducir automáticamente
la página?

Respuesta: Solo se traducen los contenidos de las celdas. Las celdas unidas,
los formatos, las imágenes y la ordenación se mantienen sin cambios.

**Pregunta:** La tabla queda demasiado ancha en el móvil.

Respuesta: Se puede desplazar lateralmente. Para pantallas estrechas, resulta útil
agrupar columnas, utilizar encabezados más cortos o eliminar las imágenes grandes
de las celdas.
