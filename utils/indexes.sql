CREATE INDEX idx_planet_osm_point_tags ON planet_osm_point USING gist(tags);
CREATE INDEX idx_planet_osm_line_tags ON planet_osm_line USING gist(tags);
CREATE INDEX idx_planet_osm_polygon_tags ON planet_osm_polygon USING gist(tags);
CREATE INDEX idx_planet_osm_roads_tags ON planet_osm_roads USING gist(tags);
