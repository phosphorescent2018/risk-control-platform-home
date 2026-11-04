/* 跑批作业处理 · 概念版（mock 数据 + 模拟生命周期） */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const fmt = (n) => Number(n).toLocaleString('en-US');
  const wan = (n) => (n / 10000).toFixed(1) + ' 万';
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const pctText = (p) => (p * 100).toFixed(1) + '%';
  const hhmm = (min) => {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + 'h' + (m ? pad(m) + 'm' : '') : m + 'm';
  };
  const parseISO = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (dt, n) => {
    const x = new Date(dt.getTime());
    x.setDate(x.getDate() + n);
    return x;
  };
  const dateISO = (dt) => dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  const md = (s) => s.slice(5).replace('-', '-');
  const weekName = (dt) => '周' + '日一二三四五六'[dt.getDay()];
  const fmtDT = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const nowText = () => {
    const d = new Date(Date.now() + 3 * 3600 * 1000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
  };

  const DATA = {
    wallet: {
      key: 'wallet', name: '贷前全量跑批', code: 'all_wallet_active_new', scene: 'PRE_LOAN',
      strategy: 'credit_offline v20', product: 'MTN_UG_APP', businessId: 'MTN_Uganda',
      crowd: 38729000, crowdText: '3,872.9 万',
      sliceDate: '2026-10-23', sliceTime: '22:13',
      batch: '459_20261028091106', started: '2026-10-28 09:11:06', ended: '2026-10-29 04:26:20',
      durationText: '19h15m', durationMin: 1155, runMin: 1070,
      shards: 9683, shardSize: 4000, speed: 217,
      inc: 2134000, dec: 3491000, keep: 33104000,
      failShards: 0, retries: 12,
      timeline: [
        { k: '切片搬运', m: 63, c: '#5BC08D' },
        { k: '等待启动', m: 22, c: '#C6D0E2' },
        { k: '跑批执行', m: 1070, c: '#5095FF' },
        { k: '分片修复', m: 0, c: '#F26A1B' }
      ],
      res: [
        { k: 'CPU 峰值', v: '74%', p: 74 },
        { k: '磁盘写 IO', v: '98%', p: 98 },
        { k: '集群写入', v: '+25 GB', p: 82 }
      ],
      anomalies: [
        { lv: 'warn', t: '分片重试 12 次', d: '均在 3 次内成功，无失败分片' },
        { lv: 'warn', t: '切片搬运较上一批晚 38 分钟', d: '06:40 开始，07:43 就绪' },
        { lv: 'bad', t: '磁盘写入峰值 98%', d: '10-28 21:20 前后，持续约 6 分钟' }
      ],
      counts: [44443983, 12287629, 90177900],
      medians: [43900000, 12150000, 89100000],
      days: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      odDays: [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
      history: [
        ['459_20261028091106', '10-23', '3,872.9 万', '已完成', '19h15m', '待推送'],
        ['458_20261016072310', '10-12', '3,864.2 万', '已推送', '18h52m', '已改额'],
        ['457_20261005064520', '10-01', '3,851.7 万', '已推送', '20h06m', '已改额'],
        ['456_20260923091840', '09-19', '3,840.3 万', '已推送', '19h41m', '已改额']
      ]
    },
    loan: {
      key: 'loan', name: '贷中全量跑批', code: 'all_loan_in_new', scene: 'IN_LOAN',
      strategy: 'Dai_Zhong v46', product: 'MTN_UG_APP', businessId: 'MTN_Uganda',
      crowd: 6492000, crowdText: '649.2 万',
      sliceDate: '2026-10-05', sliceTime: '22:13',
      batch: '460_20261027085645', started: '2026-10-27 08:56:45', ended: '2026-10-27 12:18:00',
      durationText: '3h21m', durationMin: 201, runMin: 64,
      shards: 1624, shardSize: 4000, speed: 604,
      inc: 357000, dec: 584000, keep: 5551000,
      failShards: 0, retries: 3,
      timeline: [
        { k: '切片搬运', m: 63, c: '#5BC08D' },
        { k: '等待启动', m: 73, c: '#C6D0E2' },
        { k: '跑批执行', m: 64, c: '#5095FF' },
        { k: '分片修复', m: 0, c: '#F26A1B' }
      ],
      res: [
        { k: 'CPU 峰值', v: '22%', p: 22 },
        { k: '磁盘写 IO', v: '38%', p: 38 },
        { k: '集群写入', v: '+3.2 GB', p: 30 }
      ],
      anomalies: [
        { lv: 'warn', t: '等待启动 1h13m', d: '切片 07:43 就绪，08:56 才启动' },
        { lv: 'warn', t: '分片重试 3 次', d: '均为瞬时超时，重试成功' }
      ],
      counts: [44120000, 11880000, 88900000],
      medians: [43900000, 12150000, 89100000],
      days: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      odDays: [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      history: [
        ['460_20261027085645', '10-05', '649.2 万', '已完成', '3h21m', '待推送'],
        ['455_20261018082130', '09-26', '646.8 万', '已推送', '3h06m', '已改额'],
        ['454_20261011090310', '09-19', '651.3 万', '已推送', '3h12m', '已改额']
      ]
    }
  };

  const S = {
    task: 'wallet', stage: 'prepare', selDay: null,
    running: false, batch: null, auto: false, timer: null, pushTimer: null, pct: 0
  };

  function T() { return DATA[S.task]; }

  function makeBatch(task, status) {
    return {
      id: task.batch, status: status || 'completed',
      started: task.started, ended: task.ended,
      durationText: task.durationText, pushStep: 1, pushBatch: null, pushedAt: null
    };
  }

  function resetForTask(key) {
    S.task = key;
    S.stage = 'prepare';
    S.selDay = T().sliceDate;
    S.running = false;
    S.pct = 0;
    S.auto = false;
    if (S.timer) { clearInterval(S.timer); S.timer = null; }
    if (S.pushTimer) { clearTimeout(S.pushTimer); S.pushTimer = null; }
    S.batch = makeBatch(T());
    renderAll();
  }

  /* ---------- header / stages ---------- */
  function badgeInfo() {
    const b = S.batch;
    if (S.running) return { t: '执行中', c: 'running' };
    if (b.pushStep >= 5) return { t: '已生效', c: '' };
    if (b.pushStep >= 3) return { t: '已推送 · 待改额', c: 'waiting' };
    if (b.status === 'completed') return { t: '待推送', c: 'waiting' };
    if (b.status === 'stopped') return { t: '已停止', c: '' };
    return { t: '已完成', c: '' };
  }

  function renderHeader() {
    const t = T();
    $('#taskName').textContent = t.name;
    $('#taskCode').textContent = t.code;
    $('#taskStrategy').textContent = '策略 ' + t.strategy;
    $('#taskProduct').textContent = '产品 ' + t.product;
    $('#taskCrowd').textContent = '人群 ' + t.crowdText;
    $('#sliceDate').textContent = t.sliceDate;
    $('#sliceTime').textContent = t.sliceTime;
    const b = badgeInfo();
    const badge = $('#runBadge');
    badge.textContent = b.t;
    badge.className = 'badge ' + b.c;
    const btn = $('#launchBtn');
    if (S.running) {
      btn.textContent = '停止跑批';
      btn.className = 'btn danger';
      btn.disabled = false;
    } else {
      btn.textContent = '发起跑批';
      btn.className = 'btn primary';
      btn.disabled = false;
    }
    $$('.task-menu button').forEach((el) => el.classList.toggle('on', el.dataset.key === S.task));
  }

  function renderStages() {
    const t = T();
    const b = S.batch;
    $('#stPrepare').textContent = '切片源健康 · 就绪';
    $('#stRun').textContent = S.running ? pctText(S.pct) + ' · 剩余 ' + hhmm((1 - S.pct) * t.durationMin) : '无运行中批次';
    $('#stReport').textContent = b.status === 'completed' ? b.id.slice(0, 3) + ' 批 · 已出报告' : '待生成';
    $('#stPush').textContent = b.pushStep >= 5 ? '已改额 · 完成' : b.pushStep >= 3 ? '已推送 · 待改额' : '待推送 LMS';

    const flags = { prepare: 'done', run: S.running ? 'live' : '', report: b.status === 'completed' ? 'done' : '', push: b.pushStep >= 5 ? 'done' : b.pushStep >= 3 ? 'warn' : '' };
    $('#flagPrepare').className = 'st-flag ' + flags.prepare;
    $('#flagRun').className = 'st-flag ' + flags.run;
    $('#flagReport').className = 'st-flag ' + flags.report;
    $('#flagPush').className = 'st-flag ' + flags.push;
    $$('.stage').forEach((el) => el.classList.toggle('active', el.dataset.stage === S.stage));
  }

  /* ---------- prepare ---------- */
  function dayStatus(t, dayISO) {
    const start = parseISO(t.sliceDate);
    const idx = Math.round((parseISO(dayISO) - start) / 86400000) + 13;
    if (idx < 0 || idx > 13) return null;
    return { wallet: t.days[idx], od: t.odDays[idx], pool: 0 };
  }

  function escStatus(v) { return v === 2 ? 'bad' : v === 1 ? 'warn' : 'ok'; }

  function renderCalendar() {
    const t = T();
    const start = addDays(parseISO(t.sliceDate), -13);
    let cols = '';
    for (let i = 0; i < 14; i++) {
      const dt = addDays(start, i);
      const iso = dateISO(dt);
      const st = dayStatus(t, iso);
      const bars = [st.wallet, st.od, st.pool].map((v) => '<i class="' + escStatus(v) + '"></i>').join('');
      cols += '<div class="cal-col ' + (iso === S.selDay ? 'sel' : '') + '" data-day="' + iso + '">' +
        '<div class="cal-d">' + iso.slice(8) + '</div><div class="cal-w">' + weekName(dt) + '</div>' +
        '<div class="cal-bars">' + bars + '</div></div>';
    }
    return cols;
  }

  function renderCalDetail() {
    const t = T();
    const day = S.selDay || t.sliceDate;
    const st = dayStatus(t, day);
    const names = ['钱包变量表', 'OD 变量表', '圈选池'];
    const keys = ['wallet', 'od', 'pool'];
    const rows = names.map((nm, i) => {
      const v = keys[i] === 'wallet' ? st.wallet : keys[i] === 'od' ? st.od : st.pool;
      const base = t.medians[i];
      if (v === 2) return '<div class="cd-row"><span class="nm">' + nm + '</span><span class="num">0</span><span class="dl">—</span><span class="tag bad">缺数</span></div>';
      const count = Math.round(base * (0.985 + ((i + day.charCodeAt(9)) % 5) * 0.006));
      const delta = ((count - base) / base * 100);
      const dl = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
      const tag = v === 1 ? '<span class="tag warn">偏低</span>' : '<span class="tag ok">就绪</span>';
      return '<div class="cd-row"><span class="nm">' + nm + '</span><span class="num">' + fmt(count) + '</span><span class="dl">' + dl + '</span>' + tag + '</div>';
    }).join('');
    const ok = [st.wallet, st.od, st.pool].filter((v) => v === 0).length;
    return '<div class="cd-head"><b>' + day + '</b><span>' + ok + '/3 源就绪</span><span>·</span><span>59 项检查 ' + (ok === 3 ? '59/59 通过' : (56 + ok) + '/59 通过') + '</span></div>' + rows;
  }

  function renderPrepare() {
    const t = T();
    const running = S.running;
    const check = (ok, title, sub) =>
      '<li class="' + (ok ? '' : 'miss') + '">' +
      (ok
        ? '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#E9F7F0"/><path d="M5 8.2l2 2 4-4.2" stroke="#1F9D6B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#FDECEC"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#D64545" stroke-width="1.4" stroke-linecap="round"/></svg>') +
      '<span>' + title + ' <small>' + sub + '</small></span></li>';

    const checks = [
      check(true, '切片已同步', t.sliceDate + ' ' + t.sliceTime + ' · 7/7 表'),
      check(!running, running ? '当前有运行中批次' : '当前无运行中批次', running ? '需先停止当前批次' : '可发起'),
      check(true, '任务已启用', '策略 ' + t.strategy),
      check(true, '发布目标已配置', 'LMS 改额 / Digiops 短信')
    ].join('');

    const cfg = [
      ['BusinessID', t.businessId],
      ['任务类型', '离线策略批次 · ' + t.scene],
      ['触发方式', '手动发起 / 定时 02:00'],
      ['发布目标', 'LMS（额度）· Digiops（短信）']
    ].map(([k, v]) => '<div><i>' + k + '</i><b>' + esc(v) + '</b></div>').join('');

    const history = t.history.map((r) => {
      const cls = r[5] === '待推送' ? 'warn' : r[3] === '已完成' ? 'warn' : 'ok';
      return '<tr><td class="mono">' + r[0] + '</td><td>' + r[1] + '</td><td class="r">' + r[2] + '</td><td>' + r[3] + '</td><td class="r">' + r[4] + '</td><td><span class="tag ' + cls + '">' + r[5] + '</span></td></tr>';
    }).join('');

    $('#panelPrepare').innerHTML =
      '<div class="prep-grid">' +
        '<section class="box">' +
          '<div class="box-head"><div><h3>切片源健康日历</h3><p class="sub">' + md(dateISO(addDays(parseISO(t.sliceDate), -13))) + ' → ' + md(t.sliceDate) + ' · 点击日期查看源表明细</p></div>' +
            '<div class="legend"><span><b style="background:#5BC08D"></b>就绪</span><span><b style="background:#E7B04A"></b>偏低</span><span><b style="background:#E06B6B"></b>缺数</span></div></div>' +
          '<div class="cal">' + renderCalendar() + '</div>' +
          '<div class="cal-detail">' + renderCalDetail() + '</div>' +
        '</section>' +
        '<section class="box launch">' +
          '<h3>发起跑批</h3>' +
          '<p class="slice-line">切片日 <b>' + t.sliceDate + '</b> · 离线库单版本</p>' +
          '<ul class="checks">' + checks + '</ul>' +
          '<div class="est">' +
            '<div><i>预计人数</i><b>' + t.crowdText + '</b></div>' +
            '<div><i>分片</i><b>' + fmt(t.shards) + ' × ' + fmt(t.shardSize) + '</b></div>' +
            '<div><i>预计耗时</i><b>约 ' + t.durationText + '</b></div>' +
          '</div>' +
          '<button class="btn primary wide" data-launch ' + (running ? 'disabled' : '') + '>发起跑批</button>' +
          '<div class="hint">按切片日全量重算，不支持增量</div>' +
        '</section>' +
      '</div>' +
      '<div class="box" style="margin-top:14px">' +
        '<div class="box-head"><div><h3>作业配置</h3></div><button class="btn sm ghost" data-mock="完整任务配置">查看完整配置</button></div>' +
        '<div class="cfg">' + cfg + '</div>' +
      '</div>' +
      '<div class="box" style="margin-top:14px">' +
        '<div class="box-head"><div><h3>最近批次</h3><p class="sub">同一任务的历史执行 · 报告与推送状态</p></div></div>' +
        '<table class="list" style="margin-top:8px"><thead><tr><th>批次</th><th>切片日</th><th class="r">人数</th><th>状态</th><th class="r">耗时</th><th>推送</th></tr></thead><tbody>' + history + '</tbody></table>' +
      '</div>';
  }

  /* ---------- run ---------- */
  function ringSVG(pct) {
    const r = 52, c = 2 * Math.PI * r;
    return '<svg width="124" height="124" viewBox="0 0 124 124">' +
      '<circle cx="62" cy="62" r="52" fill="none" stroke="#EEF1F6" stroke-width="10"/>' +
      '<circle id="ringFg" cx="62" cy="62" r="52" fill="none" stroke="#5095FF" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '"/>' +
      '</svg>';
  }

  function renderRun() {
    const t = T();
    if (!S.running) {
      const b = S.batch;
      $('#panelRun').innerHTML =
        '<div class="box idle"><div class="big">当前无运行中批次</div><div class="sub">发起后在这里看整体进度、分片完成度、实时速度与异常</div>' +
        '<button class="btn primary" data-goto="prepare">去准备发起</button></div>' +
        '<div class="box" style="margin-top:14px"><div class="box-head"><div><h3>上次执行</h3><p class="sub">' + b.id + ' · ' + t.started + ' → ' + t.ended + '</p></div></div>' +
        '<div class="run-stats" style="margin-top:10px">' +
          '<div><i>决策人数</i><b>' + t.crowdText + '</b></div>' +
          '<div><i>分片</i><b>' + fmt(t.shards) + '</b></div>' +
          '<div><i>失败分片</i><b>' + t.failShards + '</b></div>' +
          '<div><i>总耗时</i><b>' + t.durationText + '</b></div>' +
          '<div><i>平均速度</i><b>' + t.speed + ' 万/h</b></div>' +
          '<div><i>重试</i><b>' + t.retries + ' 次</b></div>' +
        '</div></div>';
      return;
    }
    $('#panelRun').innerHTML =
      '<div class="box run-top">' +
        '<div class="ring">' + ringSVG(S.pct) + '<div class="val"><b id="rPct">' + pctText(S.pct) + '</b><i>已完成</i></div></div>' +
        '<div class="run-stats">' +
          '<div><i>已处理</i><b id="rProcessed">' + fmt(Math.round(t.crowd * S.pct)) + '</b></div>' +
          '<div><i>完成分片</i><b id="rShards">' + fmt(Math.round(t.shards * S.pct)) + ' / ' + fmt(t.shards) + '</b></div>' +
          '<div><i>实时速度</i><b id="rSpeed">' + Math.round(t.speed * (0.94 + Math.random() * 0.12)) + ' 万/h</b></div>' +
          '<div><i>剩余时间</i><b id="rEta">' + hhmm((1 - S.pct) * t.durationMin) + '</b></div>' +
          '<div><i>失败分片</i><b id="rFail" style="color:#1F9D6B">0</b></div>' +
          '<div><i>已运行</i><b id="rElapsed">' + hhmm(S.pct * t.durationMin) + '</b></div>' +
        '</div>' +
        '<div class="run-side"><span class="muted">' + (S.batch && S.batch.id) + '</span></div>' +
      '</div>' +
      '<div class="chart-grid">' +
        '<div class="box chart-box"><h3>实时速度</h3><p class="sub">近 60 分钟 · 万人/小时</p><svg id="liveChart" viewBox="0 0 520 140" height="140"></svg></div>' +
        '<div class="box"><h3>分片进度</h3><p class="sub">每格 = 1 个分片</p><canvas class="shard-canvas" id="liveShards"></canvas>' +
          '<div class="pctl"><span>完成 <b id="pDone">' + fmt(Math.round(t.shards * S.pct)) + '</b></span><span>失败 <b>0</b></span><span>待处理 <b id="pWait">' + fmt(t.shards - Math.round(t.shards * S.pct)) + '</b></span></div></div>' +
      '</div>' +
      '<div class="box anomaly" style="margin-top:14px"><div class="box-head"><div><h3>异常与重试</h3></div></div><ul><li><span class="pin"></span><div><b>暂无明显异常</b> <span>分片按 4,000 人/片稳定推进</span></div></li></ul></div>';
    drawLiveChart();
    drawShards($('#liveShards'), t.shards, Math.round(t.shards * S.pct), 0, false);
  }

  function updateRunLive() {
    const t = T();
    const p = S.pct;
    const pctEl = $('#rPct'); if (!pctEl) return;
    pctEl.textContent = pctText(p);
    const c = 2 * Math.PI * 52;
    const ring = $('#ringFg'); if (ring) ring.setAttribute('stroke-dashoffset', String(c * (1 - p)));
    $('#rProcessed').textContent = fmt(Math.round(t.crowd * p));
    $('#rShards').textContent = fmt(Math.round(t.shards * p)) + ' / ' + fmt(t.shards);
    $('#rSpeed').textContent = Math.round(t.speed * (0.92 + Math.random() * 0.16)) + ' 万/h';
    $('#rEta').textContent = hhmm((1 - p) * t.durationMin);
    $('#rElapsed').textContent = hhmm(p * t.durationMin);
    $('#pDone').textContent = fmt(Math.round(t.shards * p));
    $('#pWait').textContent = fmt(t.shards - Math.round(t.shards * p));
    $('#stRun').textContent = pctText(p) + ' · 剩余 ' + hhmm((1 - p) * t.durationMin);
    drawLiveChart();
    if (Math.random() < 0.25) drawShards($('#liveShards'), t.shards, Math.round(t.shards * p), 0, false);
  }

  /* ---------- report ---------- */
  function speedPoints(n, base, phase) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      const v = base * (0.9 + 0.1 * Math.sin(i * 0.9 + phase) + 0.05 * Math.cos(i * 1.7));
      pts.push(v);
    }
    return pts;
  }

  function drawSpeed(svg, pts, labels) {
    if (!svg) return;
    const W = 520, H = 140, L = 30, R = 8, T = 10, B = 20;
    const max = Math.max.apply(null, pts) * 1.08, min = Math.min.apply(null, pts) * 0.86;
    const x = (i) => L + (W - L - R) * (i / (pts.length - 1));
    const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min || 1));
    let path = '', area = '';
    pts.forEach((v, i) => { path += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; });
    area = path + 'L' + x(pts.length - 1).toFixed(1) + ' ' + (H - B) + ' L' + x(0).toFixed(1) + ' ' + (H - B) + ' Z';
    let grid = '';
    for (let i = 0; i <= 2; i++) {
      const gy = T + (H - T - B) * i / 2;
      const val = Math.round(max - (max - min) * i / 2);
      grid += '<line class="grid-line" x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '"/>' +
        '<text class="axis" x="' + (L - 5) + '" y="' + (gy + 3) + '" text-anchor="end">' + val + '</text>';
    }
    const lab = labels.map((s, i) => '<text class="axis" x="' + (L + (W - L - R) * i / (labels.length - 1)) + '" y="' + (H - 5) + '" text-anchor="' + (i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle') + '">' + s + '</text>').join('');
    const uid = 'g' + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5095FF" stop-opacity=".18"/><stop offset="1" stop-color="#5095FF" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#' + uid + ')"/>' +
      '<path class="series" d="' + path + '"/>' +
      '<circle class="dot-now" cx="' + x(pts.length - 1).toFixed(1) + '" cy="' + y(pts[pts.length - 1]).toFixed(1) + '" r="3"/>' + lab;
  }

  function drawLiveChart() {
    const t = T();
    const n = Math.max(4, Math.round(10 + S.pct * 14));
    const pts = speedPoints(n, t.speed, 1);
    const labels = ['60m', '45m', '30m', '15m', '现在'];
    drawSpeed($('#liveChart'), pts, labels);
  }

  function drawShards(canvas, total, done, failed, heat) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 380, H = 88;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const cols = 120, rows = Math.ceil(total / cols);
    const cw = W / cols, ch = H / rows;
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

  function renderReport() {
    const t = T(), b = S.batch;
    if (b.status !== 'completed') {
      $('#panelReport').innerHTML = '<div class="box idle"><div class="big">报告尚未生成</div><div class="sub">跑批完成后自动生成事件报告</div><button class="btn primary" data-goto="prepare">去准备发起</button></div>';
      return;
    }
    const kpis = [
      { l: '决策人数', v: t.crowdText, s: fmt(t.shards) + ' 个分片' },
      { l: '总耗时', v: t.durationText, s: '含等待启动' },
      { l: '平均速度', v: t.speed + ' 万/h', s: '跑批执行段' },
      { l: '提额', v: wan(t.inc), s: (t.inc / t.crowd * 100).toFixed(1) + '% 人数', c: 'up' },
      { l: '降额', v: wan(t.dec), s: (t.dec / t.crowd * 100).toFixed(1) + '% 人数', c: 'down' },
      { l: '失败分片', v: String(t.failShards), s: t.retries + ' 次重试' }
    ].map((k) => '<div class="kpi ' + (k.c || '') + '"><i>' + k.l + '</i><b>' + k.v + '</b><small>' + k.s + '</small></div>').join('');

    const totalMin = t.timeline.reduce((a, x) => a + x.m, 0);
    const segs = t.timeline.filter((x) => x.m > 0).map((x) => '<i style="width:' + (x.m / totalMin * 100).toFixed(2) + '%;background:' + x.c + '"></i>').join('');
    const tleg = t.timeline.filter((x) => x.m > 0).map((x) => '<span><b style="background:' + x.c + '"></b>' + x.k + ' ' + hhmm(x.m) + '</span>').join('');
    const axis = [b.started.slice(11, 16), '', '', b.ended.slice(11, 16)].map((s, i) => '<span>' + (s || '') + '</span>').join('');

    const pctI = (t.inc / t.crowd * 100), pctD = (t.dec / t.crowd * 100), pctK = (t.keep / t.crowd * 100);
    const splitLegend =
      '<div><b style="background:#E06B6B"></b>提额 <span>' + wan(t.inc) + '</span><em>' + pctI.toFixed(1) + '%</em></div>' +
      '<div><b style="background:#4FAE8A"></b>降额 <span>' + wan(t.dec) + '</span><em>' + pctD.toFixed(1) + '%</em></div>' +
      '<div><b style="background:#C9D2E2"></b>维持 <span>' + wan(t.keep) + '</span><em>' + pctK.toFixed(1) + '%</em></div>';

    const res = t.res.map((r) => '<div class="res-row"><span>' + r.k + '</span><span class="bar"><i style="width:' + r.p + '%"></i></span><span class="num">' + r.v + '</span></div>').join('');
    const anom = t.anomalies.map((a) => '<li class="' + (a.lv === 'bad' ? 'bad' : '') + '"><span class="pin"></span><div><b>' + a.t + '</b> <span>' + a.d + '</span></div></li>').join('');

    $('#panelReport').innerHTML =
      '<div class="rep-head"><div><div class="t">' + b.id + '</div>' +
        '<div class="s">' + t.name + ' · ' + b.started + ' → ' + b.ended + ' · 已完成 · 切片日 ' + t.sliceDate + '</div></div>' +
        '<div class="actions"><button class="btn sm" data-mock="导出报告">导出报告</button><button class="btn sm" data-mock="完整事件报告">完整事件报告</button></div></div>' +
      '<div class="kpis">' + kpis + '</div>' +
      '<div class="box tl"><div class="box-head"><div><h3>时间线</h3><p class="sub">切片搬运 → 等待启动 → 跑批执行</p></div><span class="sub">总耗时 ' + t.durationText + '</span></div>' +
        '<div class="tl-bar">' + segs + '</div><div class="tl-legend">' + tleg + '</div>' +
        '<div class="tl-axis">' + axis + '</div></div>' +
      '<div class="chart-grid">' +
        '<div class="box chart-box"><h3>跑批速度</h3><p class="sub">万人/小时 · 均值 ' + t.speed + '</p><svg id="repSpeed" viewBox="0 0 520 140" height="140"></svg></div>' +
        '<div class="box"><h3>分片耗时</h3><p class="sub">每格 = 1 个分片，颜色越深耗时越长</p><canvas class="shard-canvas" id="repShards"></canvas>' +
          '<div class="pctl"><span>P50 <b>16s</b></span><span>P90 <b>19s</b></span><span>P99 <b>33s</b></span><span>最慢 <b>67s</b></span></div></div>' +
      '</div>' +
      '<div class="res-grid">' +
        '<div class="box"><h3>结果分布</h3><div class="split"><div class="split-bar"><i style="width:' + pctI.toFixed(2) + '%;background:#E06B6B"></i><i style="width:' + pctD.toFixed(2) + '%;background:#4FAE8A"></i><i style="flex:1;background:#C9D2E2"></i></div><div class="split-legend">' + splitLegend + '</div></div></div>' +
        '<div class="box"><h3>资源与异常</h3>' + res + '<div class="anomaly"><ul>' + anom + '</ul></div></div>' +
      '</div>';
    requestAnimationFrame(function () {
      drawSpeed($('#repSpeed'), speedPoints(26, t.speed, 0.4), [b.started.slice(11, 16), '', '', '', b.ended.slice(11, 16)]);
      drawShards($('#repShards'), t.shards, t.shards, 0, true);
    });
  }

  /* ---------- push ---------- */
  function pushStepInfo(i) {
    const b = S.batch, t = T();
    const batchNo = b.pushBatch || 'D' + t.batch.slice(0, 8).replace(/_/g, '');
    return [
      { t: '校验批次', s: S.batch.pushStep >= 1 ? '已完成 · 明细已审批' : '待校验批次与明细', r: '' },
      { t: '创建 LMS 批次', s: S.batch.pushStep >= 2 ? 'LMS 批次 ' + batchNo : '待创建 LMS 批次', r: '' },
      { t: '推送明细', s: '5,625,000 条待调额记录', r: '' },
      { t: 'LMS 批量改额', s: S.auto ? '自动改额' : '需在 LMS 后台点【发起批量更新】', r: S.batch.pushStep >= 5 ? '已完成' : '待发起' }
    ][i];
  }

  function renderPush() {
    const t = T(), b = S.batch;
    if (b.status !== 'completed') {
      $('#panelPush').innerHTML = '<div class="box idle"><div class="big">跑批完成后才能推送</div><div class="sub">报告生成后可一键推送 LMS 改额</div><button class="btn primary" data-goto="prepare">去准备发起</button></div>';
      return;
    }
    const steps = [0, 1, 2, 3].map((i) => {
      const done = (i < 3 && b.pushStep > i) || (i === 3 && b.pushStep >= 5);
      const now = (b.pushStep === i + 1) || (i === 3 && b.pushStep === 4);
      const info = pushStepInfo(i);
      return '<div class="step ' + (done ? 'done' : now ? 'now' : '') + '"><span class="dot">' + (done ? '<svg viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2 2 4-4.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</span>' +
        '<div><b>' + info.t + '</b><span>' + info.s + '</span></div><span class="right">' + info.r + '</span></div>';
    }).join('');

    const disabled = b.pushStep >= 3;
    const btnText = b.pushStep >= 5 ? '已改额 · 完成' : b.pushStep >= 3 ? '已推送 LMS' : '推送至 LMS';
    const recRows = b.pushStep >= 3
      ? '<tr><td>' + (b.pushedAt || nowText()) + '</td><td class="mono">' + (b.pushBatch || 'D20261104-1015') + '</td><td>Hu Tang</td><td class="r">5,625,000</td><td><span class="tag ' + (b.pushStep >= 5 ? 'ok' : 'warn') + '">' + (b.pushStep >= 5 ? '已改额' : '待改额') + '</span></td></tr>'
      : '<tr><td colspan="5" style="color:#9AA1B6">暂无推送记录</td></tr>';

    const buckets = [
      ['提额', '0 – 5 万', Math.round(t.inc * 0.66), '#E06B6B'],
      ['提额', '5 万以上', Math.round(t.inc * 0.34), '#E06B6B'],
      ['降额', '0 – 5 万', Math.round(t.dec * 0.71), '#4FAE8A'],
      ['降额', '5 万以上', Math.round(t.dec * 0.29), '#4FAE8A']
    ].map((r) => '<tr><td><span class="tag ' + (r[0] === '提额' ? 'bad' : 'ok') + '">' + r[0] + '</span></td><td>' + r[1] + '</td><td class="r">' + fmt(r[2]) + '</td><td class="r">' + (r[2] / t.crowd * 100).toFixed(2) + '%</td></tr>').join('');

    $('#panelPush').innerHTML =
      '<div class="push-grid">' +
        '<div class="box"><div class="box-head"><div><h3>调额汇总</h3><p class="sub">' + b.id + ' · 已完成 · ' + t.durationText + '</p></div></div>' +
          '<div class="big-split"><div class="up"><i>提额</i><b>' + wan(t.inc) + '</b></div><div class="down"><i>降额</i><b>' + wan(t.dec) + '</b></div><div><i>维持</i><b>' + wan(t.keep) + '</b></div></div>' +
          '<table class="list" style="margin-top:8px"><thead><tr><th>方向</th><th>区间</th><th class="r">人数</th><th class="r">占比</th></tr></thead><tbody>' + buckets + '</tbody></table>' +
        '</div>' +
        '<div class="box"><div class="box-head"><div><h3>推送至 LMS</h3><p class="sub">DE 批次 → LMS 批次 → 批量改额</p></div></div>' +
          '<div class="steps">' + steps + '</div>' +
          (b.pushStep === 4 && !S.auto ? '<span class="demo-link" data-complete>演示：模拟 LMS 完成改额</span>' : '') +
          '<div class="switch-row"><div>允许 LMS 自动改额<small>关闭时需在 LMS 后台点【发起批量更新】</small></div><span class="switch ' + (S.auto ? 'on' : '') + '" data-auto></span></div>' +
          '<button class="btn primary wide" data-push ' + (disabled ? 'disabled' : '') + '>' + btnText + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="box" style="margin-top:14px"><div class="box-head"><div><h3>推送记录</h3></div></div>' +
        '<table class="list" style="margin-top:8px"><thead><tr><th>时间</th><th>LMS 批次</th><th>操作人</th><th class="r">明细条数</th><th>状态</th></tr></thead><tbody>' + recRows + '</tbody></table></div>';
  }

  /* ---------- lifecycle ---------- */
  function renderAll() {
    renderHeader();
    renderStages();
    if (S.stage === 'prepare') renderPrepare();
    if (S.stage === 'run') renderRun();
    if (S.stage === 'report') renderReport();
    if (S.stage === 'push') renderPush();
  }

  function setStage(stage) {
    S.stage = stage;
    $$('.stage').forEach((el) => el.classList.toggle('active', el.dataset.stage === stage));
    $$('.panel').forEach((el) => el.classList.toggle('active', el.dataset.panel === stage));
    renderAll();
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function nextBatchId(t) {
    const head = t.key === 'wallet' ? '461' : '462';
    const d = new Date(Date.now() + 3 * 3600 * 1000);
    return head + '_' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds());
  }

  function startRun() {
    if (S.running) return;
    const t = T();
    S.running = true;
    S.pct = 0;
    S.batch = { id: nextBatchId(t), status: 'running', started: nowText(), ended: '', durationText: t.durationText, pushStep: 0, pushBatch: null, pushedAt: null };
    setStage('run');
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(function () {
      S.pct = Math.min(1, S.pct + 0.012 + Math.random() * 0.008);
      updateRunLive();
      if (S.pct >= 1) finishRun();
    }, 220);
    toast('跑批已发起：' + S.batch.id);
  }

  function stopRun() {
    if (!S.running) return;
    S.running = false;
    clearInterval(S.timer); S.timer = null;
    S.batch.status = 'stopped';
    setStage('prepare');
    toast('已停止跑批（概念演示）');
  }

  function finishRun() {
    S.running = false;
    clearInterval(S.timer); S.timer = null;
    S.pct = 1;
    S.batch.status = 'completed';
    const end = new Date();
    const start = new Date(end.getTime() - T().durationMin * 60000);
    S.batch.started = fmtDT(start);
    S.batch.ended = fmtDT(end);
    setStage('report');
    toast('跑批完成，事件报告已生成');
  }

  function startPush() {
    const b = S.batch;
    if (!b || b.status !== 'completed' || b.pushStep >= 3) return;
    b.pushStep = 1;
    renderAll();
    setTimeout(function () { b.pushStep = 2; renderAll(); }, 700);
    setTimeout(function () { b.pushStep = 3; b.pushedAt = nowText(); b.pushBatch = 'D' + b.id.slice(0, 8).replace(/_/g, '') + '-01'; renderAll(); toast('已推送 LMS 批次 ' + b.pushBatch); }, 1500);
    setTimeout(function () { b.pushStep = 4; renderAll(); if (S.auto) { setTimeout(completePush, 1200); } }, 2300);
  }

  function completePush() {
    const b = S.batch;
    if (!b || b.pushStep < 3) return;
    b.pushStep = 5;
    renderAll();
    toast('LMS 改额完成：5,625,000 条已生效');
  }

  /* ---------- events ---------- */
  function bind() {
    $('#stages').addEventListener('click', function (e) {
      const el = e.target.closest('.stage');
      if (el) setStage(el.dataset.stage);
    });
    $('#launchBtn').addEventListener('click', function () { S.running ? stopRun() : startRun(); });
    document.addEventListener('click', function (e) {
      const launch = e.target.closest('[data-launch]');
      if (launch && !launch.disabled) startRun();
      const stop = e.target.closest('[data-stop]');
      if (stop) stopRun();
      const go = e.target.closest('[data-goto]');
      if (go) setStage(go.dataset.goto);
      const push = e.target.closest('[data-push]');
      if (push && !push.disabled) startPush();
      const auto = e.target.closest('[data-auto]');
      if (auto) {
        S.auto = !S.auto;
        if (S.auto && S.batch.pushStep === 4) setTimeout(completePush, 1200);
        renderPush();
      }
      const comp = e.target.closest('[data-complete]');
      if (comp) completePush();
      const mock = e.target.closest('[data-mock]');
      if (mock) toast('概念版演示：' + mock.dataset.mock + ' 暂未接入');
      const day = e.target.closest('.cal-col');
      if (day) { S.selDay = day.dataset.day; renderPrepare(); }
      const taskOpt = e.target.closest('.task-menu button');
      if (taskOpt) { $('#taskMenu').hidden = true; resetForTask(taskOpt.dataset.key); }
    });
    $('#taskBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      $('#taskMenu').hidden = !$('#taskMenu').hidden;
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#taskMenu') && !e.target.closest('#taskBtn')) $('#taskMenu').hidden = true;
    });
    $('#hideBtn').addEventListener('click', function () {
      const app = $('#app');
      app.classList.toggle('collapsed');
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
    S.selDay = T().sliceDate;
    S.batch = makeBatch(T());
    bind();
    renderAll();
    clock();
  }

  init();
})();
