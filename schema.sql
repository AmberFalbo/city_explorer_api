DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7)
);

INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ('Seattle', 'Seattle, King County, Washington, USA', '47.6173', '122.3195');

SELECT * FROM locations;