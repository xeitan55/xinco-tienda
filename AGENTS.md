# XINCO — Project Memory

## Liquid Glass Dock Icons (11 Jun 2026)
Rediseño completo de los 11 iconos del dock con estética **liquid glass premium**:

| Sección | Color (start → end) | Símbolo |
|---|---|---|
| TABLERO | `#3B82F6` → `#1E40AF` | velocímetro |
| PEDIDOS | `#8B5CF6` → `#6D28D9` | clipboard + check |
| CLIENTES | `#34D399` → `#047857` | dos personas |
| ENVÍOS | `#22D3EE` → `#0E7490` | brújula |
| INVENTARIO | `#F59E0B` → `#B45309` | estantes |
| PRODUCTOS | `#F472B6` → `#BE185D` | remera |
| COBRANZAS | `#EF4444` → `#B91C1C` | billetera |
| CUPONES | `#FB923C` → `#C2410C` | tag |
| REPORTES | `#6366F1` → `#4338CA` | gráfico ascendente |
| VOLVER TIENDA | `#9CA3AF` → `#4B5563` | puerta + flecha |
| CONFIG | `#6B7280` → `#374151` | engranaje |

- Cada icono es un SVG autónomo con fondo squircle `rx="7"`, gradiente vertical de 2 stops, highlight de vidrio (blanco .32→0), borde sutil y paths blancos `stroke-width=1.6`.
- Render vía `dockGlassIcon()` en `replaceIcons()` — usa `DOCK_PATHS` + `DOCK_COLORS` de `src/icons.js`.
- `--item-accent` se setea en el wrapper para estados hover/active/drag.
- `.dock-item` CSS cambió a vidrio esmerilado con `::after` highlight y borde translúcido.

## Infrastructure
- Firebase (Firestore + Auth) vía CDN (no npm)
- EmailJS vía CDN
- Tailwind CSS vía CDN
- SVG icons propios (sin librerías externas)

## Build
- `npm run build` con Vite
- Sin tests automatizados
