# Instalar SGP 3.6 no Windows 10/11 (x64)

Pacote **portátil** — não precisa de instalador MSI/NSIS nem de privilégio de administrador. Versão **3.6.0**.

## Requisitos

- Windows **10** ou **11**, 64 bits (x64)
- Conexão à internet só para abrir o SGP e os portais no navegador
- Os dados da agenda (Hoje / Lista / Espelho) ficam **neste computador**

## Como usar o ZIP de teste

Arquivo: `SGP-3.6-Windows-Teste.zip` (também em `release/` e nos artefatos do agente).

SHA-256 do executável portátil desta build:

`38d8bb7dc52150010bcc1a7952ce32ff3a440423ba990cc13a76426bb0f710df`

1. Copie o ZIP para o PC (Downloads, Área de trabalho ou pasta da PGE).
2. Clique com o botão direito → **Extrair tudo…** (ou 7-Zip / WinRAR).
3. Abra a pasta extraída.
4. Execute **`SGP-3.6-3.6.0-Windows-x64-portable.exe`** (ou `SGP 3.6.exe` se o pacote for o app descompactado).
5. Na primeira execução o Windows SmartScreen pode avisar que o app não é reconhecido (não há certificado de assinatura de código).

### SmartScreen — “Executar mesmo assim”

1. Na janela **O Windows protegeu o computador**, clique em **Mais informações**.
2. Confirme o nome do arquivo (**SGP 3.6** / `SGP-3.6-…-portable.exe`).
3. Clique em **Executar mesmo assim**.
4. Se o Explorer só mostrar “O Windows protegeu o PC” sem o botão: clique com o botão direito no `.exe` → **Propriedades** → marque **Desbloquear** → **OK**, e abra de novo.

O aviso some nas próximas aberturas no mesmo usuário.

## Primeiro uso

1. Aba **Extrair** → **Abrir SGP Comunicações** (abre no Edge/Chrome).
2. Faça login no SGP → copie a tabela **ou** use **Exportar CSV**.
3. Volte à janela do SGP 3.6 → cole o texto **ou** importe o CSV.
4. **Espelho** → ordene por Início / Final do Prazo (1× crescente, 2× decrescente).
5. **Hoje** mostra prazos do cache local.
6. **Portais** abrem no navegador do Windows (não dentro do app).

## Atualizar

Baixe o ZIP novo, extraia em outra pasta (ou substitua o `.exe`) e abra. Os dados em `localStorage` deste usuário do Windows costumam persistir se o `userData` do Electron for o mesmo (mesmo nome de produto **SGP 3.6**).

Para zerar o cache local: aba **Lista** → **Limpar**, ou apague a pasta de dados do app:

`%APPDATA%\sgp-36`  
(ou `%APPDATA%\SGP 3.6`, conforme o Electron gravar)

## Gerar o pacote de novo (desenvolvedor)

Em um Linux x64 com Node 20+ (Wine ajuda o alvo *portable*):

```bash
npm install
npx electron-builder --win portable --x64
```

Se o *portable* falhar (Wine ausente), use o ZIP do app descompactado:

```bash
npx electron-builder --win zip --x64
# ou
npx electron-builder --win dir --x64
```

Saída típica em `dist/`:

- `SGP-3.6-3.6.0-Windows-x64-portable.exe`
- `SGP-3.6-3.6.0-Windows-x64.zip` (conteúdo `win-unpacked`)

Depois junte o binário + este arquivo + `SGP-3.6-Windows-Limitacoes.md` em `SGP-3.6-Windows-Teste.zip`.

## O que isto **não** instala

- Não é a PWA do iPhone (Safari → Tela de Início).
- Não é o app nativo **SGP Mac 3.6.0** (Swift / WKWebView / Keychain / Touch ID).
- Não sincroniza “Arquivar” com o servidor SGP.
