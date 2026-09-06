# SGP 3.6 (PWA + Windows Electron)

PWA alinhada ao SGP Mac 3.6 — Hoje, Comunicações, Espelho (ordenação), Extrair/CSV, Portais.

## iPhone (PWA)

Ver `SGP-3.6-PWA-Instalar-iPhone.md` (Safari → Adicionar à Tela de Início).

## Windows 10/11 x64 (Electron)

App de mesa **portátil** que carrega os mesmos arquivos da PWA (`index.html`, `app.js`, `styles.css`) numa janela Electron (título **SGP 3.6 PGE-SE**, mínimo 1100×700).

- Instalar / SmartScreen: `SGP-3.6-Windows-Instalar.md`
- Limitações vs Mac 3.6.0: `SGP-3.6-Windows-Limitacoes.md`
- Pacote de teste: `release/SGP-3.6-Windows-Teste.zip` (quando gerado)

```bash
npm install
npx electron-builder --win portable --x64
```

Se o alvo *portable* falhar (Wine), use `--win zip --x64` ou `--win dir --x64`.

Versão **3.6.0**. Arquivar continua só local — não é o sync do app Mac.

## Manual (PWA)

Ver `SGP-3.6-PWA-Manual.md`.
