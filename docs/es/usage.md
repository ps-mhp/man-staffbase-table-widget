## El editor de un vistazo

El editor de tablas se abre con la configuración del widget y ocupa
toda la ventana.

- **Barra de encabezado:** a la izquierda, **Cerrar**; junto a ella, el título **Editar tabla
  ** y el estado —que indica si hay cambios pendientes y cuáles son—,
  por ejemplo, «3 celdas modificadas», «Estructura modificada» (filas, columnas,
  celdas unidas) o «Configuración modificada». En el centro, los botones de alternancia **Editor** · **Ordenador** ·
  **Tableta** · **Móvil**. A la derecha, **Deshacer**, **Rehacer** y
  **Ayuda**; en el extremo derecho, **Cancelar** y **Aplicar**.
- **Debajo, las pestañas** **Fuente**, **Alineación**, **Celdas**, **Imágenes**
  y **Datos**; a la derecha, **Importar (.csv, .xlsx)**. Debajo de las
  pestañas, las herramientas de la pestaña seleccionada; a continuación, la tabla con
  las letras de las columnas (A, B, C…) y los números de fila (1, 2, 3…), como en Excel.
- **Debajo de la tabla, la barra de estado:** tamaño de la tabla y la selección,
  por ejemplo, «4 filas · 3 columnas · Selección B2:B4», con una nota a la derecha.
- **A la derecha, el panel «Tabla»:** lo que se aplica a toda la tabla:
  **Primera ordenación**, **Filas visibles**, **Exportar** y **Ajustar imágenes**.
  **
- **Ordenador**, **tableta** y **móvil** muestran la tabla tal y como la ven los lectores
  — con opciones de plegado, botones de exportación y ordenación inicial. El panel
  permanece junto a ella; lo que cambies allí lo verás al instante. **Editor**
  te lleva de vuelta a la edición.

**Aplicar** guarda la tabla en el cuadro de diálogo del widget y cierra el
editor. Solo se guardará definitivamente al hacer clic en **Guardar** en Studio. Si se cierra con
cambios pendientes, se le preguntará: **Descartar**, **Seguir editando** o
**Aplicar**.

### Teclas

| Tecla | Efecto |
| --- | --- |
| Esc | Cierra lo que esté abierto en ese momento: la edición de una celda, el menú contextual, un menú de las pestañas, la barra de la biblioteca multimedia, la ayuda… y solo después el editor (con un mensaje de confirmación). |
| ⌘/Ctrl S | Aplicar, el editor permanece abierto |
| ⌘/Ctrl ↵ | Aplicar y cerrar |
| ⌘/Ctrl Z | Deshacer. En una celda en la que se esté escribiendo, solo deshace lo que se acaba de escribir. |
| ⇧ ⌘/Ctrl Z, Ctrl Y | Repetir |
| F1 | Activar/desactivar la ayuda |

## Crear la primera tabla

1. Coloca el widget **Tabla** en la página y abre la configuración del widget
  . El **editor de tablas** aparece automáticamente sobre el campo
   «Datos de la tabla».
2. **Haz doble clic** en una celda y escribe el texto. Al hacer clic en
   otra celda o pulsar **Esc**, se confirma la entrada.
3. Rellena la **primera fila** con los encabezados de las columnas.
4. Si faltan filas o columnas: pestaña **Celdas** → **Insertar** → p. ej., «Fila
   debajo» o «Columna a la derecha».
5. Haz clic en **Aplicar**, en la esquina superior derecha. Solo así se incorporará la tabla al
   widget.
6. Guarda la página en Studio.

Si aparece el título **«… – no aplicado»**, significa que aún queda algo pendiente. Al hacer clic
en **Deshacer** se anula el último paso.

## Importar una tabla existente desde Excel o CSV

1. En el editor de tablas, a la derecha de las pestañas, haz clic en **Importar (.csv,
   .xlsx)** y selecciona el archivo (`.csv`, `.xlsx` o `.xls`).
2. Comprueba el resultado: la importación **sustituye la tabla completa**, no se
   añade nada. De Excel se conservan las celdas unidas, la negrita/cursiva/
   subrayado, los colores, los tamaños de fuente, la alineación, así como el
  superíndice y el subíndice. En el caso de un libro de Excel, se utiliza la **primera
  hoja de cálculo**. Si era el archivo equivocado: **Deshacer**.
3. **Aplicar**.

Como alternativa, también se pueden **copiar y pegar** las celdas directamente desde Excel:
haz doble clic en una celda y pega; el bloque se distribuirá a partir de ese punto
a lo largo de varias celdas.

## Dar formato a las celdas

1. Selecciona las celdas a las que quieres dar formato: haz clic, arrastra con el botón del ratón
   pulsado, selecciona un rango con **Mayús** o añade
   más rangos con **Ctrl/Cmd**. Al hacer clic en la letra de una columna o
   en un número de fila se selecciona toda la columna o fila; al hacer clic en la celda de la esquina superior
   izquierda se selecciona toda la tabla; al hacer clic con el botón derecho en ese punto, se selecciona y se abre el
   menú contextual.
2. Pestaña **Fuente** para el tamaño de letra, negrita, cursiva, subrayado,
   tachado, superíndice/subíndice, color de letra y de fondo.
3. Pestaña **Alineación** para izquierda/centrado/derecha y arriba/centrado/abajo.
4. **Aplicar**.

Para aplicar un formato a otras celdas:

1. Selecciona una celda ya formateada.
2. Haz clic en la pestaña **Datos** → **Formato**.
3. Selecciona las celdas de destino: adoptarán el formato.

## Unir celdas

1. Selecciona las celdas que deseas unir.
2. Pestaña **Celdas** → **Unir**.
3. Para deshacer la acción, haz clic en **Separar**.

## Insertar una imagen en una celda

1. Selecciona la celda.
2. Pestaña **Imágenes** → **Imagen**. A la derecha se abre la biblioteca de imágenes como una barra
   «Imagen para la celda B3»; allí, selecciona una imagen existente o sube una nueva
  . **Esc** la cierra de nuevo sin insertar nada. Es más
   rápido arrastrando: arrastra una imagen desde la barra directamente a cualquier
   celda y suéltala allí.
3. Si hay varias imágenes de diferentes tamaños: selecciona todas las celdas con imágenes y
  , en **Tamaño de imagen**, selecciona «Misma altura que la primera imagen» o «Misma
   ancho que la primera imagen» (para ello se necesitan al menos dos imágenes).
   **Tamaño predeterminado** restablece los valores por defecto.
4. Si una imagen se sale de la tabla, activa el botón
   **Ajustar imágenes** en la parte derecha del panel **Tabla**; así, todas las imágenes permanecerán dentro del
   ancho de la tabla.

## Ordenar la tabla

1. En el panel **Tabla**, a la derecha, en **Primera ordenación**, selecciona la columna.
2. Debajo, selecciona **Ascendente** o **Descendente**. **Ninguno** anula la
   ordenación.
3. **Aplicar**. Esta ordenación es la inicial para todos los
   lectores y lectoras; el encabezado permanece siempre en la parte superior.

Más rápido para la columna en la que se encuentra el cursor: haz clic con el botón derecho en la columna →
**Orden** → «Ascendente (esta columna)» o «Descendente (esta
columna)».

## Contraer una tabla larga

1. A la derecha, en el panel **Tabla**, en **Líneas visibles**, introduce el número de
   líneas de datos que deben verse de inmediato. El valor predeterminado
   es 5; `0` muestra siempre todas las líneas.
2. Comprueba cómo queda con **Ordenador** o **Móvil** en la barra de encabezado.
3. **Aplicar**. A continuación, aparecerá en la página, debajo de la tabla, un botón
   «Mostrar N filas más» o «Mostrar menos filas».

## Ofrecer la tabla para su descarga

1. A la derecha, en el panel **Tabla**, selecciona **Exportar**:
   - **Tabla completa**: los lectores siempre descargan la tabla completa.
   - **Con selección de filas**: delante de cada fila hay una casilla; se exportan
     las filas seleccionadas; si no se selecciona nada, se exporta la tabla completa.
2. **Aplicar**. Encima de la tabla aparecerán los botones «Excel (.xlsx)» y
   «CSV». El archivo de Excel conserva el formato y las celdas vinculadas, y se
   puede volver a importar aquí; el archivo CSV se abre directamente en Excel
   alemán.

En la aplicación de Staffbase no se muestra la exportación; allí no es posible
descargar archivos de forma fiable. En el navegador móvil sí está disponible.

## Eliminar el formato

1. Selecciona las celdas en cuestión.
2. Pestaña **Datos** → **Formato** y selecciona la opción adecuada:
   eliminar todo, solo el formato de texto o solo los tamaños de imagen.
3. **Aplicar**.
