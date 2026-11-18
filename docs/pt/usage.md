## O editor num relance

O editor de tabelas abre-se com as definições do widget e ocupa
toda a janela.

- **Barra de título:** à esquerda, **Fechar**; ao lado, o título **Editar tabela
  ** e o estado — que indica se há alterações que ainda não foram aplicadas e quais são,
  por exemplo, «3 células alteradas», «Estrutura alterada» (linhas, colunas,
  células ligadas) ou «Configurações alteradas». No centro, os botões de alternância **Editor** · **Desktop** ·
  **Tablet** · **Móvel**. À direita, **Reverter**, **Repetir** e
  **Ajuda**; na extrema direita, **Cancelar** e **Aplicar**.
- **Abaixo, os separadores** **Tipo de letra**, **Alinhamento**, **Células**, **Imagens**
  e **Dados**; à direita destes, **Importar (.csv, .xlsx)**. Por baixo dos
  separadores, as ferramentas do separador selecionado; em seguida, a tabela com
  letras de coluna (A, B, C …) e números de linha (1, 2, 3 …) tal como no Excel.
- **Por baixo da tabela, a linha de estado:** dimensão da tabela e a seleção,
  por exemplo, «4 linhas · 3 colunas · Seleção B2:B4», com uma nota à direita.
- **À direita, o painel «Tabela»:** o que se aplica a toda a tabela —
  **Primeira ordenação**, **Linhas visíveis**, **Exportação** e **Ajustar imagens**
  .
- **Desktop**, **Tablet** e **Móvel** mostram a tabela tal como os leitores
  a vêem — com colunas recolhidas, botões de exportação e primeira ordenação. O painel
  permanece ao lado; o que alterar aí é visível imediatamente. **Editor**
  leva de volta à edição.

**Aplicar** grava a tabela na caixa de diálogo do widget e fecha o
editor. Só fica guardada com **Guardar** no Studio. Quem fechar com
alterações pendentes será questionado: **Descartar**, **Continuar a editar** ou
**Aplicar**.

### Teclas

| Tecla | Efeito |
| --- | --- |
| Esc | Fecha o que estiver aberto no momento: edição de uma célula, menu de contexto, um menu das separadores, a barra da biblioteca multimédia, a Ajuda — e só depois o Editor (com uma mensagem a perguntar). |
| ⌘/Ctrl S | Aplicar, o editor permanece aberto |
| ⌘/Ctrl ↵ | Aplicar e fechar |
| ⌘/Ctrl Z | Desfazer. Numa célula em que se está a digitar, apenas desfaz o que foi digitado. |
| ⇧ ⌘/Ctrl Z, Ctrl Y | Repetir |
| F1 | Ativar/desativar a Ajuda |

## Criar a primeira tabela

1. Coloque o widget **Tabela** na página e abra as definições do widget
  . O **Editor de tabelas** aparece automaticamente acima do campo
   «Dados da tabela».
2. **Clique duas vezes** numa célula e introduza o texto. Ao clicar numa
   outra célula ou ao premir **Esc**, a introdução é confirmada.
3. Preencha a **primeira linha** com os títulos das colunas.
4. Se faltarem linhas ou colunas: separador **Células** → **Inserir** → por exemplo, «Linha
   abaixo» ou «Coluna à direita».
5. Clique em **Aplicar** no canto superior direito. Só assim é que a tabela aparece no
   widget.
6. Guarde a página no Studio.

Se aparecer o título **«… – não aplicado»**, significa que ainda falta algo. Um clique
em **Anular** reverte o último passo.

## Importar uma tabela existente do Excel ou CSV

1. No editor de tabelas, à direita das guias, clique em **Importar (.csv,
   .xlsx)** e selecione o ficheiro (`.csv`, `.xlsx` ou `.xls`).
2. Verifique o resultado: a importação **substitui a tabela na íntegra**, não sendo
   acrescentado nada. Do Excel, mantêm-se as células ligadas, o negrito/itálico/
   sublinhado, cores, tamanhos de letra, alinhamento, bem como caracteres em
  super- e sub-índice. No caso de uma pasta de trabalho do Excel, é utilizada a **primeira
  folha de cálculo**. Se for o ficheiro errado: **Anular**.
3. **Aplicar**.

Em alternativa, também é possível **copiar e colar** células diretamente do Excel:
clique duas vezes numa célula e cole — o bloco será distribuído a partir desse ponto
por várias células.

## Formatar células

1. Selecionar as células a formatar: clicar, arrastar com o botão do rato
   premido, selecionar uma área com a tecla **Shift** ou adicionar
   mais áreas com **Ctrl/Cmd**. Um clique numa letra de coluna ou
   num número de linha seleciona toda a coluna ou linha; a célula do canto superior
   esquerdo seleciona toda a tabela; um clique com o botão direito nesse local seleciona-a e abre o
   menu de contexto.
2. Separador **Fontes** para tamanho da fonte, negrito, itálico, sublinhado,
   riscado, sobrescrito/subscrito, cor da fonte e do fundo.
3. Separador **Alinhamento** para à esquerda/centrado/à direita e em cima/ao centro/em baixo.
4. **Aplicar**.

Para aplicar uma formatação a outras células:

1. Selecione uma célula já formatada.
2. Clique no separador **Dados** → **Formato**.
3. Selecione as células de destino — estas assumirão a formatação.

## Unir células

1. Selecione as células a unir.
2. Separador **Células** → **Unir**.
3. Para anular, clique em **Desfazer**.

## Inserir uma imagem numa célula

1. Selecione a célula.
2. Selecione o separador **Imagens** → **Imagem**. À direita, abre-se a biblioteca de imagens como uma barra
   «Imagem para a célula B3»; selecione aí uma imagem existente ou carregue uma nova
  . A tecla **Esc** fecha-a novamente, sem inserir nada. É mais
   rápido arrastar: arraste uma imagem da barra diretamente para qualquer
   célula e solte-a aí.
3. Se houver várias imagens com tamanhos diferentes: selecione todas as células com imagens e
  , em **Tamanho da imagem**, selecione «Altura igual à da primeira imagem» ou «Largura igual
   largura da primeira imagem» (para isso, são necessárias, pelo menos, duas imagens).
   **Tamanho padrão** reporá os valores iniciais.
4. Se uma imagem ultrapassar os limites da tabela, ative o botão
   **Ajustar imagens**, à direita no painel **Tabela** — assim, todas as imagens permanecerão dentro da
   largura da tabela.

## Ordenar a tabela

1. No painel **Tabela**, à direita, em **Primeira ordenação**, selecione a coluna.
2. Abaixo, selecione **Crescente** ou **Decrescente**. **Nenhuma** anula a
   ordenação.
3. **Aplicar**. Esta ordenação é a ordenação inicial para todos os
   leitores e leitoras; o cabeçalho permanece sempre no topo.

Mais rápido para a coluna sob o cursor: clique com o botão direito na coluna →
**Ordenação** → «Crescente (esta coluna)» ou «Decrescente (esta
coluna)».

## Ocultar tabela longa

1. À direita, no painel **Tabela**, em **Linhas visíveis**, introduza o número de
   linhas de dados que devem ser visíveis de imediato. O valor predefinido
   é 5; `0` mostra sempre todas as linhas.
2. Com **Desktop** ou **Móvel** na barra de cabeçalho, verifique como fica.
3. **Aplicar**. Na página, aparece então, por baixo da tabela, um botão
   «Mostrar mais N linhas» ou «Mostrar menos linhas».

## Disponibilizar a tabela para download

1. À direita, no painel **Tabela**, selecione **Exportar**:
   - **Tabela completa** — os leitores descarregam sempre a tabela completa.
   - **Com seleção de linhas** — há uma caixa de seleção à frente de cada linha; são exportadas
     as linhas selecionadas; sem seleção, é exportada a tabela completa.
2. **Aplicar**. Acima da tabela, aparecem os botões «Excel (.xlsx)» e
   «CSV». O ficheiro Excel mantém a formatação e as células ligadas e pode
   ser importado novamente aqui; o ficheiro CSV abre-se diretamente no Excel alemão
  .

Na aplicação Staffbase, a exportação não é apresentada — ali,
não é possível descarregar ficheiros de forma fiável. No navegador móvel, está disponível.

## Remover novamente a formatação

1. Selecione as células em questão.
2. Separador **Dados** → **Formatação** e selecione a opção adequada:
   remover tudo, apenas a formatação do texto ou apenas os tamanhos das imagens.
3. **Aplicar**.
