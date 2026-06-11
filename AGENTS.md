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
| CONFIG | cog (engranaje, path simplificado: círculo + 4 dientes) |

- SVG paths definidos en `src/icons.js` → objeto `ICONS` (prefijo `dock-`)
- Mapping `data-lucide` → icono interno en `src/icons.js` → `LUCIDE_MAP`
- HTML del dock en `index.html` líneas ~2521-2559

## Per-Item Dock Colors (11 Jun 2026)
Cada sección del dock tiene su propio color vía `--item-accent` en inline style. El CSS del dock usa `var(--item-accent, #9b87f5)` en vez de `var(--admin-accent, #9b87f5)` — los items son independientes del accent global.

| Sección | Color | Hex |
|---|---|---|
| TABLERO | Azul Eléctrico | `#3B82F6` |
| PEDIDOS | Púrpura Profundo | `#8B5CF6` |
| CLIENTES | Esmeralda | `#34D399` |
| ENVÍOS | Cian Aqua | `#22D3EE` |
| INVENTARIO | Ámbar | `#F59E0B` |
| PRODUCTOS | Rosa | `#F472B6` |
| COBRANZAS | Rojo Carmesí | `#EF4444` |
| CUPONES | Naranja Atardecer | `#FB923C` |
| REPORTES | Índigo Neón | `#6366F1` |
| VOLVER A TIENDA | Gris Plata | `#9CA3AF` |
| CONFIG | Grafito | `#1F2937` |

- `--item-accent` agregado como `style` inline en cada `<button class="dock-item">` en `index.html`
- CSS reemplazó `var(--admin-accent, #9b87f5)` → `var(--item-accent, #9b87f5)` en `.dock-item`, `.dock-item.drag-over`, `.dock-item.active`, `html.dark .dock-item`
- `.dock-item.active` usa `color-mix(in srgb, var(--item-accent, #9b87f5), #fff 45%)` en vez de `var(--admin-accent-light, #c4b5fd)`

## Infrastructure
- Firebase (Firestore + Auth) vía CDN (no npm)
- EmailJS vía CDN
- Tailwind CSS vía CDN
- SVG icons propios (sin librerías externas)

## Build
- `npm run build` con Vite
- Sin tests automatizados
