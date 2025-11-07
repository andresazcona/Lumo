# PWA Icons

## Instrucciones para generar iconos

Para generar los iconos de la PWA, necesitas crear una imagen cuadrada de 512x512px con el diseño que desees y luego usar una herramienta para generar todos los tamaños necesarios.

### Opción 1: Usar una herramienta online
1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube tu imagen de 512x512px
3. Descarga el paquete de iconos generados
4. Coloca los archivos en esta carpeta

### Opción 2: Usar ImageMagick (línea de comandos)
```bash
# Asumiendo que tienes una imagen llamada icon-base.png de 512x512px
convert icon-base.png -resize 72x72 icon-72.png
convert icon-base.png -resize 96x96 icon-96.png
convert icon-base.png -resize 128x128 icon-128.png
convert icon-base.png -resize 144x144 icon-144.png
convert icon-base.png -resize 152x152 icon-152.png
convert icon-base.png -resize 192x192 icon-192.png
convert icon-base.png -resize 384x384 icon-384.png
convert icon-base.png -resize 512x512 icon-512.png
```

### Diseño sugerido
- Fondo negro (#000000)
- Ícono o texto en blanco (#FFFFFF)
- Diseño simple y minimalista
- Puede ser las iniciales "FL" (Lumo) o un ícono de cámara estilizado

## Tamaños requeridos
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px (requerido por Chrome)
- 384x384px
- 512x512px (requerido por Chrome)

## Placeholder temporal
Mientras tanto, puedes usar placeholders simples o la app funcionará sin iconos (el navegador usará un ícono predeterminado).
