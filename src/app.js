/* 跑批作业处理 · 概念版：跑批记录 → 新建跑批 → 批次详情（执行/报告/推送） */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const wan = (n) => Number(n / 10000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' 万';
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const pctText = (p) => (p * 100).toFixed(1) + '%';
  const hhmm = (min) => {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + 'h' + (m ? pad(m) + 'm' : '') : m + 'm';
  };
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (dt, n) => { const x = new Date(dt.getTime()); x.setDate(x.getDate() + n); return x; };
  const dateISO = (dt) => dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  const md = (s) => s.slice(5);
  const fmtDT = (d) => {
    const u = new Date(d.getTime() + 3 * 3600 * 1000);
    return u.getUTCFullYear() + '-' + pad(u.getUTCMonth() + 1) + '-' + pad(u.getUTCDate()) + ' ' + pad(u.getUTCHours()) + ':' + pad(u.getUTCMinutes()) + ':' + pad(u.getUTCSeconds());
  };
  const nowText = () => fmtDT(new Date());

  const STRATEGIES = {
    credit_offline: {
      key: 'credit_offline', label: 'credit_offline', scene: '贷前', official: 'v20', beta: null, versions: ['v20', 'v18', 'v16'],
      product: 'MTN_UG_APP', speed: 217, waitMin: 22,
      sliceDate: '2026-10-23', sliceTime: '22:13',
      groups: [
        { id: 'wallet_active', name: '贷前活跃钱包户', crowd: 38729000, updated: '2026-11-05 05:19:06', desc: 'product_code Equal MoMoAdvance' },
        { id: 'wallet_high', name: '高价值提额候选', crowd: 1240000, updated: '2026-11-04 22:10:31', desc: 'credit_limit > 0 AND risk_level P' },
        { id: 'wallet_silent', name: '沉默户回捞', crowd: 2310000, updated: '2026-11-03 18:02:44', desc: '30 天无交易 AND 未 optout' },
        { id: 'wallet_sample', name: '模型样本 Test', crowd: 50000, updated: '2026-11-01 09:30:12', desc: 'model_sample = 1' }
      ],
      days: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      odDays: [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
      counts: [44443983, 12287629, 90177900], medians: [43900000, 12150000, 89100000],
      res: [{ k: 'CPU 峰值', v: '74%', p: 74 }, { k: '磁盘写 IO', v: '98%', p: 98 }, { k: '集群写入', v: '+25 GB', p: 82 }],
      anomalies: [
        { lv: 'warn', t: '分片重试 12 次', d: '均在 3 次内成功，无失败分片' },
        { lv: 'warn', t: '切片搬运较上一批晚 38 分钟', d: '06:40 开始，07:43 就绪' },
        { lv: 'bad', t: '磁盘写入峰值 98%', d: '10-28 21:20 前后，持续约 6 分钟' }
      ]
    },
    Dai_Zhong: {
      key: 'Dai_Zhong', label: 'Dai_Zhong', scene: '贷中', official: 'v47', beta: null, versions: ['v47', 'v42', 'v39'],
      product: 'MTN_UG_APP', speed: 604, waitMin: 73,
      sliceDate: '2026-10-05', sliceTime: '22:13',
      groups: [
        { id: 'loan_in', name: '贷中在贷户', crowd: 6492000, updated: '2026-11-05 05:22:32', desc: 'product_code Equal MoMoAdvance AND in_loan = 1' },
        { id: 'loan_high', name: '高价值在贷户', crowd: 860000, updated: '2026-11-04 21:40:10', desc: 'current_limit >= 50000' },
        { id: 'loan_cut', name: '降额实验组', crowd: 320000, updated: '2026-11-02 16:05:55', desc: 'experiment_group = cut' }
      ],
      days: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      odDays: [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      counts: [44120000, 11880000, 88900000], medians: [43900000, 12150000, 89100000],
      res: [{ k: 'CPU 峰值', v: '22%', p: 22 }, { k: '磁盘写 IO', v: '38%', p: 38 }, { k: '集群写入', v: '+3.2 GB', p: 30 }],
      anomalies: [
        { lv: 'warn', t: '等待启动 1h13m', d: '切片 07:43 就绪，08:56 才启动' },
        { lv: 'warn', t: '分片重试 3 次', d: '均为瞬时超时，重试成功' }
      ]
    }
  };

  const S = {
    view: 'list', tab: 'run', batchId: null,
    strategy: 'credit_offline', business: 'MTN_Uganda', version: 'v20', versionType: 'FORMAL', batchName: '', desc: '',
    groups: ['wallet_active'], gsearch: '', selDay: '2026-10-23', calOpen: true, confirmOpen: false, groupOpen: false, groupUp: false, pushArm: false, mcat: 'inc',
    pickerDraft: [], pickerSearch: '', running: false, pct: 0, timer: null, lastShard: -1
  };

  function cfgOf(strategy, groups, day) {
    const s = STRATEGIES[strategy];
    const gs = s.groups.filter((g) => groups.includes(g.id));
    const crowd = gs.reduce((a, g) => a + g.crowd, 0);
    return {
      strategy, version: s.official, versionType: 'FORMAL', sliceDate: day || s.sliceDate, sliceTime: s.sliceTime,
      groups: groups.slice(), crowd, runMin: Math.max(1, Math.round(crowd / (s.speed * 10000) * 60)), shards: Math.ceil(crowd / 4000)
    };
  }

  const BATCHES = [
    { retries: 12, id: '459_20261028091106', name: '贷前-1028', status: 'completed', started: '2026-10-28 09:11:06', ended: '2026-10-29 04:26:20', config: cfgOf('credit_offline', ['wallet_active'], '2026-10-27'), pushStep: 1, pushBatch: null, pushedAt: null },
    { retries: 3, id: '460_20261027085645', name: '贷中-1027', status: 'completed', started: '2026-10-27 08:56:45', ended: '2026-10-27 12:18:00', config: cfgOf('Dai_Zhong', ['loan_in'], '2026-10-26'), pushStep: 1, pushBatch: null, pushedAt: null },
    { retries: 3, id: '458_20261016072310', name: '贷前-1016', status: 'completed', started: '2026-10-16 07:23:10', ended: '2026-10-17 02:15:40', config: cfgOf('credit_offline', ['wallet_active'], '2026-10-15'), pushStep: 5, pushBatch: 'D20261016-01', pushedAt: '2026-10-17 09:12:00' },
    { retries: 0, id: '455_20261018082130', name: '贷中-1018', status: 'completed', started: '2026-10-18 08:21:30', ended: '2026-10-18 11:27:30', config: cfgOf('Dai_Zhong', ['loan_in'], '2026-10-17'), pushStep: 5, pushBatch: 'D20261018-01', pushedAt: '2026-10-18 15:40:00' },
    { retries: 1, id: '457_20261005064520', name: '贷前-1005', status: 'completed', started: '2026-10-05 06:45:20', ended: '2026-10-06 02:51:20', config: cfgOf('credit_offline', ['wallet_active'], '2026-10-04'), pushStep: 5, pushBatch: 'D20261005-01', pushedAt: '2026-10-06 10:20:00' }
  ];

  const cur = () => STRATEGIES[S.strategy];
  const currentBatch = () => BATCHES.find((b) => b.id === S.batchId) || null;
  const versionOf = (cfg) => { const s = STRATEGIES[cfg.strategy]; return cfg.version || (cfg.versionType === 'FORMAL' ? s.official : s.beta); };
  const totalMin = (cfg) => cfg.runMin + 63 + STRATEGIES[cfg.strategy].waitMin;

  function snap() {
    const s = cur();
    const groups = s.groups.filter((g) => S.groups.includes(g.id));
    const crowd = groups.reduce((a, g) => a + g.crowd, 0);
    return {
      strategy: S.strategy, business: S.business, version: S.version, versionType: S.versionType, groups: groups.map((g) => g.id), sliceDate: s.sliceDate, sliceTime: s.sliceTime,
      crowd, runMin: crowd ? Math.max(1, Math.round(crowd / (s.speed * 10000) * 60)) : 0,
      shards: Math.ceil(crowd / 4000)
    };
  }

  function batchState(b) {
    if (!b) return { t: '未开始', c: '' };
    if (b.status === 'running') return { t: '执行中', c: 'running' };
    if (b.status === 'stopped') return { t: '已停止', c: '' };
    return { t: '已完成', c: '' };
  }

  function pushState(b) {
    if (!b) return { t: '-', c: 'na' };
    if (b.pushStep >= 5) return { t: '已改额', c: 'ok' };
    if (b.pushStep >= 3) return { t: '待改额', c: 'warn' };
    return { t: '待推送', c: 'warn' };
  }

  function renderHead() {
    if (S.view === 'list') {
      return '<div class="ws-top"><div class="ws-left"><div class="ws-h1">跑批记录</div></div></div>';
    }
    if (S.view === 'create') {
      const s = cur();
      return '<div class="ws-top"><div class="ws-left"><div class="ws-h1">跑批发起</div></div>' +
        '<div class="ws-right"><div class="slice-chip"><span>切片日</span><b>' + s.sliceDate + '</b><i>' + s.sliceTime + '</i></div></div></div>';
    }
    const b = currentBatch(); if (!b) return '';
    const cfg = b.config, s = STRATEGIES[cfg.strategy];
    const groups = s.groups.filter((g) => cfg.groups.includes(g.id)).map((g) => g.name).join('、');
    const st = batchState(b);
    return '<div class="ws-back-row"><button class="back" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>跑批记录</button></div>' +
      '<div class="ws-top"><div class="ws-left"><div class="ws-h1">' + (b.name || b.id) + '</div><span class="badge ' + st.c + '">' + st.t + '</span></div>' +
      '<div class="ws-right"><div class="slice-chip"><span>切片日</span><b>' + (cfg.sliceDate || s.sliceDate) + '</b><i>' + (cfg.sliceTime || s.sliceTime) + '</i></div></div></div>' +
      '<div class="ws-meta">' + b.id + ' · ' + s.label + ' ' + versionOf(cfg) + ' · ' + groups + ' · ' + b.started + (b.ended ? ' → ' + b.ended : '') + '</div>';
  }

  function renderStages() {
    const b = currentBatch();
    $('#stages').hidden = S.view !== 'detail';
    if (!b) return;
    $('#stRun').textContent = b.status === 'running' ? pctText(S.pct) + ' · 剩余 ' + hhmm((1 - S.pct) * totalMin(b.config)) : b.status === 'stopped' ? '已停止' : '已完成';
    $('#stReport').textContent = b.status === 'completed' ? '已生成' : '待生成';
    $('#stPush').textContent = b.pushStep >= 5 ? '已改额' : b.pushStep >= 3 ? '已推送 · 待改额' : '待推送';
    $('#flagRun').className = 'st-flag ' + (b.status === 'running' ? 'live' : b.status === 'completed' ? 'done' : '');
    $('#flagReport').className = 'st-flag ' + (b.status === 'completed' ? 'done' : '');
    $('#flagPush').className = 'st-flag ' + (b.pushStep >= 5 ? 'done' : b.pushStep >= 3 ? 'warn' : '');
    $$('.stage').forEach((el) => el.classList.toggle('active', el.dataset.tab === S.tab));
  }

  /* ---------- list ---------- */
  function renderList() {
    const rows = BATCHES.map((b) => {
      const st = batchState(b), ps = pushState(b);
      const s = STRATEGIES[b.config.strategy];
      const dur = b.status === 'running' ? '—' : hhmm(totalMin(b.config));
      return '<tr data-open="' + b.id + '">' +
        '<td class="nm">' + (b.name || b.id) + '</td>' +
        '<td class="mono">' + b.id + '</td>' +
        '<td>' + s.label + ' ' + versionOf(b.config) + '</td>' +
        '<td>' + (b.config.sliceDate || s.sliceDate).slice(5) + '</td>' +
        '<td class="r">' + wan(b.config.crowd) + '</td>' +
        '<td><span class="tag ' + (st.c === 'running' ? 'info' : st.c === '' && st.t === '已停止' ? 'na' : 'ok') + '">' + st.t + '</span></td>' +
        '<td class="r">' + dur + '</td>' +
        '<td><span class="tag ' + ps.c + '">' + ps.t + '</span></td>' +
        '</tr>';
    }).join('');
    $('#panelList').innerHTML = '<div class="list-head"><h3>跑批记录</h3></div>' + '<table class="batch-table"><thead><tr><th>批次名称</th><th>批次号</th><th>策略</th><th>切片日</th><th class="r">人数</th><th>状态</th><th class="r">耗时</th><th>推送</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ---------- create ---------- */
  function dayStatus(s, dayISO) {
    const diff = Math.round((parseISO(dayISO) - parseISO(s.sliceDate)) / 86400000);
    if (diff > 0) return { pending: true };
    const bad = diff === -9 || diff === -8 || diff === -7;
    return { wallet: 0, od: bad ? 2 : 0, pool: 0, pending: false };
  }

  function renderCalendar() {
    const s = cur();
    const endD = parseISO(S.todayISO || s.sliceDate);
    const startD = addDays(endD, -11);
    let cols = '';
    for (let i = 0; i < 12; i++) {
      const dt = addDays(startD, i), iso = dateISO(dt), st = dayStatus(s, iso);
      const bars = st.pending
        ? '<i class="na"></i><i class="na"></i><i class="na"></i>'
        : [st.wallet, st.od, st.pool].map((v) => '<i class="' + (v === 2 ? 'bad' : 'ok') + '"></i>').join('');
      cols += '<div class="cal-col' + (st.pending ? ' pending' : '') + (iso === S.selDay ? ' sel' : '') + '" data-day="' + iso + '"><div class="cal-d">' + iso.slice(8) + '</div><div class="cal-bars">' + bars + '</div></div>';
    }
    return cols;
  }

  function renderCalDetail() {
    const s = cur();
    const day = S.selDay || s.sliceDate, st = dayStatus(s, day);
    if (st.pending) {
      const eta = dateISO(addDays(parseISO(day), 2));
      return '<div class="cd-head"><b>' + day + '</b><span>数据未出</span><span>·</span><span>T+2，预计 ' + eta + ' 产出</span></div>' +
        '<div class="cd-grid"><div class="cd-card"><span class="cd-name">钱包变量表</span><b class="dim">—</b><span class="cd-meta"><i class="dl">—</i><span class="tag na">待出数</span></span></div>' +
        '<div class="cd-card"><span class="cd-name">OD 变量表</span><b class="dim">—</b><span class="cd-meta"><i class="dl">—</i><span class="tag na">待出数</span></span></div>' +
        '<div class="cd-card"><span class="cd-name">圈选池</span><b class="dim">—</b><span class="cd-meta"><i class="dl">—</i><span class="tag na">待出数</span></span></div></div>';
    }
    const names = ['钱包变量表', 'OD 变量表', '圈选池'], keys = ['wallet', 'od', 'pool'];
    const cards = names.map((nm, i) => {
      const v = st[keys[i]], base = s.medians[i];
      if (v === 2) {
        return '<div class="cd-card"><span class="cd-name">' + nm + '</span><b class="dim">0</b><span class="cd-meta"><i class="dl">—</i><span class="tag bad">缺数</span></span></div>';
      }
      const count = Math.round(base * (0.985 + ((i + day.charCodeAt(9)) % 5) * 0.006));
      const delta = (count - base) / base * 100;
      return '<div class="cd-card"><span class="cd-name">' + nm + '</span><b>' + fmt(count) + '</b><span class="cd-meta"><i class="dl">' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%</i><span class="tag ok">就绪</span></span></div>';
    }).join('');
    const ok = [st.wallet, st.od, st.pool].filter((v) => v === 0).length;
    return '<div class="cd-head"><b>' + day + '</b><span>' + ok + '/3 源就绪</span><span>·</span><span>59 项检查 ' + (ok === 3 ? '59/59 通过' : (56 + ok) + '/59 通过') + '</span></div><div class="cd-grid">' + cards + '</div>';
  }

  function renderConfigForm() {
    const s = cur();
    const cfg = snap();
    const versions = s.versions || [s.official];
    const chev = '<svg class="chev" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const sel = (id, opts) => '<div class="selwrap"><select class="input select" id="' + id + '">' + opts + '</select>' + chev + '</div>';
    const stratOpts = Object.values(STRATEGIES).map((x) =>
      '<option value="' + x.key + '"' + (x.key === S.strategy ? ' selected' : '') + '>' + x.label + ' · ' + x.scene + '</option>').join('');
    const vtOpts = '<option value="FORMAL"' + (S.versionType === 'FORMAL' ? ' selected' : '') + '>Official</option>' +
      (s.beta ? '<option value="BETA"' + (S.versionType === 'BETA' ? ' selected' : '') + '>Test</option>' : '');
    const verOpts = versions.map((v) => '<option value="' + v + '"' + (v === S.version ? ' selected' : '') + '>' + v + '</option>').join('');
    const person = '<svg class="gicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.2 2.8-4.9 5.5-4.9s4.9 1.7 5.5 4.9"/><path d="M15.8 6.2a2.8 2.8 0 010 5.4"/><path d="M17.6 19c-.2-1.6-.7-2.9-1.4-3.8 2.2.2 3.8 1.7 4.3 3.8"/></svg>';
    const selChips = s.groups.filter((g) => S.groups.includes(g.id)).map((g) =>
      '<span class="gchip" title="' + g.updated + ' · ' + g.desc + '"><b>' + g.name + '</b><span class="n">' + fmt(g.crowd) + '</span><i class="x" data-gremove="' + g.id + '">×</i></span>'
    ).join('');
    const selDetails = s.groups.filter((g) => S.groups.includes(g.id)).map((g) =>
      '<div class="gmeta"><span class="nm">' + g.name + '</span><span class="num">' + fmt(g.crowd) + '</span><span class="time">' + g.updated + '</span><span class="desc">' + g.desc + '</span></div>'
    ).join('');
    const q = (S.gsearch || '').trim().toLowerCase();
    const listRows = s.groups.filter((g) => !q || g.name.toLowerCase().includes(q)).map((g) => {
      const on = S.groups.includes(g.id);
      return '<button class="gopt ' + (on ? 'on' : '') + '" data-gtoggle="' + g.id + '" title="' + g.updated + ' · ' + g.desc + '"><span class="box"></span><span class="nm">' + g.name + '</span><span class="num">' + fmt(g.crowd) + '</span></button>';
    }).join('') || '<div class="gp-empty">没有匹配的分组</div>';
    const field = (label, inner, cls) => '<div class="field ' + (cls || '') + '"><label>' + label + '</label>' + inner + '</div>';
    return '<section class="box form-box">' +
      '<div class="box-head"><div><h3>跑批配置</h3><p class="sub">选择业务线与策略版本，指定批次与人群后发起</p></div></div>' +
      '<div class="grid3">' +
        field('业务线<i class="req">*</i>', sel('bizSel', '<option value="MTN_Uganda" selected>MTN_Uganda</option>')) +
        field('策略<i class="req">*</i>', sel('strategySel', stratOpts)) +
        field('版本类型<i class="req">*</i>', sel('versionSel', vtOpts)) +
      '</div>' +
      '<div class="grid3">' +
        field('策略版本<i class="req">*</i>', sel('verSel', verOpts)) +
        field('批次名称<i class="req">*</i>', '<input class="input" id="batchName" placeholder="例如：贷前-' + dateISO(new Date()).slice(5).replace('-', '') + '" value="' + (S.batchName || '').replace(/"/g, '&quot;') + '">') +
        field('描述', '<input class="input" id="batchDesc" placeholder="可选，一句话说明" value="' + (S.desc || '').replace(/"/g, '&quot;') + '">') +
      '</div>' +
      '<div class="field" style="margin-top:14px"><label>客户分组<i class="req">*</i></label>' +
        '<div class="gblock' + (S.groupOpen ? ' open' : '') + '">' +
        '<div class="gsel">' +
          '<button class="gsel-box' + (S.groupOpen ? ' open' : '') + '" data-gopen>' +
            '<div class="gchips">' + (selChips || '<span class="gsel-ph">选择客户分组</span>') + '</div>' +
            '<svg class="gsel-chev" viewBox="0 0 10 6" fill="none" style="transform:translateY(-50%) rotate(' + (S.groupOpen ? 180 : 0) + 'deg)"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          (S.groupOpen ? '<div class="gpop' + (S.groupUp ? ' up' : '') + '">' +
            '<div class="gp-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6.2"/><path d="M16 16l4.5 4.5" stroke-linecap="round"/></svg><input id="gSearch" placeholder="搜索分组名称" value="' + (S.gsearch || '').replace(/"/g, '&quot;') + '"></div>' +
            '<div class="gpop-list">' + listRows + '</div>' +
            '<div class="gpop-foot"><span>已选 ' + cfg.groups.length + ' 个 · 合计 ' + fmt(cfg.crowd) + ' 人</span><span class="sp"></span><button data-gclear>清空</button><button data-gdone>完成</button></div>' +
          '</div>' : '') +
        '</div>' +
        '<div class="gsel-sum">已选 <b>' + cfg.groups.length + '</b> 个分组 · 合计 <b>' + fmt(cfg.crowd) + '</b> 位客户</div>' +
        (cfg.groups.length ? '<div class="gmeta-list"><div class="gmeta-head"><span>分组名称</span><span>客户数</span><span>更新时间</span><span>筛选条件</span></div>' + selDetails + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="form-foot split"><div class="run-sum"><span>预计 <b>' + wan(cfg.crowd) + '</b> 人</span><i>·</i><span><b>' + fmt(cfg.shards) + '</b> 分片</span><i>·</i><span>约 <b>' + hhmm(cfg.runMin) + '</b></span></div>' +
        (cfg.groups.length ? '' : '<span class="foot-hint">请选择至少一个客户分组</span>') +
        '<button class="btn primary" data-launch' + (cfg.groups.length ? '' : ' disabled') + '>发起跑批</button></div>' +
    '</section>';
  }

  function renderReadiness() {
    const s = cur();
    const day = s.sliceDate;
    const st = dayStatus(s, day) || dayStatus(s, s.sliceDate);
    const ok = [st.wallet, st.od, st.pool].filter((v) => v === 0).length;
    const cal = S.calOpen
      ? '<div class="ready-body"><div class="cal-head"><span>' + md(dateISO(addDays(parseISO(S.todayISO || day), -11))) + ' → ' + md(S.todayISO || day) + '</span>' +
        '<div class="legend"><span><b style="background:#5BC08D"></b>就绪</span><span><b style="background:#E06B6B"></b>缺数</span><span><b style="background:#C9D0DC"></b>待出数</span></div></div>' +
        '<div class="cal">' + renderCalendar() + '</div><div class="cal-detail">' + renderCalDetail() + '</div></div>'
      : '';
    return '<section class="box readiness"><div class="ready-row"><span class="ready-dot"></span><b>切片已就绪</b>' +
      '<span class="ready-meta">切片日 ' + day + ' ' + s.sliceTime + ' · ' + ok + '/3 源就绪 · ' + (ok === 3 ? '59/59' : (56 + ok) + '/59') + ' 检查通过 · 7/7 表</span>' +
      '<button class="btn sm ghost" data-toggle-cal> ' + (S.calOpen ? '收起日历' : '查看日历') + ' <svg viewBox="0 0 10 6" fill="none" style="width:9px;height:5px;transform:rotate(' + (S.calOpen ? 180 : 0) + 'deg)"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '</div>' + cal + '</section>';
  }

  function renderCreate() {
    $('#panelCreate').innerHTML = renderReadiness() + '<div style="margin-top:14px">' + renderConfigForm() + '</div>';
  }

  /* ---------- group picker ---------- */
  function openGroupPicker() { S.pickerDraft = S.groups.slice(); S.pickerSearch = ''; renderPicker(); }
  function closePicker() { $('#modalRoot').innerHTML = ''; }

  function renderPicker() {
    const s = cur();
    const q = (S.pickerSearch || '').trim().toLowerCase();
    const list = s.groups.filter((g) => !q || g.name.toLowerCase().includes(q));
    const draft = S.pickerDraft || [];
    const total = s.groups.filter((g) => draft.includes(g.id)).reduce((a, g) => a + g.crowd, 0);
    const rows = list.map((g) => {
      const on = draft.includes(g.id);
      return '<button class="grow ' + (on ? 'on' : '') + '" data-pick="' + g.id + '"><span class="cbx"></span><span class="gname">' + g.name + '<i>' + (g.desc || '') + '</i></span><span class="gnum">' + fmt(g.crowd) + '</span><span class="gtime">' + (g.updated || '-') + '</span></button>';
    }).join('');
    $('#modalRoot').innerHTML = '<div class="modal-mask" data-close-picker></div><div class="picker">' +
      '<div class="picker-head"><div><h3>选择客户分组</h3><p>按名称搜索，可多选</p></div><button class="picker-x" data-close-picker>×</button></div>' +
      '<div class="picker-search"><input id="gSearch" placeholder="搜索分组名称" value="' + (S.pickerSearch || '').replace(/"/g, '&quot;') + '"></div>' +
      '<div class="picker-table"><div class="ghead"><span></span><span>分组</span><span class="r">人数</span><span class="r">更新时间</span></div>' + (rows || '<div class="gempty">没有匹配的分组</div>') + '</div>' +
      '<div class="picker-foot"><span>已选 <b>' + draft.length + '</b> 个 · 合计 <b>' + wan(total) + '</b></span><div><button class="btn sm ghost" data-picker-reset>重置</button><button class="btn sm" data-close-picker>取消</button><button class="btn sm primary" data-picker-ok ' + (draft.length ? '' : 'disabled') + '>确定</button></div></div>' +
    '</div>';
    const input = $('#gSearch');
    if (input) input.addEventListener('input', function (e) {
      S.pickerSearch = e.target.value; renderPicker();
      const i = $('#gSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    });
  }

  /* ---------- run ---------- */
  function ringSVG(pct) {
    const c = 2 * Math.PI * 52;
    return '<svg width="124" height="124" viewBox="0 0 124 124"><circle cx="62" cy="62" r="52" fill="none" stroke="#EEF1F6" stroke-width="10"/>' +
      '<circle id="ringFg" cx="62" cy="62" r="52" fill="none" stroke="#5095FF" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '"/></svg>';
  }

  function renderRun() {
    const b = currentBatch(); if (!b) return;
    const cfg = b.config, s = STRATEGIES[cfg.strategy];
    const running = b.status === 'running';
    const pct = running ? S.pct : (b.status === 'completed' ? 1 : (b.pct || 0));
    const total = totalMin(cfg);
    $('#panelDetail').innerHTML = '<div class="box run-top"><div class="ring">' + ringSVG(pct) + '<div class="val"><b id="rPct">' + pctText(pct) + '</b><i>' + (running ? '已完成' : b.status === 'completed' ? '已结束' : '已停止') + '</i></div></div>' +
      '<div class="run-stats"><div><i>已处理</i><b id="rProcessed">' + fmt(Math.round(cfg.crowd * pct)) + '</b></div><div><i>完成分片</i><b id="rShards">' + fmt(Math.round(cfg.shards * pct)) + ' / ' + fmt(cfg.shards) + '</b></div><div><i>' + (running ? '实时速度' : '平均速度') + '</i><b id="rSpeed">' + (running ? Math.round(s.speed * 0.97) : s.speed) + ' 万/h</b></div><div><i>剩余时间</i><b id="rEta">' + (running ? hhmm((1 - pct) * total) : '—') + '</b></div><div><i>失败分片</i><b id="rFail" style="color:#1F9D6B">0</b></div><div><i>' + (running ? '已运行' : '总耗时') + '</i><b id="rElapsed">' + (running ? hhmm(pct * total) : hhmm(total)) + '</b></div></div>' +
      '<div class="run-side">' + (running ? '<button class="btn danger" data-stop>停止跑批</button>' : '') + '<span class="muted">' + b.id + '</span></div></div>' +
      '<div class="chart-grid"><div class="box chart-box"><h3>' + (running ? '实时速度' : '跑批速度') + '</h3><p class="sub">万人/小时</p><svg id="liveChart" viewBox="0 0 520 140" height="140"></svg></div>' +
      '<div class="box"><h3>分片进度</h3><p class="sub">每格 = 1 个分片</p><canvas class="shard-canvas" id="liveShards"></canvas><div class="pctl"><span>完成 <b id="pDone">' + fmt(Math.round(cfg.shards * pct)) + '</b></span><span>失败 <b>0</b></span><span>待处理 <b id="pWait">' + fmt(cfg.shards - Math.round(cfg.shards * pct)) + '</b></span></div></div></div>' +
      '<div class="box anomaly" style="margin-top:14px"><div class="box-head"><div><h3>异常与重试</h3></div></div><ul>' +
        '<li><span class="pin"></span><div><b>分片重试 ' + (b.retries || 0) + ' 次</b> <span>瞬时超时触发，重试后全部成功</span></div><span class="tag warn">已执行</span></li>' +
        '<li><span class="pin" style="background:#DDE2EA"></span><div><b>整体重试</b> <span>' + (b.failShards > 0 ? '失败分片 ' + b.failShards + '，已自动执行整体重试' : '跑批结束后自动执行一次 · 当前失败分片 0') + '</span></div><span class="tag na">未触发</span></li>' +
      '</ul></div>';
    drawLiveChart();
    requestAnimationFrame(function () { drawShards($('#liveShards'), cfg.shards, Math.round(cfg.shards * pct), 0, false); });
  }

  function updateRunLive() {
    const b = currentBatch(); if (!b) return;
    const cfg = b.config, s = STRATEGIES[cfg.strategy];
    const p = S.pct, total = totalMin(cfg);
    const set = (id, v) => { const e = $('#' + id); if (e) e.textContent = v; };
    set('rPct', pctText(p));
    const ring = $('#ringFg'); if (ring) ring.setAttribute('stroke-dashoffset', String(2 * Math.PI * 52 * (1 - p)));
    set('rProcessed', fmt(Math.round(cfg.crowd * p)));
    set('rShards', fmt(Math.round(cfg.shards * p)) + ' / ' + fmt(cfg.shards));
    set('rSpeed', Math.round(s.speed * (0.92 + Math.random() * 0.16)) + ' 万/h');
    set('rEta', hhmm((1 - p) * total));
    set('rElapsed', hhmm(p * total));
    set('pDone', fmt(Math.round(cfg.shards * p)));
    set('pWait', fmt(cfg.shards - Math.round(cfg.shards * p)));
    const sub = $('#stRun'); if (sub) sub.textContent = pctText(p) + ' · 剩余 ' + hhmm((1 - p) * total);
    drawLiveChart();
    const shardKey = Math.floor(p * 100);
    if (S.lastShard !== shardKey) { S.lastShard = shardKey; drawShards($('#liveShards'), cfg.shards, Math.round(cfg.shards * p), 0, false); }
  }

  /* ---------- charts ---------- */
  function speedPoints(n, base, phase) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(base * (0.9 + 0.1 * Math.sin(i * 0.9 + phase) + 0.05 * Math.cos(i * 1.7)));
    return pts;
  }

  function drawSpeed(svg, pts, labels) {
    if (!svg) return;
    const W = 520, H = 140, L = 30, R = 8, T = 10, B = 20;
    const max = Math.max.apply(null, pts) * 1.08, min = Math.min.apply(null, pts) * 0.86;
    const x = (i) => L + (W - L - R) * (i / (pts.length - 1));
    const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min || 1));
    let path = '';
    pts.forEach((v, i) => { path += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; });
    const area = path + 'L' + x(pts.length - 1).toFixed(1) + ' ' + (H - B) + ' L' + x(0).toFixed(1) + ' ' + (H - B) + ' Z';
    let grid = '';
    for (let i = 0; i <= 2; i++) {
      const gy = T + (H - T - B) * i / 2, val = Math.round(max - (max - min) * i / 2);
      grid += '<line class="grid-line" x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '"/><text class="axis" x="' + (L - 5) + '" y="' + (gy + 3) + '" text-anchor="end">' + val + '</text>';
    }
    const lab = labels.map((s, i) => '<text class="axis" x="' + (L + (W - L - R) * i / (labels.length - 1)) + '" y="' + (H - 5) + '" text-anchor="' + (i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle') + '">' + s + '</text>').join('');
    const uid = 'g' + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5095FF" stop-opacity=".18"/><stop offset="1" stop-color="#5095FF" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#' + uid + ')"/><path class="series" d="' + path + '"/><circle class="dot-now" cx="' + x(pts.length - 1).toFixed(1) + '" cy="' + y(pts[pts.length - 1]).toFixed(1) + '" r="3"/>' + lab;
  }

  function drawLiveChart() {
    const b = currentBatch(); if (!b) return;
    const s = STRATEGIES[b.config.strategy];
    const pct = b.status === 'running' ? S.pct : 1;
    const n = Math.max(4, Math.round(10 + pct * 14));
    drawSpeed($('#liveChart'), speedPoints(n, s.speed, 1), ['60m', '45m', '30m', '15m', '现在']);
  }

  function drawShards(canvas, total, done, failed, heat) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 380, H = 88;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
    const cols = 120, rows = Math.ceil(total / cols), cw = W / cols, ch = H / rows;
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      let color = '#E9EDF4';
      if (i < done) {
        if (failed && i % 997 === 0 && i < failed * 3) color = '#E06B6B';
        else if (heat) {
          const v = Math.sin(r * 0.55 + c * 0.35) + Math.cos(r * 0.23 - c * 0.61);
          color = v > 0.95 ? '#2E9C6E' : v > 0.15 ? '#45B383' : v > -0.7 ? '#5BC08D' : '#8FD3AE';
        } else color = '#5BC08D';
      }
      ctx.fillStyle = color;
      ctx.fillRect(c * cw + 0.15, r * ch + 0.15, Math.max(0.5, cw - 0.3), Math.max(0.5, ch - 0.3));
    }
  }

  /* ---------- report ---------- */
  function renderReport() {
    const b = currentBatch();
    if (!b || b.status !== 'completed') {
      $('#panelDetail').innerHTML = '<div class="box idle"><div class="big">报告尚未生成</div><div class="sub">跑批完成后自动生成事件报告</div></div>';
      return;
    }
    const cfg = b.config, s = STRATEGIES[cfg.strategy];
    const total = totalMin(cfg), runMin = cfg.runMin;
    const inc = Math.round(cfg.crowd * 0.055), dec = Math.round(cfg.crowd * 0.09), keep = cfg.crowd - inc - dec;
    const version = versionOf(cfg);
    const groupNames = s.groups.filter((g) => cfg.groups.includes(g.id)).map((g) => g.name).join('、');
    const kpis = [
      { l: '决策人数', v: wan(cfg.crowd), s: fmt(cfg.shards) + ' 个分片' },
      { l: '总耗时', v: hhmm(total), s: '含等待启动' },
      { l: '平均速度', v: s.speed + ' 万/h', s: '跑批执行段' },
      { l: '提额', v: wan(inc), s: (inc / cfg.crowd * 100).toFixed(1) + '% 人数', c: 'up' },
      { l: '降额', v: wan(dec), s: (dec / cfg.crowd * 100).toFixed(1) + '% 人数', c: 'down' },
      { l: '失败分片', v: '0', s: '重试均成功' }
    ].map((k) => '<div class="kpi ' + (k.c || '') + '"><i>' + k.l + '</i><b>' + k.v + '</b><small>' + k.s + '</small></div>').join('');
    const segsData = [{ k: '切片搬运', m: 63, c: '#5BC08D' }, { k: '等待启动', m: s.waitMin, c: '#C6D0E2' }, { k: '跑批执行', m: runMin, c: '#5095FF' }];
    const segs = segsData.map((x) => '<i style="width:' + (x.m / total * 100).toFixed(2) + '%;background:' + x.c + '"></i>').join('');
    const tleg = segsData.map((x) => '<span><b style="background:' + x.c + '"></b>' + x.k + ' ' + hhmm(x.m) + '</span>').join('');
    const axis = '<span>' + b.started.slice(11, 16) + '</span><span></span><span></span><span>' + b.ended.slice(11, 16) + '</span>';
    const pI = inc / cfg.crowd * 100, pD = dec / cfg.crowd * 100, pK = keep / cfg.crowd * 100;
    const splitLegend = '<div><b style="background:#E06B6B"></b>提额 <span>' + wan(inc) + '</span><em>' + pI.toFixed(1) + '%</em></div>' +
      '<div><b style="background:#4FAE8A"></b>降额 <span>' + wan(dec) + '</span><em>' + pD.toFixed(1) + '%</em></div>' +
      '<div><b style="background:#C9D2E2"></b>维持 <span>' + wan(keep) + '</span><em>' + pK.toFixed(1) + '%</em></div>';
    const res = s.res.map((r) => '<div class="res-row"><span>' + r.k + '</span><span class="bar"><i style="width:' + r.p + '%"></i></span><span class="num">' + r.v + '</span></div>').join('');
    const anom = s.anomalies.map((a) => '<li class="' + (a.lv === 'bad' ? 'bad' : '') + '"><span class="pin"></span><div><b>' + a.t + '</b> <span>' + a.d + '</span></div></li>').join('');

    $('#panelDetail').innerHTML = '<div class="rep-head"><div><div class="t">事件报告</div>' +
      '<div class="s">' + s.label + ' ' + version + ' · ' + groupNames + ' · 切片日 ' + s.sliceDate + '</div></div>' +
      '<div class="actions"><button class="btn sm" data-mock="导出报告">导出报告</button><button class="btn sm" data-mock="完整事件报告">完整事件报告</button></div></div>' +
      '<div class="kpis">' + kpis + '</div>' +
      '<div class="box tl"><div class="box-head"><div><h3>时间线</h3><p class="sub">切片搬运 → 等待启动 → 跑批执行</p></div><span class="sub">总耗时 ' + hhmm(total) + '</span></div>' +
      '<div class="tl-bar">' + segs + '</div><div class="tl-legend">' + tleg + '</div><div class="tl-axis">' + axis + '</div></div>' +
      '<div class="chart-grid"><div class="box chart-box"><h3>跑批速度</h3><p class="sub">万人/小时 · 均值 ' + s.speed + '</p><svg id="repSpeed" viewBox="0 0 520 140" height="140"></svg></div>' +
      '<div class="box"><h3>分片耗时</h3><p class="sub">每格 = 1 个分片，颜色越深耗时越长</p><canvas class="shard-canvas" id="repShards"></canvas><div class="pctl"><span>P50 <b>16s</b></span><span>P90 <b>19s</b></span><span>P99 <b>33s</b></span><span>最慢 <b>67s</b></span></div></div></div>' +
      '<div class="res-grid"><div class="box"><h3>结果分布</h3><div class="split"><div class="split-bar"><i style="width:' + pI.toFixed(2) + '%;background:#E06B6B"></i><i style="width:' + pD.toFixed(2) + '%;background:#4FAE8A"></i><i style="flex:1;background:#C9D2E2"></i></div><div class="split-legend">' + splitLegend + '</div></div></div>' +
      '<div class="box"><h3>资源与异常</h3>' + res + '<div class="anomaly"><ul>' + anom + '</ul></div></div></div>';
    requestAnimationFrame(function () {
      drawSpeed($('#repSpeed'), speedPoints(26, s.speed, 0.4), [b.started.slice(11, 16), '', '', '', b.ended.slice(11, 16)]);
      drawShards($('#repShards'), cfg.shards, cfg.shards, 0, true);
    });
  }

  /* ---------- push ---------- */
  function pushStepInfo(i) {
    const b = currentBatch(), cfg = b.config;
    const batchNo = b.pushBatch || 'D' + b.id.slice(0, 8).replace(/_/g, '') + '-01';
    return [
      { t: '校验批次', s: b.pushStep >= 1 ? '已完成 · 明细已审批' : '待校验批次与明细', r: '' },
      { t: '创建 LMS 批次', s: b.pushStep >= 2 ? 'LMS 批次 ' + batchNo : '待创建 LMS 批次', r: '' },
      { t: '推送明细', s: wan(cfg.crowd) + ' 条待调额记录', r: '' },
      { t: 'LMS 批量改额', s: '需在 LMS 后台点【发起批量更新】', r: b.pushStep >= 5 ? '已完成' : '待发起' }
    ][i];
  }

  function renderPush() {
    const b = currentBatch();
    if (!b || b.status !== 'completed') {
      $('#panelDetail').innerHTML = '<div class="box idle"><div class="big">跑批完成后才能推送</div><div class="sub">报告生成后可推送 LMS 改额</div></div>';
      return;
    }
    const cfg = b.config, s = STRATEGIES[cfg.strategy];
    const steps = [0, 1, 2, 3].map((i) => {
      const done = (i < 3 && b.pushStep > i) || (i === 3 && b.pushStep >= 5);
      const now = (b.pushStep === i + 1) || (i === 3 && b.pushStep === 4);
      const info = pushStepInfo(i);
      return '<div class="step ' + (done ? 'done' : now ? 'now' : '') + '"><span class="dot">' + (done ? '<svg viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2 2 4-4.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</span><div><b>' + info.t + '</b><span>' + info.s + '</span></div><span class="right">' + info.r + '</span></div>';
    }).join('');
    const disabled = b.pushStep >= 3;
    const btnText = b.pushStep >= 5 ? '已改额 · 完成' : b.pushStep >= 3 ? '已推送 LMS' : '推送至 LMS';
    const recRows = b.pushStep >= 3
      ? '<tr><td>' + (b.pushedAt || nowText()) + '</td><td class="mono">' + (b.pushBatch || 'D20261104-1015') + '</td><td>Hu Tang</td><td class="r">' + fmt(cfg.crowd) + '</td><td><span class="tag ' + (b.pushStep >= 5 ? 'ok' : 'warn') + '">' + (b.pushStep >= 5 ? '已改额' : '待改额') + '</span></td></tr>'
      : '<tr><td colspan="5" style="color:#9AA1B6">暂无推送记录</td></tr>';
    const inc = Math.round(cfg.crowd * 0.055), dec = Math.round(cfg.crowd * 0.09), keep = cfg.crowd - inc - dec;
    const buckets = [
      ['提额', '0 – 5 万', Math.round(inc * 0.66)], ['提额', '5 万以上', Math.round(inc * 0.34)],
      ['降额', '0 – 5 万', Math.round(dec * 0.71)], ['降额', '5 万以上', Math.round(dec * 0.29)]
    ].map((r) => '<tr><td><span class="tag ' + (r[0] === '提额' ? 'bad' : 'ok') + '">' + r[0] + '</span></td><td>' + r[1] + '</td><td class="r">' + fmt(r[2]) + '</td><td class="r">' + (r[2] / cfg.crowd * 100).toFixed(2) + '%</td></tr>').join('');

    const MTX = {
      tiers: ['T1 高价值', 'T2 中价值', 'T3 普通', '无层级'],
      ods: ['可提额OD', '无OD机会'],
      inc: [0.42, 0.05, 0.28, 0.07, 0.12, 0.02, 0.03, 0.01],
      dec: [0.10, 0.15, 0.12, 0.20, 0.15, 0.22, 0.02, 0.04],
      keep: [0.10, 0.16, 0.08, 0.13, 0.06, 0.19, 0.01, 0.27]
    };
    if (!S.mcat) S.mcat = 'inc';
    if (!b.pushSel) b.pushSel = { inc: [true, true, true, true, true, true, true, true], dec: [true, true, true, true, true, true, true, true] };
    const cat = S.mcat;
    const catTotal = cat === 'inc' ? inc : cat === 'dec' ? dec : keep;
    const counts = MTX[cat].map((f) => Math.round(catTotal * f));
    const editable = cat !== 'keep';
    const mrows = MTX.tiers.map((t, ti) => {
      const cells = [0, 1].map((ci) => {
        const i = ti * 2 + ci;
        const n = counts[i];
        const on = editable ? b.pushSel[cat][i] : true;
        return '<td class="' + (editable ? 'pick ' : '') + (on ? '' : 'off') + '" ' + (editable ? 'data-mcell="' + i + '"' : '') + '>' + (editable ? '<span class="mk">' + (on ? '✓' : '') + '</span>' : '') + '<b>' + fmt(n) + '</b></td>';
      }).join('');
      return '<tr><td class="tl">' + t + '</td>' + cells + '<td class="r sum">' + fmt(counts[ti * 2] + counts[ti * 2 + 1]) + '</td></tr>';
    }).join('');
    const colSums = [0, 1].map((ci) => counts[ci] + counts[2 + ci] + counts[4 + ci] + counts[6 + ci]);
    const incCounts = MTX.inc.map((f) => Math.round(inc * f));
    const decCounts = MTX.dec.map((f) => Math.round(dec * f));
    const selInc = incCounts.reduce((a, n, i) => a + (b.pushSel.inc[i] ? n : 0), 0);
    const selDec = decCounts.reduce((a, n, i) => a + (b.pushSel.dec[i] ? n : 0), 0);
    const incAmt = selInc * 4500, decAmt = selDec * 2800, netAmt = incAmt - decAmt;
    const yi = (v) => (v / 1e8).toFixed(2) + ' 亿';
    const matrix = '<div class="box matrix"><div class="box-head"><div><h3>结果加工 · 推送范围</h3><p class="sub">按 history_tier × opportunity_od 选择本次推送人群</p></div>' +
      '<div class="seg small"><button data-mcat="inc" class="' + (cat === 'inc' ? 'on' : '') + '">提额人群</button><button data-mcat="dec" class="' + (cat === 'dec' ? 'on' : '') + '">降额人群</button><button data-mcat="keep" class="' + (cat === 'keep' ? 'on' : '') + '">额度不变人群</button></div></div>' +
      '<table class="mtx"><thead><tr><th>客户层级</th><th>' + MTX.ods[0] + '</th><th>' + MTX.ods[1] + '</th><th class="r">小计</th></tr></thead><tbody>' + mrows +
      '<tr class="mtx-sum"><td class="tl">合计</td><td><b>' + fmt(colSums[0]) + '</b></td><td><b>' + fmt(colSums[1]) + '</b></td><td class="r"><b>' + fmt(catTotal) + '</b></td></tr></tbody></table>' +
      '<div class="mtx-foot"><span>' + (editable ? '已选 <b>' + fmt(selInc) + '</b> 提额 · <b>' + fmt(selDec) + '</b> 降额' : '额度不变人群不参与本次推送') + '</span>' +
      '<span class="mtx-total">本次预计调整最终额度汇总 <b>' + (netAmt >= 0 ? '+' : '−') + yi(Math.abs(netAmt)) + '</b><i>提额 +' + yi(incAmt) + ' · 降额 −' + yi(decAmt) + '</i></span></div></div>';

    $('#panelDetail').innerHTML = matrix + '<div class="push-grid" style="margin-top:14px"><div class="box"><div class="box-head"><div><h3>调额汇总</h3><p class="sub">' + b.id + ' · ' + s.label + ' ' + versionOf(cfg) + ' · ' + hhmm(totalMin(cfg)) + '</p></div></div>' +
      '<div class="big-split"><div class="up"><i>提额</i><b>' + wan(inc) + '</b></div><div class="down"><i>降额</i><b>' + wan(dec) + '</b></div><div><i>维持</i><b>' + wan(keep) + '</b></div></div>' +
      '<table class="list" style="margin-top:8px"><thead><tr><th>方向</th><th>区间</th><th class="r">人数</th><th class="r">占比</th></tr></thead><tbody>' + buckets + '</tbody></table></div>' +
      '<div class="box"><div class="box-head"><div><h3>推送至 LMS</h3><p class="sub">DE 批次 → LMS 批次 → 批量改额</p></div></div><div class="steps">' + steps + '</div>' +
      (b.pushStep === 4 ? '<span class="demo-link" data-complete>演示：模拟 LMS 完成改额</span>' : '') +
      (b.pushStep >= 3
        ? '<button class="btn primary wide" disabled>' + (b.pushStep >= 5 ? '已改额 · 完成' : '已推送 LMS') + '</button>'
        : (S.pushArm
          ? '<div class="arm"><button class="btn warn wide" data-push>确认推送（再次点击）</button><span>推送后名单将写入 LMS 并等待批量改额，不可撤回</span></div>'
          : '<button class="btn primary wide" data-push>推送至 LMS · 已选 ' + fmt(selInc + selDec) + ' 人</button>')) + '</div></div>' +
      '<div class="box" style="margin-top:14px"><div class="box-head"><div><h3>推送记录</h3></div></div><table class="list" style="margin-top:8px"><thead><tr><th>时间</th><th>LMS 批次</th><th>操作人</th><th class="r">明细条数</th><th>状态</th></tr></thead><tbody>' + recRows + '</tbody></table></div>';
  }

  /* ---------- shell ---------- */
  function renderApp() {
    $$('.subnav-item').forEach((el) => el.classList.toggle('on', el.dataset.nav === (S.view === 'create' ? 'create' : 'list')));
    $('#wsHead').innerHTML = '<div class="ws-head">' + renderHead() + '</div>';
    $('#stages').hidden = S.view !== 'detail';
    $$('.panel').forEach((el) => { el.classList.remove('active'); });
    if (S.view === 'list') { renderList(); $('#panelList').classList.add('active'); }
    else if (S.view === 'create') { renderCreate(); $('#panelCreate').classList.add('active'); }
    else {
      $('#panelDetail').classList.add('active');
      renderStages();
      if (S.tab === 'run') renderRun();
      if (S.tab === 'report') renderReport();
      if (S.tab === 'push') renderPush();
    }
    const mr = $('#modalRoot');
    if (mr) mr.innerHTML = S.confirmOpen ? renderConfirm() : '';
  }

  function renderConfirm() {
    const s = cur(), cfg = snap();
    const groups = s.groups.filter((g) => S.groups.includes(g.id));
    const names = groups.map((g) => g.name).join('、');
    const row = (k, v) => '<div class="cf-row"><span>' + k + '</span><b>' + v + '</b></div>';
    return '<div class="modal-mask" data-confirm-mask><div class="confirm">' +
      '<div class="cf-head"><h3>确认发起跑批</h3><p>请核对以下配置，确认后将立即校验切片并开始跑批</p></div>' +
      '<div class="cf-body">' +
        row('业务线', 'MTN_Uganda') +
        row('策略', s.label + ' · ' + s.scene) +
        row('版本', (S.versionType === 'FORMAL' ? 'Official' : 'Test') + ' · ' + S.version) +
        row('批次名称', S.batchName || '—') +
        row('切片日', s.sliceDate + ' ' + s.sliceTime) +
        row('客户分组', names + '（' + groups.length + ' 个）') +
        row('预计规模', wan(cfg.crowd) + ' 人 · ' + fmt(cfg.shards) + ' 分片 · 约 ' + hhmm(cfg.runMin)) +
        row('描述', S.desc || '—') +
      '</div>' +
      '<div class="cf-note">发起后可在执行页随时停止；已写入的分片数据不会回滚。</div>' +
      '<div class="cf-foot"><button class="btn" data-confirm-cancel>取消</button><button class="btn primary" data-confirm-go>确认发起</button></div>' +
    '</div></div>';
  }

  function setView(view) { S.view = view; renderApp(); }
  function openBatch(id) {
    const b = BATCHES.find((x) => x.id === id); if (!b) return;
    S.batchId = id;
    S.tab = b.status === 'completed' ? 'report' : 'run';
    S.view = 'detail';
    renderApp();
  }

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function nextBatchId() {
    const head = S.strategy === 'credit_offline' ? '461' : '462';
    const d = new Date(Date.now() + 3 * 3600 * 1000);
    return head + '_' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds());
  }

  function startRun() {
    if (!S.groups.length) { toast('请选择至少一个客户分组'); return; }
    if (S.running) return;
    if (!S.batchName.trim()) { toast('请填写批次名称'); const el = $('#batchName'); if (el) el.focus(); return; }
    const cfg = snap();
    if (cfg.crowd <= 0) { toast('至少选择一个客户分组'); return; }
    const b = { id: nextBatchId(), name: S.batchName.trim(), desc: S.desc.trim(), status: 'running', started: nowText(), ended: '', config: cfg, pushStep: 0, pushBatch: null, pushedAt: null, pct: 0, retries: 0, failShards: 0 };
    BATCHES.unshift(b);
    S.batchId = b.id; S.view = 'detail'; S.tab = 'run'; S.running = true; S.pct = 0; S.lastShard = -1;
    renderApp();
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(function () {
      S.pct = Math.min(1, S.pct + 0.012 + Math.random() * 0.008);
      updateRunLive();
      if (S.pct >= 1) finishRun();
    }, 220);
    S.batchName = ''; S.desc = '';
    toast('跑批已发起：' + b.name);
  }

  function stopRun() {
    const b = currentBatch();
    if (!b || b.status !== 'running') return;
    S.running = false; clearInterval(S.timer); S.timer = null;
    b.status = 'stopped'; b.pct = S.pct;
    renderApp(); toast('已停止跑批（概念演示）');
  }

  function finishRun() {
    const b = currentBatch();
    S.running = false; clearInterval(S.timer); S.timer = null; S.pct = 1;
    if (!b) return;
    b.status = 'completed'; b.pct = 1;
    const total = totalMin(b.config);
    const end = new Date(), start = new Date(end.getTime() - total * 60000);
    b.started = fmtDT(start); b.ended = fmtDT(end);
    S.tab = 'report';
    renderApp(); toast('跑批完成，事件报告已生成');
  }

  function startPush() {
    const b = currentBatch();
    if (!b || b.status !== 'completed' || b.pushStep >= 3) return;
    b.pushStep = 1; renderApp();
    setTimeout(function () { b.pushStep = 2; renderApp(); }, 700);
    setTimeout(function () { b.pushStep = 3; b.pushedAt = nowText(); b.pushBatch = 'D' + b.id.slice(0, 8).replace(/_/g, '-') + '-01'; renderApp(); toast('已推送 LMS 批次 ' + b.pushBatch); }, 1500);
    setTimeout(function () { b.pushStep = 4; renderApp(); }, 2300);
  }

  function completePush() {
    const b = currentBatch();
    if (!b || b.pushStep < 3) return;
    b.pushStep = 5; renderApp(); toast('LMS 改额完成：' + wan(b.config.crowd) + ' 条已生效');
  }

  /* ---------- events ---------- */
  function bind() {
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (S.confirmOpen) { S.confirmOpen = false; renderApp(); } else if (S.groupOpen) { S.groupOpen = false; renderApp(); } } });
    document.addEventListener('click', function (e) {
      const nav = e.target.closest('[data-nav]');
      if (nav) { if (nav.dataset.nav === 'create') { S.batchName = ''; S.desc = ''; S.view = 'create'; } else { S.view = 'list'; } renderApp(); return; }
      if (e.target.closest('[data-new]')) { S.batchName = ''; S.desc = ''; S.view = 'create'; renderApp(); return; }
      if (e.target.closest('[data-back]')) { S.view = 'list'; renderApp(); return; }
      const row = e.target.closest('[data-open]');
      if (row) { openBatch(row.dataset.open); return; }
      const tab = e.target.closest('[data-tab]');
      if (tab) { S.tab = tab.dataset.tab; renderApp(); return; }
      const launch = e.target.closest('[data-launch]');
      if (launch && !launch.disabled) {
        if (!S.groups.length) { toast('请选择至少一个客户分组'); return; }
        if (!S.batchName.trim()) { toast('请填写批次名称'); const el = $('#batchName'); if (el) el.focus(); return; }
        S.confirmOpen = true; renderApp(); return;
      }
      if (e.target.closest('[data-confirm-cancel]')) { S.confirmOpen = false; renderApp(); return; }
      if (e.target.closest('[data-confirm-go]')) { S.confirmOpen = false; startRun(); return; }
      if (e.target.closest('[data-confirm-mask]') && !e.target.closest('.confirm')) { S.confirmOpen = false; renderApp(); return; }
      const stop = e.target.closest('[data-stop]'); if (stop) { stopRun(); return; }
      const gt = e.target.closest('[data-gtoggle]');
      if (gt) { const id = gt.dataset.gtoggle; if (S.groups.includes(id)) { S.groups = S.groups.filter((x) => x !== id); } else { S.groups.push(id); } renderApp(); return; }
      const grem = e.target.closest('[data-gremove]');
      if (grem) { S.groups = S.groups.filter((x) => x !== grem.dataset.gremove); renderApp(); return; }
      if (e.target.closest('[data-gopen]')) {
        if (!S.groupOpen) {
          const box = document.querySelector('.gsel-box');
          S.groupUp = box ? box.getBoundingClientRect().bottom > window.innerHeight * 0.62 : false;
        }
        S.groupOpen = !S.groupOpen; renderApp(); return;
      }
      if (e.target.closest('[data-gdone]')) { S.groupOpen = false; renderApp(); return; }
      if (e.target.closest('[data-gclear]')) { S.groups = []; renderApp(); return; }
      if (S.groupOpen && !e.target.closest('.gsel')) { S.groupOpen = false; renderApp(); return; }
      const mcat = e.target.closest('[data-mcat]');
      if (mcat) { S.mcat = mcat.dataset.mcat; renderApp(); return; }
      const mcell = e.target.closest('[data-mcell]');
      if (mcell) { const b = currentBatch(); const i = +mcell.dataset.mcell; if (b && b.pushSel && b.pushSel[S.mcat]) { b.pushSel[S.mcat][i] = !b.pushSel[S.mcat][i]; renderApp(); } return; }
      const push = e.target.closest('[data-push]');
      if (push && !push.disabled) {
        const b = currentBatch();
        if (!b || b.pushStep >= 3) return;
        if (!S.pushArm) { S.pushArm = true; renderApp(); setTimeout(function () { if (S.pushArm) { S.pushArm = false; renderApp(); } }, 6000); }
        else { S.pushArm = false; startPush(); }
        return;
      }
      const comp = e.target.closest('[data-complete]'); if (comp) { completePush(); return; }
      const mock = e.target.closest('[data-mock]'); if (mock) { toast('概念版演示：' + mock.dataset.mock + ' 暂未接入'); return; }
      const day = e.target.closest('.cal-col'); if (day) { S.selDay = day.dataset.day; renderApp(); return; }
      const rm = e.target.closest('[data-remove-group]');
      if (rm) { const id = rm.dataset.removeGroup; if (S.groups.length === 1) { toast('至少保留一个客户分组'); return; } S.groups = S.groups.filter((x) => x !== id); renderApp(); return; }
      if (e.target.closest('[data-toggle-cal]')) { S.calOpen = !S.calOpen; renderApp(); return; }
      if (e.target.closest('[data-open-groups]')) { openGroupPicker(); return; }
      if (e.target.closest('[data-close-picker]')) { closePicker(); return; }
      const pick = e.target.closest('[data-pick]');
      if (pick) { const id = pick.dataset.pick; if (S.pickerDraft.includes(id)) S.pickerDraft = S.pickerDraft.filter((x) => x !== id); else S.pickerDraft.push(id); renderPicker(); return; }
      if (e.target.closest('[data-picker-reset]')) { S.pickerDraft = []; renderPicker(); return; }
      const ok = e.target.closest('[data-picker-ok]');
      if (ok && !ok.disabled) { S.groups = S.pickerDraft.slice(); closePicker(); renderApp(); return; }
      const st = e.target.closest('[data-strategy]');
      if (st) { S.strategy = st.dataset.strategy; S.versionType = 'FORMAL'; S.groups = [STRATEGIES[S.strategy].groups[0].id]; S.selDay = STRATEGIES[S.strategy].sliceDate; renderApp(); return; }
      const ver = e.target.closest('[data-version]'); if (ver) { S.versionType = ver.dataset.version; renderApp(); return; }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id === 'strategySel') {
        S.strategy = e.target.value;
        const st = STRATEGIES[S.strategy];
        if (!st.beta) S.versionType = 'FORMAL';
        S.version = (st.versions || [st.official])[0];
        const ids = st.groups.map((g) => g.id);
        S.groups = S.groups.filter((id) => ids.indexOf(id) >= 0);
        if (!S.groups.length) S.groups = [ids[0]];
        S.selDay = st.sliceDate;
        renderApp();
      }
      if (e.target.id === 'versionSel') { S.versionType = e.target.value; renderApp(); }
      if (e.target.id === 'bizSel') { S.business = e.target.value; renderApp(); }
      if (e.target.id === 'verSel') { S.version = e.target.value; renderApp(); }
      if (e.target.id === 'batchName') S.batchName = e.target.value;
      if (e.target.id === 'batchDesc') S.desc = e.target.value;
      if (e.target.id === 'gSearch') { S.gsearch = e.target.value; renderApp(); const i = $('#gSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    });
    $('#hideBtn').addEventListener('click', function () {
      const app = $('#app'); app.classList.toggle('collapsed');
      $('#hideLabel').textContent = app.classList.contains('collapsed') ? 'Show Menu' : 'Hide Menu';
    });
  }

  function clock() {
    const el = $('#clock');
    function tick() {
      const d = new Date(Date.now() + 3 * 3600 * 1000);
      el.textContent = d.getUTCFullYear() + '/' + pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
    }
    tick(); setInterval(tick, 1000);
  }

  function init() {
    const sliceDay = dateISO(addDays(new Date(), -2));
    Object.values(STRATEGIES).forEach((x) => { x.sliceDate = sliceDay; });
    S.todayISO = dateISO(new Date());
    S.selDay = STRATEGIES[S.strategy].sliceDate;
    bind(); renderApp(); clock();
  }

  init();
})();
