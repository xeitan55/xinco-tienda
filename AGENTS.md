# XINCO — Project Memory

## Admin Dock Icons (11 Jun 2026)
Rediseño completo de iconos del dock del panel de administración:

| Sección | Icono |
|---|---|
| TABLERO | gauge (velocímetro) |
| PEDIDOS | clipboard-check (clipboard con check) |
| CLIENTES | users-round (dos personas) |
| ENVÍOS | compass (brújula) |
| INVENTARIO | shelves (estantes) |
| PRODUCTOS | shirt (remera) |
| COBRANZAS | wallet (billetera) |
| CUPONES | tag (etiqueta) |
| REPORTES | trending-up (tendencia ascendente) |
| VOLVER A TIENDA | door-arrow-left (puerta con flecha) |
| CONFIG | cog (engranaje) |

- SVG paths definidos en `src/icons.js` → objeto `ICONS` (prefijo `dock-`)
- Mapping `data-lucide` → icono interno en `src/icons.js` → `LUCIDE_MAP`
- HTML del dock en `index.html` líneas ~2521-2559

## Infrastructure
- Firebase (Firestore + Auth) vía CDN (no npm)
- EmailJS vía CDN
- Tailwind CSS vía CDN
- SVG icons propios (sin librerías externas)

## Build
- `npm run build` con Vite
- Sin tests automatizados
