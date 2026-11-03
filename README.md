# Laboratório Kim

Nova experiência institucional para dentistas e clínicas. HTML, CSS e JavaScript nativos, fontes locais e publicação estática, sem dependências de execução externas.

## Executar

Requer Node.js 20 ou superior.

```sh
npm run dev
# http://localhost:4173
npm run check
npm run build
```

O build gera `dist/`. Qualquer hospedagem estática pode servir essa pasta. O servidor de desenvolvimento escuta apenas na máquina local; a publicação não depende dele.

## Experiência

- Abertura com visualização conceitual de uma prótese cerâmica, identificada na interface.
- Manifesto com leitura progressiva durante a rolagem.
- Cena fixa com três etapas, progresso contínuo, enquadramentos ligados à rolagem e navegação direta.
- Fotografias reais reutilizadas do site do laboratório nos serviços e na história.
- Serviços em três categorias, com detalhes expansíveis.
- Contatos de pedidos digitais e analógicos, e-mail, mapa e redes sociais.
- Menu móvel com Escape e contenção de foco; abas com setas, Home e End; âncoras nativas; suporte a `prefers-reduced-motion`.

O comportamento com movimento reduzido troca a longa cena fixa por uma seção comum com etapas selecionáveis. Não há captura ou bloqueio artificial da rolagem.

## Organização

- `index.html`: conteúdo e estrutura semântica.
- `src/styles.css`: direção visual e adaptação de tamanhos.
- `src/main.js`: rolagem, etapas, categorias e menu.
- `public/images/`: imagens locais; o arquivo `hero-ceramica.jpg` é ilustrativo e as demais fotografias vêm do site original.
- `docs/estrategia-e-fontes.md`: pesquisa, prioridades e decisões editoriais.
- `docs/direcao-de-imagem.md`: prompt e proveniência da imagem gerada.
- `.openai/hosting.json`: identificação da prévia privada em Sites.

O conteúdo não usa depoimentos inventados, números de parceiros, promessas de prazo, formulário sem destino ou envio automático de arquivos clínicos.
