DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255),
);

INSERT INTO locations (city, formatted_query, latitude, longitude) VALUES ('Seattle', 'Seattle, King County, Washington, USA', '47.6173', '122.3195');

SELECT * FROM locations;