# FXTE Operating System · v2.0
## FX Pulse PRO Desk · Plataforma de Trading

---

## ESTRUCTURA DE ARCHIVOS

```
fxte/
├── shared.js        ← Núcleo compartido: API, auth, helpers, CSS
├── fxte.html        ← /fxte → Login / Entry point
├── overview.html    ← /overview → Desk Overview
├── audit.html       ← /audit → Execution Audit
├── ranking.html     ← /ranking → Desk Ranking
├── symbol.html      ← /symbol → Symbol Desk
├── market.html      ← /market → Market Context
├── operation.html   ← /operation → Operation Log (Journal)
├── alert.html       ← /alert → Alerts & Progression
├── .htaccess        ← Routing para Apache
├── vercel.json      ← Routing para Vercel
├── netlify.toml     ← Routing para Netlify
├── _redirects       ← Netlify/Cloudflare redirects
└── nginx.conf       ← Snippet para NGINX
```

---

## CONFIGURACIÓN INICIAL

### 1. URL del servidor PipSend

El servidor está pre-configurado en `https://api.pipsend.com`. En la página de login puedes expandir **"⚙ Configurar servidor"** para cambiarlo.

```
Servidor default: https://api.pipsend.com
API Base:         https://api.pipsend.com/api/v1
WebSocket:        wss://api.pipsend.com/api/v1/ws
```

Si tienes una IP directa (privada), también puedes ingresarla en el campo servidor:
```
https://TU-IP-REAL/api/v1
```

### 2. Grupo de trading para el Ranking

El sistema usa `FXTE PRO` como grupo:
```
/api/v1/accounts?trading_group=FXTE+PRO
```
Si el nombre exacto del grupo en PipSend es diferente, edita `FXTE_DEFAULTS.TRADING_GROUP` en `shared.js`.

### 3. Modo Demo

Si no hay servidor configurado, el sistema usa datos simulados con actualizaciones en tiempo real mockeadas. Ideal para demostración.

---

## DESPLIEGUE

### Vercel (recomendado)
1. Sube todos los archivos
2. El `vercel.json` configura las rutas automáticamente

### Netlify
1. Sube todos los archivos
2. El `netlify.toml` y `_redirects` configuran las rutas

### Apache / cPanel
1. Sube todos los archivos a `public_html/`
2. El `.htaccess` maneja el routing

### NGINX
1. Sube archivos al directorio web
2. Agrega el bloque de `nginx.conf` a tu config de servidor

---

## ENDPOINTS PIPSEND UTILIZADOS

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/auth/login` | Login con cuenta MT4/MT5 |
| POST | `/auth/refresh` | Refresh token (auto, c/170min) |
| GET  | `/accounts/{login}/status` | Balance, equity, margen |
| GET  | `/positions?login=X&state=open` | Posiciones abiertas |
| GET  | `/positions?login=X&state=closed` | Historial de trades |
| GET  | `/positions/stats?login=X&state=closed` | Estadísticas agregadas |
| GET  | `/accounts?trading_group=fxte_pro` | Todas las cuentas (Ranking) |
| GET  | `/symbols` | Cotizaciones en vivo |
| WS   | `/ws?token=TOKEN` | Actualizaciones en tiempo real |

---

## WEBSOCKET CHANNELS

```json
{
  "action": "subscribe",
  "channels": [
    "positions:updated",
    "accounts:balance",
    "positions:new",
    "positions:closed"
  ]
}
```

---

## CUSTOMIZACIÓN

### Colores
Edita las variables CSS en `SHARED_CSS` dentro de `shared.js`:
```css
--accent-blue: #2d7ff9;
--accent-green: #00c896;
--accent-amber: #f5a623;
```

### Grupo de evaluación Level 2
Los criterios de progresión están en `alert.html` → función `renderLevel2Criteria()`.

### Calendario macro
La función `loadMacroEvents()` en `shared.js` puede conectarse a ForexFactory API o cualquier fuente externa.

---

## SOPORTE

📧 info@fxpulse.org  
🌐 fxpulse.org  
📋 Plataforma FXTE PRO · FX Pulse
