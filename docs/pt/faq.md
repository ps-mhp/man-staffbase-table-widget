# Perguntas Frequentes

**Pergunta:** Na caixa de diálogo de configuração, em vez do editor de tabelas, só vejo
um campo de texto vazio com conteúdo críptico — a tabela está danificada?

Resposta: Não. O campo de texto é apenas um campo de segurança que o editor
normalmente oculta; o conteúdo enigmático (que começa por `b64:`) é a
tabela em formato codificado. Esta codificação impede que as traduções automáticas
da página danifiquem a tabela. Normalmente, basta atualizar a caixa de diálogo
para que o editor volte a aparecer.

**Pergunta:** Que formatos de ficheiro podem ser importados?

Resposta: `.csv`, bem como `.xlsx`/`.xls`. Na importação do Excel, as células ligadas
, a formatação das células (negrito/itálico/cores/alinhamento) e os caracteres maiúsculos/
baixo são mantidos; uma importação substitui sempre todo o conteúdo atual
da tabela.

**Pergunta:** Por que razão, numa tabela longa, nem todas as linhas
são apresentadas?

Resposta: Trata-se da configuração «Linhas visíveis» (separador «Dados») —
os visitantes veem inicialmente apenas o número definido de linhas de dados e
podem exibir as restantes através de um botão «Mostrar tudo». Se estiver definido em `0`,
a tabela mostra todas as linhas desde o início.

**Pergunta:** Uma imagem numa célula faz com que a tabela fique desajustada — o que fazer?

Resposta: Ative o botão «Ajustar imagens» (separador «Imagens») — este
limita todas as imagens à largura da tabela. Se estiver desativado,
cada imagem é apresentada no seu tamanho original.
