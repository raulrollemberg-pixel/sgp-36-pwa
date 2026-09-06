# Pacote Windows SGP 3.6.0

Arquivo **`SGP-3.6-Windows-Teste.zip`** (~70 MB):

| Conteúdo | Notas |
|----------|--------|
| `SGP-3.6-3.6.0-Windows-x64-portable.exe` | Portátil NSIS, Windows 10/11 **x64** |
| `SGP-3.6-Windows-Instalar.md` | Como extrair / SmartScreen |
| `SGP-3.6-Windows-Limitacoes.md` | Vs Mac 3.6.0 |
| `SHA256SUMS.txt` | Integridade (`38d8bb7d…` no `.exe`) |

Build neste repositório:

```bash
npm install
npx electron-builder --win portable --x64
```

Fallback (Wine ausente): `npx electron-builder --win zip --x64` ou `--win dir --x64`.

Guias também na raiz do repositório. O `.exe` sozinho fica em `dist/` após o build (pasta ignorada pelo Git).
