# Pacote Windows SGP 3.6.0

O arquivo **`SGP-3.6-Windows-Teste.zip`** (binário portátil + docs) é gerado no build:

```bash
npm install
npx electron-builder --win portable --x64
# fallback: npx electron-builder --win zip --x64
```

Se o ZIP completo exceder o limite do Git, ele fica só em `artifacts/` do agente / `dist/` local. Os guias em português estão na raiz do repositório:

- `SGP-3.6-Windows-Instalar.md`
- `SGP-3.6-Windows-Limitacoes.md`
