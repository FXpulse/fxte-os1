// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
// FXTE OS ÃÂ¢ÃÂÃÂ SHARED CORE  (auth ÃÂÃÂ· api ÃÂÃÂ· router ÃÂÃÂ· ui)
// PipSend REST + WebSocket integration
// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ CONFIG (editable via Setup dialog) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
const FXTE_DEFAULTS = {
  PIPSEND_REAL:  'https://api.pipsend.com',         // Real PipSend server
  PROXY_BASE:    '/api/pipsend',                     // Vercel serverless proxy (solves CORS)
  API_VERSION:   '/api/v1',
  TRADING_GROUP: 'Standard',                         // Exact group name in PipSend
  DEFAULT_LOGIN: '1201',                              // Default account
};

const FXTE_CONFIG = {
  // Use the Vercel proxy as API_BASE ÃÂ¢ÃÂÃÂ it forwards to api.pipsend.com
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

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ APP STATE ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
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

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ MOCK DATA ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
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

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ API LAYER ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
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

    // Rate limit exceeded ÃÂ¢ÃÂÃÂ wait and retry
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

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ AUTH ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
async function doLogin(loginVal, passVal, serverUrl) {
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
    // Step 1: Login via FXTradeElite portal (email + password)
    const loginRes = await fetch(FXTE_CONFIG.API_BASE + '/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginVal, password: passVal })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || loginData.error) throw new Error(loginData.message || 'Credenciales incorrectas');

    const portalToken = loginData.token || loginData.bearer || loginData.access_token;
    if (!portalToken) throw new Error('No se recibio token de autenticacion');

    // Step 2: Get trading accounts linked to this portal user
    const accRes = await fetch(FXTE_CONFIG.API_BASE + '/utilities/logins', {
      headers: { 'Authorization': 'Bearer ' + portalToken }
    });
    const accData = await accRes.json();
    const accounts = accData.data || accData || [];
    const firstAccount = Array.isArray(accounts) ? accounts[0] : accounts;

    APP.token = portalToken;
    APP.refreshToken = loginData.refresh_token || null;
    APP.login = firstAccount?.login || firstAccount?.account || loginVal;
    APP.accountData = {
      ...(firstAccount || {}),
      first_name: loginData.user?.name || loginVal.split('@')[0],
      trading_group: firstAccount?.group || 'Standard',
      balance: firstAccount?.balance || 0,
      equity: firstAccount?.equity || 0,
    };
    APP.refreshTimer = setInterval(doRefreshToken, 170 * 60 * 1000);
    saveAuth();
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

