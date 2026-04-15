// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// FXTE OS â SHARED CORE  (auth Â· api Â· router Â· ui)
// PipSend REST + WebSocket integration
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// ââ CONFIG (editable via Setup dialog) ââââââââââââââââââââ
const FXTE_DEFAULTS = {
  PIPSEND_REAL:  'https://api.pipsend.com',         // Real PipSend server
  PROXY_BASE:    '/api/pipsend',                     // Vercel serverless proxy (solves CORS)
  API_VERSION:   '/api/v1',
  TRADING_GROUP: 'Standard',                         // Exact group name in PipSend
  DEFAULT_LOGIN: '1201',                              // Default account
};

const FXTE_CONFIG = {
  // Use the Vercel proxy as API_BASE â it forwards to api.pipsend.com
  get API_BASE() {
    const stored = localStorage.getItem('fxte_api_base');
    // If stored value is the real server, use proxy instead (avoids CORS)
    if (!stored || stored.includes('api.pipsend.com')) {
      return FXTE_DEFAULTS.PROXY_BASE;
    }
    return stored;
  },
  // WebSocket connects directly to real server (no proxy needed for WS)
  get WS_BASE() {
    return 'wss://api.pipsend.com/api/v1/ws';
  },
  get USE_MOCK() {
    return localStorage.getItem('fxte_mode') === 'demo';
  },
};

// ââ APP STATE âââââââââââââââââââââââââââââââââââââââââââââ
const APP = {
  token        : localStorage.getItem('fxte_token') || null,
  refreshToken : localStorage.getItem('fxte_refresh') || null,
  login        : localStorage.getItem('fxte_login') || null,
  accountData  : JSON.parse(localStorage.getItem('fxte_account') || 'null'),
  ws           : null,
  refreshTimer : null,
  wsReconnectTimer: null,
};

function saveAuth() {
  if (APP.token)        localStorage.setItem('fxte_token',   APP.token);
  if (APP.refreshToken) localStorage.setItem('fxte_refresh', APP.refreshToken);
  if (APP.login)        localStorage.setItem('fxte_login',   APP.login);
  if (APP.accountData)  localStorage.setItem('fxte_account', JSON.stringify(APP.accountData));
}

function clearAuth() {
  ['fxte_token','fxte_refresh','fxte_login','fxte_account'].forEach(k=>localStorage.removeItem(k));
  APP.token = APP.refreshToken = APP.login = APP.accountData = null;
  if (APP.ws) { APP.ws.close(); APP.ws = null; }
  if (APP.refreshTimer) clearInterval(APP.refreshTimer);
  if (APP.wsReconnectTimer) clearTimeout(APP.wsReconnectTimer);
}

// ââ MOCK DATA âââââââââââââââââââââââââââââââââââââââââââââ
const MOCK = {
  account: { login:1201, balance:10500.75, equity:10850.25, margin:420.50,
             credit:0, free_margin:10080.25, trading_group:'Standard',
             first_name:'Operador', last_name:'Demo', initial:10000 },
  positions_open: [
    { id:1001, symbol:'XAUUSD', type:'buy',  volume:0.5, entry_price:2312.40, current_price:2318.80, profit:32.00, swap:-0.5, open_time:'2025-04-14T08:30:00Z' },
    { id:1002, symbol:'EURUSD', type:'sell', volume:1.0, entry_price:1.0855,  current_price:1.0842,  profit:13.00, swap:-0.3, open_time:'2025-04-14T10:15:00Z' },
    { id:1003, symbol:'NAS100', type:'buy',  volume:0.2, entry_price:19840.0, current_price:19920.0, profit:16.00, swap:-0.8, open_time:'2025-04-14T11:45:00Z' },
  ],
  positions_closed: [
    { id:995, symbol:'XAUUSD', type:'buy',  volume:0.5, entry_price:2298.20, close_price:2315.60, profit:87.00,  open_time:'2025-04-13T09:00:00Z', close_time:'2025-04-13T14:30:00Z' },
    { id:994, symbol:'EURUSD', type:'sell', volume:1.0, entry_price:1.0890,  close_price:1.0852,  profit:38.00,  open_time:'2025-04-12T11:00:00Z', close_time:'2025-04-12T16:00:00Z' },
    { id:993, symbol:'NAS100', type:'buy',  volume:0.3, entry_price:19700.0, close_price:19650.0, profit:-15.00, open_time:'2025-04-11T13:00:00Z', close_time:'2025-04-11T17:00:00Z' },
    { id:992, symbol:'GBPUSD', type:'buy',  volume:0.5, entry_price:1.2740,  close_price:1.2810,  profit:35.00,  open_time:'2025-04-10T08:00:00Z', close_time:'2025-04-10T12:00:00Z' },
    { id:991, symbol:'XAUUSD', type:'sell', volume:0.5, entry_price:2340.00, close_price:2312.00, profit:140.00, open_time:'2025-04-09T09:00:00Z', close_time:'2025-04-09T15:00:00Z' },
    { id:990, symbol:'USDJPY', type:'buy',  volume:0.5, entry_price:157.20,  close_price:156.80,  profit:-20.00, open_time:'2025-04-08T10:00:00Z', close_time:'2025-04-08T14:00:00Z' },
  ],
  stats: { total:47, wins:31, losses:16, profit:1284.50, loss:-610.25, maxDD:3.42,
           totalVolume:38.54, bestTrade:312.00, worstTrade:-187.50 },
  ranking: [
    { login:1201,  name:'Operador Alpha', group:'Standard', balance:18400, profit_pct:8.42, win_rate:68.2, score:2.46, drawdown:2.10, trades:82 },
    { login:1202,  name:'Trader Sierra',  group:'Standard', balance:11200, profit_pct:6.20, win_rate:62.5, score:1.98, drawdown:3.40, trades:55 },
    { login:1203,  name:'Operador Kilo',  group:'Standard', balance:10850, profit_pct:5.05, win_rate:59.1, score:1.55, drawdown:3.42, trades:47 },
    { login:1204,  name:'Trader Delta',   group:'Standard', balance:10600, profit_pct:3.80, win_rate:54.3, score:1.12, drawdown:4.10, trades:35 },
    { login:1205,  name:'Operador Echo',  group:'Standard', balance:10200, profit_pct:1.50, win_rate:50.0, score:0.62, drawdown:5.20, trades:22 },
    { login:1206,  name:'Trader Foxtrot', group:'Standard', balance:9850,  profit_pct:-1.20,win_rate:42.1, score:-0.20,drawdown:7.10, trades:19 },
  ],
  market: [
    { symbol:'XAUUSD', price:2318.80, change:+0.42, bid:2318.70, ask:2318.90, session:'NY'  },
    { symbol:'EURUSD', price:1.0842,  change:-0.12, bid:1.0841,  ask:1.0843,  session:'EU'  },
    { symbol:'GBPUSD', price:1.2734,  change:+0.08, bid:1.2733,  ask:1.2735,  session:'EU'  },
    { symbol:'USDJPY', price:155.42,  change:+0.23, bid:155.41,  ask:155.43,  session:'AS'  },
    { symbol:'NAS100', price:19920.0, change:+0.55, bid:19919.0, ask:19921.0, session:'NY'  },
    { symbol:'US30',   price:39845.0, change:-0.18, bid:39844.0, ask:39846.0, session:'NY'  },
    { symbol:'USOIL',  price:82.40,   change:+0.31, bid:82.38,   ask:82.42,   session:'NY'  },
    { symbol:'BTCUSD', price:64820.0, change:+1.82, bid:64810.0, ask:64830.0, session:'24H' },
  ],
};

// ââ API LAYER âââââââââââââââââââââââââââââââââââââââââââââ
async function apiCall(endpoint, options = {}, retries = 3) {
  if (FXTE_CONFIG.USE_MOCK) {
    await new Promise(r => setTimeout(r, 150 + Math.random()*200));
    return getMockResponse(endpoint, options);
  }

  // Rate limit check
  if (!API_TRACKER.canMakeRequest()) {
    await new Promise(r => setTimeout(r, 1000));
  }

  try {
    const res = await fetch(FXTE_CONFIG.API_BASE + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': APP.token ? 'Bearer ' + APP.token : '',
        ...(options.headers || {})
      }
    });

    // Track usage + read rate limit headers
    API_TRACKER.track(endpoint, options.method || 'GET');
    API_TRACKER.recordHeaders(res.headers);

    // Rate limit exceeded â wait and retry
    if (res.status === 429) {
      const reset = res.headers.get('X-RateLimit-Reset');
      const wait  = reset ? Math.max(0, (parseInt(reset)*1000) - Date.now()) + 200 : 2000;
      console.warn('[FXTE] Rate limit hit, waiting ' + wait + 'ms');
      if (retries > 0) {
        await new Promise(r => setTimeout(r, wait));
        return apiCall(endpoint, options, retries - 1);
      }
      return null;
    }

    if (res.status === 401) {
      const ok = await doRefreshToken();
      if (ok) return apiCall(endpoint, options, retries);
      doLogout();
      return null;
    }

    const data = await res.json();
    return data;
  } catch(e) {
    console.warn('[FXTE] API error:', e.message);
    return null;
  }
}

function getMockResponse(endpoint, opts={}) {
  const method = opts.method || 'GET';
  if (method === 'POST' && endpoint.includes('/auth/login')) {
    return { status:'success', access_token:'mock_token_'+Date.now(),
             refresh_token:'mock_refresh', user: MOCK.account };
  }
  if (endpoint.includes('/status'))
    return { status:'success', data: { ...MOCK.account, login: parseInt(APP.login)||50001 } };
  if (endpoint.includes('state=open'))
    return { status:'success', data: MOCK.positions_open };
  if (endpoint.includes('state=closed'))
    return { status:'success', data: MOCK.positions_closed };
  if (endpoint.includes('/stats') || endpoint.includes('/totals'))
    return { status:'success', data: MOCK.stats };
  if (endpoint.includes('/accounts') && endpoint.includes('trading_group'))
    return { status:'success', data: MOCK.ranking };
  if (endpoint.includes('/symbols'))
    return { status:'success', data: MOCK.market };
  if (endpoint.includes('/positions') && !endpoint.includes('state'))
    return { status:'success', data: [...MOCK.positions_open, ...MOCK.positions_closed] };
  return { status:'success', data: {} };
}

// ââ AUTH ââââââââââââââââââââââââââââââââââââââââââââââââââ
async function doLogin(loginVal, passVal, serverUrl) {
  const server = serverUrl || FXTE_DEFAULTS.SERVER;
  const base = server.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  localStorage.setItem('fxte_api_base', base + '/api/v1');

  if (FXTE_CONFIG.USE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    APP.token = 'mock_token_demo';
    APP.refreshToken = 'mock_refresh_demo';
    APP.login = loginVal;
    APP.accountData = { ...MOCK.account, login: parseInt(loginVal)||1201 };
    saveAuth();
    return { ok: true };
  }

  try {
    const res = await fetch(FXTE_CONFIG.API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: String(loginVal), password: passVal })
    });
    const data = await res.json();
    if (!res.ok || data.status === 'error') throw new Error(data.message || 'Credenciales incorrectas');

    APP.token = data.access_token;
    APP.refreshToken = data.refresh_token;
    APP.login = data.user?.login || loginVal;
    APP.accountData = data.user;

    APP.refreshTimer = setInterval(doRefreshToken, 170 * 60 * 1000);
    saveAuth();
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

async function doRefreshToken() {
  if (!APP.refreshToken || FXTE_CONFIG.USE_MOCK) return true;
  try {
    const res = await fetch(FXTE_CONFIG.API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: APP.refreshToken })
    });
    const data = await res.json();
    if (data.access_token) {
      APP.token = data.access_token;
      localStorage.setItem('fxte_token', APP.token);
      return true;
    }
  } catch(e) {}
  return false;
}

function doLogout() {
  clearAuth();
  window.location.href = '/fxte';
}

// ââ WEBSOCKET âââââââââââââââââââââââââââââââââââââââââââââ
function connectWebSocket(onMessage) {
  if (FXTE_CONFIG.USE_MOCK) {
    // Simulate live updates every 3s
    setInterval(() => {
      MOCK.positions_open.forEach(p => { p.profit = parseFloat((p.profit + (Math.random()-0.48)*5).toFixed(2)); p.unrealized_pnl = p.profit; });
      const newEquity = MOCK.account.balance + MOCK.positions_open.reduce((s,p)=>s+p.profit,0);
      MOCK.account.equity = parseFloat(newEquity.toFixed(2));
      // Match SDK event structure: accounts:balance
      if (onMessage) onMessage({ op:'accounts:balance', balance: MOCK.account.equity, equity: MOCK.account.equity, credit: 0, margin: MOCK.account.margin });
      // positions:updated sends individual position events
      MOCK.positions_open.forEach(p => {
        if (onMessage) onMessage({ op:'positions:updated', position: { position_id: p.id, unrealized_pnl: p.profit, symbol: p.symbol, side: p.type==='buy'?1:-1 } });
      });
    }, 3000);
    updateWSStatus('live');
    return;
  }

  if (!FXTE_CONFIG.WS_BASE || !APP.token) return;

  try {
    if (APP.ws) APP.ws.close();
    APP.ws = new WebSocket(FXTE_CONFIG.WS_BASE + '?token=' + APP.token);

    APP.ws.onopen = () => {
      APP.ws.send(JSON.stringify({
        action: 'subscribe',
        channels: ['positions:updated','accounts:balance','positions:new','positions:closed']
      }));
      updateWSStatus('live');
    };
    APP.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (onMessage) onMessage(msg);
      } catch(e) {}
    };
    APP.ws.onclose = (e) => {
      updateWSStatus('offline');
      if (e.code === 1008) doRefreshToken().then(ok => ok && connectWebSocket(onMessage));
      else APP.wsReconnectTimer = setTimeout(() => connectWebSocket(onMessage), 5000);
    };
    APP.ws.onerror = () => updateWSStatus('warn');
  } catch(e) { updateWSStatus('offline'); }
}

function updateWSStatus(state) {
  const dot = document.getElementById('ws-dot');
  const lbl = document.getElementById('sb-api-status');
  const map = {
    live:    { color: 'var(--accent-green)',  text: 'â Live', textColor: 'var(--accent-green)' },
    warn:    { color: 'var(--accent-amber)',  text: 'â Warn', textColor: 'var(--accent-amber)' },
    offline: { color: 'var(--accent-red)',    text: 'â Off',  textColor: 'var(--accent-red)'   },
    demo:    { color: 'var(--accent-amber)',  text: 'â Demo', textColor: 'var(--accent-amber)' },
  };
  const s = map[state] || map.demo;
  if (dot) dot.style.background = s.color;
  if (lbl) { lbl.textContent = s.text; lbl.style.color = s.textColor; }
}

// ââ GLOBAL CLOCK ââââââââââââââââââââââââââââââââââââââââââ
function startGlobalClock() {
  function tick() {
    const now = new Date();
    const utc  = now.toUTCString().slice(17,22);
    const el   = document.getElementById('global-clock');
    if (el) el.textContent = utc + ' UTC';
    const el2  = document.getElementById('utc-time');
    if (el2) el2.textContent = utc + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
}

// ââ SIDEBAR ACCOUNT âââââââââââââââââââââââââââââââââââââââ
function updateSidebarAccount(d) {
  // Handle both SDK event format (direct fields) and account object
  if (d && d.op === 'accounts:balance') {
    d = { balance: d.balance, equity: d.equity || d.balance, margin: d.margin, trading_group: APP.accountData?.trading_group };
  }
  d = d || APP.accountData || MOCK.account;
  const bal = parseFloat(d.balance)||0;
  const eq  = parseFloat(d.equity)||0;
  const dd  = bal > 0 ? Math.max(0, (bal-eq)/bal*100) : 0;

  const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  set('sb-balance', '$'+fmtNum(bal));
  set('sb-equity',  '$'+fmtNum(eq));
  set('sb-dd', dd.toFixed(2)+'%');
  set('sb-level', d.trading_group||'Level 1');
  set('global-login', 'OP Â· ' + (APP.login||d.login||'â'));

  const ddEl = document.getElementById('sb-dd');
  if (ddEl) ddEl.style.color = dd<6?'var(--accent-green)':dd<9?'var(--accent-amber)':'var(--accent-red)';
}

// ââ TOAST âââââââââââââââââââââââââââââââââââââââââââââââââ
function showToast(msg, type='ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'toast ' + type + ' show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ââ HELPERS âââââââââââââââââââââââââââââââââââââââââââââââ
function fmtNum(n, d=2) {
  return parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
}
function fmtPct(n, d=2) { return (n>=0?'+':'')+fmtNum(n,d)+'%'; }
function fmtPnl(n) { return (n>=0?'+$':'-$') + fmtNum(Math.abs(n)); }
function setEl(id,v) { const e=document.getElementById(id); if(e) e.textContent=v; }
function setColor(id,pos,neg,zero) {
  const e=document.getElementById(id); if(!e) return;
  const v=parseFloat(e.textContent.replace(/[^0-9.-]/g,''))||0;
  e.style.color = v>0?pos:v<0?neg:zero;
}
function animVal(id, to, prefix='', suffix='', dec=2) {
  const el = document.getElementById(id); if (!el) return;
  const steps = 35, inc = to/steps; let cur=0, i=0;
  const t = setInterval(() => {
    cur+=inc; i++;
    el.textContent = prefix + (dec>0?fmtNum(cur,dec):Math.round(cur)) + suffix;
    if (i>=steps) { clearInterval(t); el.textContent=prefix+(dec>0?fmtNum(to,dec):to)+suffix; }
  }, 18);
}

// ââ PAGE GUARD ââââââââââââââââââââââââââââââââââââââââââââ
function requireAuth() {
  if (!APP.token) {
    window.location.href = '/fxte';
    return false;
  }
  return true;
}

// ââ SESSIONS âââââââââââââââââââââââââââââââââââââââââââââ
const SESSIONS = [
  { name:'Sydney',   open:22, close:7  },
  { name:'Tokio',    open:0,  close:9  },
  { name:'Londres',  open:8,  close:17 },
  { name:'New York', open:13, close:22 },
];
function isSessionActive(open, close) {
  const h = new Date().getUTCHours();
  return open < close ? h>=open && h<close : h>=open || h<close;
}
function getActiveSessions() {
  return SESSIONS.filter(s=>isSessionActive(s.open,s.close)).map(s=>s.name);
}

// ââ ECONOMIC CALENDAR (ForexFactory proxy) ââââââââââââââââ
async function loadMacroEvents() {
  // Use ForexFactory JSON or Investing.com API
  // Fallback to static data
  return [
    { time:'08:30', name:'IPC EEUU (MoM)', currency:'USD', impact:'high',  countdown: calcCountdown(8,30) },
    { time:'10:00', name:'Confianza Consumidor', currency:'USD', impact:'med', countdown: calcCountdown(10,0) },
    { time:'14:30', name:'Inventarios PetrÃ³leo EIA', currency:'OIL', impact:'med', countdown: calcCountdown(14,30) },
    { time:'18:00', name:'Actas FOMC', currency:'USD', impact:'high', countdown: calcCountdown(18,0) },
  ];
}

function calcCountdown(h, m) {
  const now = new Date();
  const ev  = new Date(); ev.setUTCHours(h, m, 0, 0);
  let diff  = Math.round((ev - now) / 60000);
  if (diff < 0) diff += 1440;
  const hh  = Math.floor(diff/60), mm = diff%60;
  return hh + 'h ' + String(mm).padStart(2,'0') + 'm';
}

// ââ SHARED SIDEBAR HTML âââââââââââââââââââââââââââââââââââ
function getSidebarHTML(activePage) {
  const pages = [
    { id:'overview',  icon:'â', label:'Desk Overview',   href:'/overview' },
    { id:'audit',     icon:'â', label:'Execution Audit',  href:'/audit'    },
    { id:'ranking',   icon:'â¦', label:'Desk Ranking',     href:'/ranking'  },
    { id:'symbol',    icon:'â', label:'Symbol Desk',      href:'/symbol'   },
    { id:'market',    icon:'â', label:'Market Context',   href:'/market'   },
    { id:'operation', icon:'â¤', label:'Operation Log',    href:'/operation'},
    { id:'alert',     icon:'â»', label:'Alerts',           href:'/alert',   badge:'â' },
  ];
  return `
    <div class="sidebar-section">
      <div class="sidebar-label">MÃ³dulos</div>
      ${pages.map(p=>`
        <a class="sidebar-item ${p.id===activePage?'active':''}" href="${p.href}" style="text-decoration:none">
          <span class="s-icon">${p.icon}</span>
          <span class="s-label">${p.label}</span>
          ${p.badge?`<span class="s-badge" id="sb-alert-count" style="background:var(--accent-red-dim);color:var(--accent-red)">${p.badge}</span>`:''}
        </a>
      `).join('')}
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Estado de Cuenta</div>
      <div style="padding:0 16px">
        ${[
          ['Balance', 'sb-balance', 'var(--text-primary)'],
          ['Equity',  'sb-equity',  'var(--accent-green)'],
          ['DD actual','sb-dd',     'var(--accent-amber)'],
          ['Nivel',   'sb-level',   'var(--accent-amber)'],
        ].map(([l,id,c])=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
            <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted)">${l}</span>
            <span style="font-family:var(--mono);font-size:10px;color:${c};font-weight:500" id="${id}">â</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding:5px 0">
          <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted)">Pipsend</span>
          <span style="font-family:var(--mono);font-size:9px" id="sb-api-status">â</span>
        </div>
      </div>
    </div>
    <div class="sidebar-section" style="padding:0 16px;margin-top:auto">
      <button class="btn" onclick="doLogout()" style="width:100%;font-size:9px;margin-top:8px">â© Salir</button>
    </div>
  `;
}

// ââ SHARED TOPBAR HTML ââââââââââââââââââââââââââââââââââââ
function getTopbarHTML(activePage) {
  const navItems = [
    { label:'Overview',  id:'overview',  href:'/overview'  },
    { label:'Audit',     id:'audit',     href:'/audit'     },
    { label:'Ranking',   id:'ranking',   href:'/ranking'   },
    { label:'Symbols',   id:'symbol',    href:'/symbol'    },
    { label:'Markets',   id:'market',    href:'/market'    },
    { label:'Journal',   id:'operation', href:'/operation' },
    { label:'Alerts',    id:'alert',     href:'/alert'     },
  ];
  return `
    <div class="topbar-left">
      <div class="logo">
        <div class="logo-dot"></div>
        <span>FXTE Â· OS</span>
      </div>
      <nav class="nav" id="main-nav">
        ${navItems.map(n=>`
          <a class="nav-item ${n.id===activePage?'active':''}" href="${n.href}" style="text-decoration:none">${n.label}</a>
        `).join('')}
      </nav>
    </div>
    <div class="topbar-right">
      <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary)" id="global-clock">â</div>
      <div class="account-tag">
        <div class="status-dot" id="ws-dot"></div>
        <span class="login" id="global-login">â</span>
      </div>
      <button class="btn primary" onclick="syncPage()">â» Sync</button>
    </div>
  `;
}

// ââ SHARED CSS ââââââââââââââââââââââââââââââââââââââââââââ
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
:root{
  --bg-base:#080a0e;--bg-surface:#0d1117;--bg-card:#111620;--bg-card-hover:#161c2a;
  --bg-highlight:#1a2235;--border:rgba(255,255,255,0.06);--border-active:rgba(255,255,255,0.12);
  --text-primary:#e8edf5;--text-secondary:#7a8599;--text-muted:#3d4556;
  --accent-blue:#2d7ff9;--accent-blue-dim:rgba(45,127,249,0.12);
  --accent-green:#00c896;--accent-green-dim:rgba(0,200,150,0.10);
  --accent-amber:#f5a623;--accent-amber-dim:rgba(245,166,35,0.10);
  --accent-red:#f23645;--accent-red-dim:rgba(242,54,69,0.10);
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg-base);color:var(--text-primary);font-family:var(--sans);font-size:13px;min-height:100vh;overflow-x:hidden;}
/* TOPBAR */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:48px;background:var(--bg-surface);border-bottom:1px solid var(--border);position:fixed;top:0;left:0;right:0;z-index:200;}
.topbar-left{display:flex;align-items:center;gap:32px;}
.logo{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:0.15em;display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text-primary);text-decoration:none;}
.logo-dot{width:6px;height:6px;border-radius:50%;background:var(--accent-blue);box-shadow:0 0 8px var(--accent-blue);}
.nav{display:flex;gap:2px;}
.nav-item{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;color:var(--text-secondary);padding:6px 12px;border-radius:4px;cursor:pointer;transition:all 0.15s;text-transform:uppercase;text-decoration:none;}
.nav-item:hover{color:var(--text-primary);background:var(--bg-highlight);}
.nav-item.active{color:var(--accent-blue);background:var(--accent-blue-dim);}
.topbar-right{display:flex;align-items:center;gap:12px;}
.account-tag{display:flex;align-items:center;gap:8px;padding:4px 12px;border:1px solid var(--border-active);border-radius:4px;background:var(--bg-card);}
.account-tag .login{font-family:var(--mono);font-size:11px;color:var(--accent-blue);font-weight:500;}
.status-dot{width:5px;height:5px;border-radius:50%;background:var(--accent-green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.btn{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;padding:6px 14px;border-radius:4px;border:1px solid var(--border-active);background:var(--bg-card);color:var(--text-secondary);cursor:pointer;transition:all 0.15s;}
.btn:hover{color:var(--text-primary);background:var(--bg-highlight);}
.btn.primary{background:var(--accent-blue-dim);border-color:var(--accent-blue);color:var(--accent-blue);}
.btn.green{background:var(--accent-green-dim);border-color:var(--accent-green);color:var(--accent-green);}
/* LAYOUT */
.app-shell{min-height:calc(100vh - 48px);margin-top:48px;position:relative;}
.sidebar{background:var(--bg-surface);border-right:1px solid var(--border);padding:20px 0;position:fixed;top:48px;left:0;width:220px;height:calc(100vh - 48px);overflow-y:auto;z-index:100;display:flex;flex-direction:column;}
.sidebar-section{margin-bottom:24px;}
.sidebar-label{font-family:var(--mono);font-size:9px;letter-spacing:0.2em;color:var(--text-muted);text-transform:uppercase;padding:0 16px 8px;}
.sidebar-item{display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;transition:all 0.15s;border-left:2px solid transparent;}
.sidebar-item:hover{background:var(--bg-highlight);}
.sidebar-item.active{background:var(--accent-blue-dim);border-left-color:var(--accent-blue);}
.s-icon{font-size:11px;width:16px;text-align:center;color:var(--text-muted);}
.sidebar-item.active .s-icon{color:var(--accent-blue);}
.s-label{font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);}
.sidebar-item.active .s-label{color:var(--accent-blue);}
.s-badge{margin-left:auto;font-family:var(--mono);font-size:9px;padding:1px 6px;border-radius:3px;}
.main-content{margin-left:220px;padding:24px;overflow-y:auto;min-height:calc(100vh - 48px);box-sizing:border-box;}
/* PANELS */
.panel{background:var(--bg-card);border:1px solid var(--border);border-radius:6px;overflow:hidden;}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--border);background:var(--bg-surface);}
.panel-title{font-family:var(--mono);font-size:9px;letter-spacing:0.2em;color:var(--text-secondary);text-transform:uppercase;}
.panel-action{font-family:var(--mono);font-size:9px;color:var(--accent-blue);cursor:pointer;letter-spacing:0.08em;text-transform:uppercase;}
.panel-body{padding:14px;}
.panel-body.np{padding:0;}
.panel-badge{font-family:var(--mono);font-size:9px;padding:2px 8px;border-radius:3px;}
/* KPI CARDS */
.kpi-card{background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:14px 16px;position:relative;overflow:hidden;transition:border-color 0.2s;}
.kpi-card:hover{border-color:var(--border-active);}
.kpi-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--kpi-color,var(--accent-blue));opacity:0.5;}
.kpi-label{font-family:var(--mono);font-size:9px;letter-spacing:0.15em;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;}
.kpi-value{font-family:var(--mono);font-size:22px;font-weight:500;line-height:1;margin-bottom:5px;color:var(--kpi-color,var(--text-primary));}
.kpi-sub{font-family:var(--mono);font-size:10px;color:var(--text-secondary);}
.kpi-delta{display:inline-flex;align-items:center;gap:3px;font-family:var(--mono);font-size:9px;padding:2px 5px;border-radius:3px;margin-top:5px;}
.kpi-delta.up{background:var(--accent-green-dim);color:var(--accent-green);}
.kpi-delta.down{background:var(--accent-red-dim);color:var(--accent-red);}
.kpi-delta.neutral{background:var(--bg-highlight);color:var(--text-muted);}
/* GRIDS */
.g1{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
.g2l{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px;}
.g1-2{display:grid;grid-template-columns:1fr 2fr;gap:16px;margin-bottom:16px;}
/* PAGE HEADER */
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;}
.page-eyebrow{font-family:var(--mono);font-size:9px;letter-spacing:0.2em;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px;}
.page-title{font-family:var(--sans);font-size:20px;font-weight:300;letter-spacing:-0.02em;}
.page-title span{color:var(--accent-blue);font-weight:500;}
.page-meta{font-family:var(--mono);font-size:10px;color:var(--text-muted);margin-top:4px;}
.header-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
/* OPERATOR BANNER */
.operator-banner{display:grid;grid-template-columns:auto 1px auto auto auto auto;gap:0 28px;align-items:center;padding:14px 20px;background:var(--bg-card);border:1px solid var(--border);border-top:2px solid var(--accent-blue);border-radius:6px;margin-bottom:20px;}
.op-identity{}
.op-alias{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--text-primary);letter-spacing:0.05em;}
.op-level{font-family:var(--mono);font-size:9px;color:var(--accent-amber);letter-spacing:0.15em;text-transform:uppercase;margin-top:3px;}
.op-divider{width:1px;height:36px;background:var(--border);}
.op-metric{}
.om-label{font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;}
.om-val{font-family:var(--mono);font-size:15px;font-weight:500;}
/* MARKET ROWS */
.market-row{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);transition:background 0.1s;cursor:default;}
.market-row:last-child{border-bottom:none;}
.market-row:hover{background:var(--bg-highlight);}
.market-symbol{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--text-primary);width:70px;}
.market-price{font-family:var(--mono);font-size:11px;color:var(--text-primary);flex:1;}
.market-change{font-family:var(--mono);font-size:11px;font-weight:500;width:64px;text-align:right;}
/* POSITION ROWS */
.pos-row{display:flex;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--border);}
.pos-row:last-child{border-bottom:none;}
.pos-badge{display:inline-flex;align-items:center;padding:2px 6px;border-radius:3px;font-family:var(--mono);font-size:9px;font-weight:500;text-transform:uppercase;}
.pos-badge.buy{background:var(--accent-green-dim);color:var(--accent-green);}
.pos-badge.sell{background:var(--accent-red-dim);color:var(--accent-red);}
.pos-symbol{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--text-primary);flex:1;}
.pos-lots{font-family:var(--mono);font-size:10px;color:var(--text-muted);}
.pos-pnl{font-family:var(--mono);font-size:11px;font-weight:500;}
/* TRADE TABLE */
.trade-table{width:100%;border-collapse:collapse;}
.trade-table th{font-family:var(--mono);font-size:9px;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;padding:8px 12px;border-bottom:1px solid var(--border);text-align:left;background:var(--bg-surface);}
.trade-table td{font-family:var(--mono);font-size:10px;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text-secondary);}
.trade-table tr:hover td{background:var(--bg-highlight);}
.trade-table tr:last-child td{border-bottom:none;}
/* TOAST */
.toast{position:fixed;bottom:24px;right:24px;background:var(--bg-card);border:1px solid var(--border-active);border-radius:6px;padding:10px 14px;font-family:var(--mono);font-size:10px;color:var(--text-primary);z-index:999;transform:translateY(60px);opacity:0;transition:all 0.3s ease;pointer-events:none;}
.toast.show{transform:translateY(0);opacity:1;}
.toast.ok{border-left:3px solid var(--accent-green);}
.toast.err{border-left:3px solid var(--accent-red);}
/* ANIMATIONS */
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.f0{animation:fadeUp 0.35s ease both;}
.f1{animation:fadeUp 0.35s 0.05s ease both;}
.f2{animation:fadeUp 0.35s 0.10s ease both;}
.f3{animation:fadeUp 0.35s 0.15s ease both;}
.f4{animation:fadeUp 0.35s 0.20s ease both;}
.f5{animation:fadeUp 0.35s 0.25s ease both;}
/* SCROLLBAR */
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-active);border-radius:2px;}
/* SESSIONS */
.session-grid{display:grid;grid-template-columns:repeat(4,1fr);}
.session-box{padding:10px 12px;border-right:1px solid var(--border);text-align:center;}
.session-box:last-child{border-right:none;}
.session-name{font-family:var(--mono);font-size:9px;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;}
.session-status{font-family:var(--mono);font-size:10px;font-weight:500;margin-bottom:2px;}
.session-hours{font-family:var(--mono);font-size:9px;color:var(--text-muted);}
/* ALERT ITEMS */
.alert-item{display:flex;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);}
.alert-item:last-child{border-bottom:none;}
.alert-item:hover{background:var(--bg-highlight);}
.alert-dot{width:6px;height:6px;border-radius:50%;margin-top:3px;flex-shrink:0;}
.alert-content{flex:1;}
.alert-title{font-family:var(--mono);font-size:10px;font-weight:500;margin-bottom:2px;}
.alert-desc{font-family:var(--sans);font-size:11px;color:var(--text-secondary);line-height:1.4;}
.alert-time{font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-top:3px;}
/* MACRO EVENTS */
.event-row{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);}
.event-row:last-child{border-bottom:none;}
.event-impact{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.event-time{font-family:var(--mono);font-size:10px;color:var(--text-muted);width:44px;}
.event-name{font-family:var(--sans);font-size:11px;color:var(--text-primary);flex:1;}
.event-currency{font-family:var(--mono);font-size:9px;color:var(--text-secondary);width:28px;}
.event-countdown{font-family:var(--mono);font-size:9px;color:var(--accent-amber);background:var(--accent-amber-dim);padding:2px 6px;border-radius:3px;}
/* SETUP DIALOG */
.setup-overlay{position:fixed;inset:0;background:rgba(8,10,14,0.92);z-index:500;display:flex;align-items:center;justify-content:center;}
.setup-card{background:var(--bg-card);border:1px solid var(--border-active);border-radius:8px;padding:32px;width:420px;max-width:90vw;}
.setup-title{font-family:var(--mono);font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:6px;}
.setup-sub{font-family:var(--sans);font-size:12px;color:var(--text-secondary);margin-bottom:24px;line-height:1.5;}
.form-field{margin-bottom:14px;}
.form-label{display:block;font-family:var(--mono);font-size:9px;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px;}
.form-input{width:100%;background:var(--bg-surface);border:1px solid var(--border);border-radius:4px;padding:9px 12px;font-family:var(--mono);font-size:12px;color:var(--text-primary);outline:none;transition:border-color 0.15s;}
.form-input:focus{border-color:var(--accent-blue);}
.form-hint{font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-top:4px;}
.form-error{font-family:var(--mono);font-size:10px;color:var(--accent-red);margin-top:10px;display:none;}
.form-loading{font-family:var(--mono);font-size:10px;color:var(--text-muted);margin-top:10px;display:none;}
`;

console.log('[FXTE OS] shared.js loaded');

// ââ USAGE TRACKER (PipSend: 100 req/min Â· 1000 req/hr) âââââ
class UsageTracker {
  constructor() { this.requests = []; this.rateLimitInfo = {}; }

  track(endpoint, method) {
    this.requests.push({ endpoint, method, timestamp: Date.now() });
    const oneHourAgo = Date.now() - 3600000;
    this.requests = this.requests.filter(r => r.timestamp > oneHourAgo);
  }

  recordHeaders(headers) {
    if (!headers) return;
    const limit     = headers.get?.('X-RateLimit-Limit');
    const remaining = headers.get?.('X-RateLimit-Remaining');
    const reset     = headers.get?.('X-RateLimit-Reset');
    if (limit) this.rateLimitInfo = { limit, remaining, reset };
    this._updateRateLimitUI();
  }

  _updateRateLimitUI() {
    const { remaining, limit } = this.rateLimitInfo;
    if (!remaining || !limit) return;
    const pct = Math.round((remaining / limit) * 100);
    const color = pct > 50 ? 'var(--accent-green)' : pct > 20 ? 'var(--accent-amber)' : 'var(--accent-red)';
    const el = document.getElementById('sb-api-status');
    if (el) { el.textContent = `â ${remaining}/${limit}`; el.style.color = color; }
  }

  getStats() {
    const now = Date.now();
    const lastMinute = this.requests.filter(r => r.timestamp > now - 60000);
    const lastHour   = this.requests;
    const byEndpoint = {};
    lastHour.forEach(r => { byEndpoint[r.endpoint] = (byEndpoint[r.endpoint]||0)+1; });
    return {
      totalLastHour:   lastHour.length,
      totalLastMinute: lastMinute.length,
      remaining:       this.rateLimitInfo.remaining,
      limit:           this.rateLimitInfo.limit,
      byEndpoint,
      topEndpoints: Object.entries(byEndpoint).sort((a,b)=>b[1]-a[1]).slice(0,5),
      withinLimits: lastMinute.length < 100 && lastHour.length < 1000,
    };
  }

  canMakeRequest() {
    const stats = this.getStats();
    if (stats.totalLastMinute >= 95) {
      console.warn('[FXTE] Rate limit warning: ' + stats.totalLastMinute + ' req/min');
      return false;
    }
    return true;
  }
}

const API_TRACKER = new UsageTracker();

// Log stats every minute in console
setInterval(() => {
  if (FXTE_CONFIG.USE_MOCK) return;
  const s = API_TRACKER.getStats();
  if (s.totalLastMinute > 0) console.log('[FXTE] API Stats:', s);
}, 60000);
