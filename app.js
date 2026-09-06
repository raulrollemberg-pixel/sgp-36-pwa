/* SGP 3.6 PWA */
(function () {
  'use strict';

  const STORAGE_LIST = 'sgp.v36.list';
  const STORAGE_SETTINGS = 'sgp.v36.settings';
  const STORAGE_INSTALL_DISMISS = 'sgp.v36.installDismiss';
  const STORAGE_SORT = 'sgp.v36.sort';

  const DEFAULTS = {
    sgpURL: 'https://sgp.pge.se.gov.br/comunicacoes',
    portalTJSE: 'https://www.tjse.jus.br/portaldoadvogado/',
    eproc1G: 'https://eproc1g.tjse.jus.br/eproc/',
    eproc2G: 'https://eproc2g.tjse.jus.br/eproc/',
    pjeJF: 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trf5-1g&redirect_uri=https%3A%2F%2Fpje1g.trf5.jus.br%2Fpje%2Flogin.seam&login=true&scope=openid',
    pjeTRF5: 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trf5-3g&redirect_uri=https%3A%2F%2Fpjett.trf5.jus.br%2Fpje%2Flogin.seam&login=true&scope=openid'
  };

  const CNJ_RE = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
  const CNJ_DIGITS_RE = /\b\d{20}\b/g;
  const DATE_RE = /\b(\d{2}\/\d{2}\/\d{4})\b/g;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function normalizeCNJ(raw) {
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 20) {
      return digits.slice(0,7)+'-'+digits.slice(7,9)+'.'+digits.slice(9,13)+'.'+digits.slice(13,14)+'.'+digits.slice(14,16)+'.'+digits.slice(16,20);
    }
    const m = String(raw).match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
    return m ? m[0] : String(raw).trim();
  }
  function digitsOnly(n) { return String(n).replace(/\D/g, ''); }
  function isValidCNJ(n) { return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(n); }

  function parseDate(s) {
    if (!s) return null;
    const m = String(s).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(+m[3], +m[2]-1, +m[1]);
    if (d.getFullYear() < 2000 || d.getFullYear() > new Date().getFullYear()+20) return null;
    return d;
  }

  function loadJSON(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch(e) { return fallback; }
  }
  function saveJSON(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

  let settings = Object.assign({}, DEFAULTS, loadJSON(STORAGE_SETTINGS, {}));
  let items = loadJSON(STORAGE_LIST, []);
  let sortState = loadJSON(STORAGE_SORT, { column: null, asc: true });
  let selected = new Set();

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function showPanel(name) {
    $$('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
    if (name === 'hoje') renderHoje();
    if (name === 'espelho') renderEspelho();
    if (name === 'lista') renderList();
  }

  function pendingItems() {
    return items.filter((i) => i.archiveState !== 'archived' && i.archiveState !== 'pendingOffline');
  }

  function mergeItems(incoming) {
    const map = new Map(items.map((i) => [i.processNumber, i]));
    let added = 0;
    for (const it of incoming) {
      const prev = map.get(it.processNumber);
      if (!prev) { map.set(it.processNumber, it); added++; }
      else {
        map.set(it.processNumber, Object.assign({}, prev, it, {
          archiveState: prev.archiveState || it.archiveState || 'none',
          snippet: (it.snippet && it.snippet.length >= (prev.snippet||'').length) ? it.snippet : prev.snippet
        }));
      }
    }
    items = Array.from(map.values());
    saveJSON(STORAGE_LIST, items);
    return added;
  }

  function extractFromText(text) {
    const found = new Map();
    let m;
    const re = new RegExp(CNJ_RE.source, 'g');
    while ((m = re.exec(text)) !== null) {
      const n = normalizeCNJ(m[0]);
      const start = Math.max(0, m.index - 80);
      const end = Math.min(text.length, m.index + m[0].length + 120);
      const snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
      const dates = [];
      let dm; const dre = new RegExp(DATE_RE.source, 'g');
      while ((dm = dre.exec(snip)) !== null) dates.push(dm[1]);
      const row = found.get(n) || { processNumber: n, snippet: snip, addedAt: new Date().toISOString(), archiveState: 'none' };
      row.snippet = snip;
      if (dates[0] && !row.prazoInicio) row.prazoInicio = dates[0];
      if (dates[1] && !row.prazo) row.prazo = dates[1];
      else if (dates[0] && !row.prazo) row.prazo = dates[0];
      if (/não\s*lida/i.test(snip)) row.status = 'Não Lida';
      else if (/\blida\b/i.test(snip)) row.status = 'Lida';
      if (/intima/i.test(snip)) row.tipo = 'Intimação';
      found.set(n, row);
    }
    const donly = new RegExp(CNJ_DIGITS_RE.source, 'g');
    while ((m = donly.exec(text)) !== null) {
      const n = normalizeCNJ(m[0]);
      if (isValidCNJ(n) && !found.has(n)) {
        found.set(n, { processNumber: n, snippet: '(só dígitos)', addedAt: new Date().toISOString(), archiveState: 'none' });
      }
    }
    return Array.from(found.values());
  }

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const split = (line) => {
      const out = []; let cur = ''; let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
        if (c === ';' && !q) { out.push(cur); cur = ''; continue; }
        cur += c;
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };
    const headers = split(lines[0]).map((h) => h.toLowerCase());
    const idx = (names) => headers.findIndex((h) => names.some((n) => h.includes(n)));
    const iCNJ = idx(['único','unico','cnj','número único','numero unico','processo']);
    const iStatus = idx(['status']);
    const iInicio = idx(['início do prazo','inicio do prazo','inicio']);
    const iFinal = idx(['final do prazo','data final','prazo']);
    const iTipo = idx(['tipo']);
    const iComp = idx(['competência','competencia']);
    const iResp = idx(['responsável','responsavel']);
    const rows = [];
    for (let li = 1; li < lines.length; li++) {
      const cols = split(lines[li]);
      const raw = iCNJ >= 0 ? cols[iCNJ] : cols[0];
      const n = normalizeCNJ(raw || '');
      if (!isValidCNJ(n)) continue;
      rows.push({
        processNumber: n,
        status: iStatus >= 0 ? cols[iStatus] : '',
        prazoInicio: iInicio >= 0 ? cols[iInicio] : '',
        prazo: iFinal >= 0 ? cols[iFinal] : '',
        tipo: iTipo >= 0 ? cols[iTipo] : '',
        competencia: iComp >= 0 ? cols[iComp] : '',
        responsavel: iResp >= 0 ? cols[iResp] : '',
        snippet: '',
        addedAt: new Date().toISOString(),
        archiveState: 'none'
      });
    }
    return rows;
  }

  function sortedPending() {
    let rows = pendingItems().slice();
    const col = sortState.column;
    if (!col) return rows;
    rows.sort((a, b) => {
      const da = parseDate(col === 'inicio' ? a.prazoInicio : a.prazo);
      const db = parseDate(col === 'inicio' ? b.prazoInicio : b.prazo);
      if (!da && !db) return a.processNumber.localeCompare(b.processNumber);
      if (!da) return 1;
      if (!db) return -1;
      if (da.getTime() !== db.getTime()) return sortState.asc ? da - db : db - da;
      return a.processNumber.localeCompare(b.processNumber);
    });
    return rows;
  }

  function toggleSort(col) {
    if (sortState.column === col) sortState.asc = !sortState.asc;
    else { sortState.column = col; sortState.asc = true; }
    saveJSON(STORAGE_SORT, sortState);
    renderEspelho();
  }

  function renderList() {
    const list = pendingItems();
    $('#listCount').textContent = String(list.length);
    const root = $('#processList');
    root.innerHTML = '';
    $('#listEmpty').hidden = list.length > 0;
    list.forEach((it) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = '<div class="cnj"></div><div class="meta"></div><div class="actions"></div>';
      div.querySelector('.cnj').textContent = it.processNumber;
      const bits = [it.status, it.competencia, it.prazoInicio && ('Início '+it.prazoInicio), it.prazo && ('Final '+it.prazo), it.tipo, it.responsavel].filter(Boolean);
      div.querySelector('.meta').textContent = bits.join(' · ') || it.snippet || '';
      const act = div.querySelector('.actions');
      [['Portal', settings.portalTJSE], ['eproc 1G', settings.eproc1G], ['eproc 2G', settings.eproc2G]].forEach(([label, tpl]) => {
        const a = document.createElement('a');
        a.className = 'btn btn-outline btn-sm';
        a.target = '_blank'; a.rel = 'noopener';
        a.href = tpl.includes('{processo') ? tpl.replaceAll('{processo}', it.processNumber).replaceAll('{processoDigits}', digitsOnly(it.processNumber)).replaceAll('{processoEncoded}', encodeURIComponent(it.processNumber)) : tpl;
        a.textContent = label;
        act.appendChild(a);
      });
      root.appendChild(div);
    });
  }

  function renderEspelho() {
    const rows = sortedPending();
    const hint = sortState.column
      ? ('Ordenado por ' + (sortState.column === 'inicio' ? 'Início' : 'Final') + (sortState.asc ? ' ↑ crescente' : ' ↓ decrescente'))
      : 'Toque no botão 1× crescente, 2× decrescente (linha inteira).';
    $('#sortHint').textContent = hint;
    const tb = $('#espelhoBody');
    tb.innerHTML = '';
    rows.forEach((it) => {
      const tr = document.createElement('tr');
      const checked = selected.has(it.processNumber) ? 'checked' : '';
      tr.innerHTML = '<td><input type="checkbox" data-cnj="'+it.processNumber+'" '+checked+' /></td>' +
        '<td>'+esc(it.status||'—')+'</td>' +
        '<td class="mono">'+esc(it.processNumber)+'</td>' +
        '<td class="mono">'+esc(it.prazoInicio||'—')+'</td>' +
        '<td class="mono">'+esc(it.prazo||'—')+'</td>' +
        '<td>'+esc(it.tipo||'—')+'</td>' +
        '<td><button type="button" class="btn btn-outline btn-sm" data-arch="'+it.processNumber+'">Arquivar</button></td>';
      tb.appendChild(tr);
    });
    tb.querySelectorAll('input[type=checkbox]').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) selected.add(cb.dataset.cnj); else selected.delete(cb.dataset.cnj);
      });
    });
    tb.querySelectorAll('button[data-arch]').forEach((b) => {
      b.addEventListener('click', () => archiveLocal([b.dataset.arch]));
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderHoje() {
    const today = new Date(); today.setHours(0,0,0,0);
    const week = new Date(today); week.setDate(week.getDate()+7);
    const pend = pendingItems();
    let nToday = 0, nWeek = 0;
    const near = [];
    pend.forEach((it) => {
      const d = parseDate(it.prazo);
      if (!d) return;
      if (d.getTime() === today.getTime()) nToday++;
      if (d >= today && d <= week) { nWeek++; near.push({ it, d }); }
      else if (d < today) near.push({ it, d });
    });
    $('#statToday').textContent = String(nToday);
    $('#statWeek').textContent = String(nWeek);
    $('#statPending').textContent = String(pend.length);
    near.sort((a,b) => a.d - b.d);
    const root = $('#hojeList');
    root.innerHTML = '';
    $('#hojeEmpty').hidden = near.length > 0;
    near.slice(0, 40).forEach(({ it, d }) => {
      const div = document.createElement('div');
      div.className = 'item';
      const overdue = d < today;
      div.innerHTML = '<div class="cnj"></div><div class="meta"></div>';
      div.querySelector('.cnj').textContent = it.processNumber;
      div.querySelector('.meta').textContent = (overdue ? 'VENCIDO · ' : '') + 'Final ' + (it.prazo||'') + (it.tipo ? ' · '+it.tipo : '');
      if (overdue) div.classList.add('overdue');
      root.appendChild(div);
    });
  }

  function archiveLocal(cnjs) {
    const set = new Set(cnjs);
    items = items.map((i) => set.has(i.processNumber) ? Object.assign({}, i, { archiveState: 'pendingOffline' }) : i);
    saveJSON(STORAGE_LIST, items);
    cnjs.forEach((c) => selected.delete(c));
    toast(cnjs.length + ' marcada(s) como arquivada(s) localmente');
    renderEspelho(); renderList(); renderHoje();
  }

  function renderPortals() {
    const grid = $('#portalGrid');
    grid.innerHTML = '';
    const ports = [
      ['SGP', settings.sgpURL],
      ['Portal Advogado', settings.portalTJSE],
      ['eproc 1G', settings.eproc1G],
      ['eproc 2G', settings.eproc2G],
      ['PJe JF', settings.pjeJF],
      ['PJe TRF5', settings.pjeTRF5]
    ];
    ports.forEach(([label, url]) => {
      const a = document.createElement('a');
      a.className = 'btn btn-block';
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = label;
      grid.appendChild(a);
    });
  }

  function fillSettings() {
    $('#sgpURL').value = settings.sgpURL;
    $('#portalTJSE').value = settings.portalTJSE;
    $('#eproc1G').value = settings.eproc1G;
    $('#eproc2G').value = settings.eproc2G;
    $('#pjeJF').value = settings.pjeJF;
    $('#pjeTRF5').value = settings.pjeTRF5;
    $('#openSgpBtn').href = settings.sgpURL;
  }

  function exportCSV() {
    const rows = pendingItems();
    const head = ['Numero Unico','Status','Inicio do Prazo','Final do Prazo','Tipo','Competencia','Responsavel'];
    const lines = [head.join(',')];
    rows.forEach((r) => {
      const cells = [r.processNumber, r.status, r.prazoInicio, r.prazo, r.tipo, r.competencia, r.responsavel].map((c) => '"' + String(c||'').replace(/"/g,'""') + '"');
      lines.push(cells.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sgp-espelho.csv';
    a.click();
  }

  // events
  $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showPanel(b.dataset.tab)));
  $$('[data-sort]').forEach((b) => b.addEventListener('click', () => toggleSort(b.dataset.sort)));
  $('#clearSortBtn').addEventListener('click', () => { sortState = { column: null, asc: true }; saveJSON(STORAGE_SORT, sortState); renderEspelho(); });
  $('#clearListBtn').addEventListener('click', () => {
    if (!confirm('Limpar todas as comunicações deste aparelho?')) return;
    items = []; selected.clear(); saveJSON(STORAGE_LIST, items); renderList(); renderEspelho(); renderHoje();
  });
  $('#extractBtn').addEventListener('click', () => {
    const text = $('#pasteArea').value || '';
    const found = extractFromText(text);
    const n = mergeItems(found);
    const el = $('#extractResult');
    el.hidden = false;
    el.textContent = 'Encontrados ' + found.length + ' · novos ' + n;
    toast('Extração: +' + n);
    renderList(); renderEspelho(); renderHoje();
  });
  $('#addManualBtn').addEventListener('click', () => {
    const n = normalizeCNJ($('#manualProcess').value);
    if (!isValidCNJ(n)) { toast('CNJ inválido'); return; }
    mergeItems([{ processNumber: n, addedAt: new Date().toISOString(), archiveState: 'none', snippet: '' }]);
    $('#manualProcess').value = '';
    toast('Adicionado');
    renderList(); renderEspelho(); renderHoje();
  });
  $('#csvFile').addEventListener('change', async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const text = await f.text();
    const rows = parseCSV(text);
    const n = mergeItems(rows);
    toast('CSV: ' + rows.length + ' linhas · +' + n);
    renderList(); renderEspelho(); renderHoje();
    ev.target.value = '';
  });
  $('#exportCsvBtn').addEventListener('click', exportCSV);
  $('#selectAllBtn').addEventListener('click', () => {
    pendingItems().forEach((i) => selected.add(i.processNumber));
    renderEspelho();
  });
  $('#archiveLocalBtn').addEventListener('click', () => {
    if (!selected.size) { toast('Selecione linhas'); return; }
    archiveLocal(Array.from(selected));
  });
  $('#saveSettingsBtn').addEventListener('click', () => {
    settings = {
      sgpURL: $('#sgpURL').value.trim() || DEFAULTS.sgpURL,
      portalTJSE: $('#portalTJSE').value.trim() || DEFAULTS.portalTJSE,
      eproc1G: $('#eproc1G').value.trim() || DEFAULTS.eproc1G,
      eproc2G: $('#eproc2G').value.trim() || DEFAULTS.eproc2G,
      pjeJF: $('#pjeJF').value.trim() || DEFAULTS.pjeJF,
      pjeTRF5: $('#pjeTRF5').value.trim() || DEFAULTS.pjeTRF5
    };
    saveJSON(STORAGE_SETTINGS, settings);
    fillSettings(); renderPortals(); toast('Salvo');
  });
  $('#resetSettingsBtn').addEventListener('click', () => {
    settings = Object.assign({}, DEFAULTS);
    saveJSON(STORAGE_SETTINGS, settings);
    fillSettings(); renderPortals(); toast('Padrões restaurados');
  });
  $('#dismissInstall').addEventListener('click', () => {
    localStorage.setItem(STORAGE_INSTALL_DISMISS, '1');
    $('#installBanner').hidden = true;
  });

  // migrate old list if empty
  if (!items.length) {
    const old = loadJSON('sgp.com.list.v1', []);
    if (old.length) {
      items = old.map((i) => Object.assign({ archiveState: 'none' }, i));
      saveJSON(STORAGE_LIST, items);
    }
  }

  if (localStorage.getItem(STORAGE_INSTALL_DISMISS) === '1') $('#installBanner').hidden = true;
  fillSettings();
  renderPortals();
  renderList();
  renderEspelho();
  renderHoje();
  const hash = (location.hash || '#hoje').slice(1);
  if (['hoje','lista','espelho','extrair','portais','ajustes'].includes(hash)) showPanel(hash);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
