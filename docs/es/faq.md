# Preguntas frecuentes

**Pregunta:** En el cuadro de diálogo de configuración, en lugar del editor de tablas, solo veo
un campo de texto vacío con un contenido críptico. ¿Se ha estropeado la tabla?

Respuesta: No. Ese campo de texto es simplemente un campo de copia de seguridad que el editor
suele ocultar; el contenido críptico (que empieza por `b64:`) es la
tabla en formato codificado. Esta codificación evita que las traducciones automáticas
de la página dañen la tabla. Por lo general, basta con volver a cargar el cuadro de diálogo
para que vuelva a aparecer el editor.

**Pregunta:** ¿Qué formatos de archivo se pueden importar?

Respuesta: `.csv`, así como `.xlsx`/`.xls`. Al importar desde Excel se conservan las
celdas vinculadas, el formato de las celdas (negrita/cursiva/colores/alineación) y los caracteres en mayúsculas y
subíndice; una importación siempre sustituye todo el contenido actual
de la tabla.

**Pregunta:** ¿Por qué no se muestran todas las filas
en una tabla larga?

Respuesta: Se trata de la configuración «Filas visibles» (pestaña «Datos»):
los usuarios solo ven inicialmente el número de filas de datos establecido y
pueden mostrar el resto mediante el botón «Mostrar todo». Si se establece en `0`,
la tabla muestra todas las filas desde el principio.

**Pregunta:** Una imagen en una celda desajusta toda la tabla, ¿qué puedo hacer?

Respuesta: Activa la opción «Ajustar imágenes» (pestaña «Imágenes»); esta
limita todas las imágenes al ancho de la tabla. Si está desactivada,
cada imagen se muestra en su tamaño original.
