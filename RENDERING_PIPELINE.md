# Map Rendering Pipeline

## Mapnik (C++ library, Node.js bindings via node-mapnik)

The lowest level — the actual map renderer. Takes a Mapnik XML stylesheet (which TileMill compiles from CartoCSS) plus datasources (PostGIS, shapefiles, etc.) and rasterizes map tiles as PNG images. It knows nothing about tile coordinates or HTTP — it just renders a geographic extent to pixels.

## Millstone (Node.js)

A pre-processing step that runs before Mapnik renders anything. It resolves all the external resources referenced in a Mapnik stylesheet — downloads remote files, localizes URLs, reprojects datasources if needed, and caches everything to disk. The output is a "localized" stylesheet where every resource path points to something Mapnik can read directly. TileMill runs Millstone when you save a project.

##TileLive (Node.js)

A generic tile-serving abstraction layer. Defines a standard interface (getTile(z, x, y, callback), getGrid(...), getInfo(...)) that any tile source can implement. It doesn't render anything itself — it just provides the protocol that tile servers and clients speak. Think of it as the interface/contract.

## TileLive-Mapnik (Node.js)

A TileLive backend — it implements the TileLive interface using Mapnik as the renderer. When getTile(z, x, y) is called, it computes the geographic bounding box for that tile coordinate, hands it to Mapnik with the compiled stylesheet, and returns the rendered PNG. It also handles metatile rendering (rendering a 2×2 or 4×4 block of tiles at once to avoid edge artifacts) and caches rendered tiles.

## How they work together in TileMill:

CartoCSS stylesheet
        ↓
  TileMill compiles to Mapnik XML
        ↓
  Millstone localizes all resources
        ↓
  TileLive-Mapnik loads the localized XML,
  implements getTile() using Mapnik
        ↓
  TileLive provides the standard interface
  that TileMill's tile server calls
        ↓
  Mapnik renders the tile image
        ↓
  Browser receives PNG tile

When the browser pans or zooms, ModestMaps requests tile URLs like /tile/project-id/z/x/y.png. TileMill's servers/Tile.bones receives those requests, calls getTile() on the TileLive-Mapnik source for that project, and streams the PNG back. The TileLive-Mapnik source was already initialized with the Millstone-localized Mapnik XML when the project was loaded.