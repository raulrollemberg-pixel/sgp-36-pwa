# Limitações do SGP 3.6 Windows vs Mac 3.6.0

O Windows 3.6.0 é a **mesma PWA** (Hoje, Comunicações, Espelho, Extrair/CSV, Portais, arquivo local) embrulhada em **Electron**. Não é um porte nativo do app Mac.

Seja honesto no uso diário: o que funciona no iPhone/PWA também funciona aqui; o que só existe no **SGP Mac 3.6.0** **não** foi portado.

## O que o Windows tem (paridade com a PWA)

- Abas Hoje, Lista (Comunicações), Espelho, Extrair, Portais, Ajustes
- Ordenação do Espelho por Início / Final do Prazo (crescente/decrescente)
- Extração de CNJ a partir de texto/HTML colado
- Importar CSV do Exportar do SGP; exportar CSV local
- Inclusão manual de processo (número CNJ)
- Arquivar **local/offline** (marca `pendingOffline` neste PC)
- URLs editáveis (SGP, Portal Advogado, eproc, PJe)
- Janela própria, título **SGP 3.6 PGE-SE**, mínimo 1100×700
- Links de portais e “Abrir SGP” no **navegador do sistema**

## O que **não** foi portado do Mac 3.6.0

### Touch ID e Keychain

- Sem Touch ID / biometria do Mac para desbloquear o app ou credenciais.
- Sem Keychain Access do macOS (senhas SGP/PJe/eproc não entram automaticamente no fluxo nativo).
- No Windows o login nos portais usa o **Edge/Chrome** e o gerenciador de senhas **desse navegador** (ou Windows Hello no próprio site, se o portal oferecer). Isso não é o mesmo que o Keychain do app Mac.

### WKWebView e SSO “fundo único”

- O Mac 3.6 usa **WKWebView** (WebKit): cookies, sessão SSO e auto-login ficam **dentro do app**, com profundidade de sessão típica do Safari/WebKit.
- No Windows Electron a UI local roda em Chromium, mas **SGP, eproc e PJe abrem fora**, no navegador padrão.
- Não há sessão SSO compartilhada entre a janela do SGP 3.6 e os portais.
- Não há o mesmo “já estou logado no WebView” do Mac: cada portal é uma aba/janela do Edge/Chrome, com cookies daquele navegador.
- SSO PJe (`sso.cloud.pje.jus.br`) depende do navegador externo, não de um WebView embutido.

### Arquivar e sincronização com o SGP

- No **Mac 3.6**, arquivar pode **enviar ao SGP** (sincroniza o estado remoto).
- Na PWA e no Electron Windows, **Arquivar (local)** só marca no `localStorage`. Não há fila que depois grave no servidor.
- Não use o Windows como se o SGP tivesse sido atualizado: a comunicação continua lá até alguém arquivar no site/app Mac.
- Não há sync entre Mac, iPhone e Windows. Três caches locais independentes.

### Navegador embutido e extração “ao vivo”

- Sem WebView interno para navegar o SGP e extrair a tabela sem copiar/exportar.
- Fluxo Windows = o da PWA: abrir SGP no navegador → copiar HTML/texto **ou** CSV → voltar ao app.
- XLSX nativo do Mac: aqui prefira **CSV** do Exportar do SGP.

### Offline

- Os arquivos da UI vêm no `.exe`/pasta (não dependem do GitHub Pages).
- O **service worker** da PWA **não** é usado no Electron (`file://`).
- Sem rede você ainda vê Hoje/Lista/Espelho **já importados**. Não atualiza comunicações do SGP offline.
- Sem o cache HTTP/WKWebView de páginas autenticadas que o Mac pode manter.

### Outros pontos do Mac que não existem aqui

- Sem sandbox/notário Apple, sem ícone da Dock/App Store.
- Sem integração nativa de notificações de prazo no estilo do app Mac (esta build não implementa toast do sistema).
- Sem assinatura Authenticode: o SmartScreen do Windows deve ser ignorado conscientemente (ver o guia de instalação).
- Sem Windows Hello *no app* (só se o site no navegador pedir).
- Layout ainda é o da PWA (abas embaixo). Serve no desktop 1100×700, mas não é UI nativa Win32.

## Riscos de expectativa

| Recurso | Mac 3.6.0 | Windows 3.6.0 (Electron) |
|---------|-----------|---------------------------|
| Hoje / Espelho / sort de prazo | Sim | Sim (cache local) |
| Extrair / CSV / CNJ | Sim (mais profundo no Mac) | Sim (colar / CSV) |
| Portais | WebView / Safari | Navegador externo |
| Arquivar → SGP | Sim (sync) | Não (só local) |
| Touch ID | Sim | Não |
| Keychain Mac | Sim | Não |
| SSO contínuo no app | WKWebView | Não |
| Offline da UI | App nativo | App empacotado |
| Store / assinatura | Notarizado (típico) | Portátil, sem cert |

## Conclusão

O Windows entrega **paridade com a PWA 3.6.0**, não paridade com o **binário Mac 3.6.0**. Para arquivar no SGP, SSO profundo e biometria, continue no Mac. Use o Windows para consultar prazos importados, ordenar o Espelho e abrir portais no navegador.
