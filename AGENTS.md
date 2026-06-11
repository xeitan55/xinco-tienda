# XINCO — Project Memory

## Liquid Glass Dock Icons (11 Jun 2026)
Rediseño completo de los 11 iconos del dock con estética **liquid glass premium**:

| Sección | Color (start → end) | Símbolo |
|---|---|---|
| TABLERO | `#BF5AF2` (Violet) | velocímetro |
| PEDIDOS | `#0A84FF` (Apple Blue) | clipboard + check |
| CLIENTES | `#0A0A0A` (Graphite Black) | dos personas |
| ENVÍOS | `#5E5CE6` (Indigo) | brújula |
| INVENTARIO | `#E879F9` (Orchid Pink) | estantes |
| PRODUCTOS | `#FF7EB6` (Soft Rose) | remera |
| COBRANZAS | `#2C2C2E` (Titanium Gray) | billetera |
| CUPONES | `#151515` (Charcoal) | tag |
| REPORTES | `#64D2FF` (Cyan) | gráfico ascendente |
| VOLVER TIENDA | `#BF5AF2` (Violet) | puerta + flecha |
| CONFIG | `#0A84FF` (Apple Blue) | engranaje |

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
