'use strict';

// my libraries
const express = require('express'); // my server library
const cors = require('cors'); // the worst body guard
const superagent = require('superagent'); // the in-between to and from APIs
const pg = require('pg');
require('dotenv').config(); // allows us to get into the .evn /secrets

// tell express to use the libraries
const app = express();

// Middleware

app.use(cors());

//set up pg
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

// global variables
const PORT = process.env.PORT || 3001;

// global weather Array
// const weatherArray = [];

// my route to see if it shows in terminal(console.log) and page to front end at (response.status) and (200) means good to go!
// app.get('/bananas', (request, response) => {
//   console.log('This is B A N A N A S');
//   response.status(200).send('Alive bananas!');
// })

// routes

app.get('/location', handleTheLocation);
app.get('/weather', handleTheWeather);
app.get('/trails', handleTheTrails);
app.get('/table', handleTableData);
app.get('/yelp', handleYelp);
app.get('/movies', handletheMovies);


function handletheMovies(request, response){
  let url = 'https://api.themoviedb.org/3/search/movie'

  let queryParams = {
    api_key: process.env.MOVIE_API_KEY,
    query: request.query.search_query,
  }
  superagent.get(url)
    .query(queryParams)
    .then(resultsFromSuperagent => {
      // console.log('Results from the SuperAgent', resultsFromSuperagent);
      let moviesArr = resultsFromSuperagent.body.results.map(route => {
        return new Movies(route);
      })
      response.status(200).send(moviesArr);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Movies!! Sorry we broke it!')
    });

}



function handleYelp(request, response){

  const numPerPage = 5;
  const page = request.query.page || 1;
  const start = ((page -1) * numPerPage);

  const url = 'https://api.yelp.com/v3/businesses/search'

  const queryParams = {
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    offset: start,
    limit: numPerPage,
  }

  superagent.get(url)
    .set({'Authorization':`Bearer ${process.env.YELP_API_KEY}`}) //'user-key or whatever yelp wants//
    .query(queryParams)
    .then(results => {
      const resultsArray = results.body.businesses;
      console.log('this is what we get in our YELP results array', resultsArray);
      const yelpData = resultsArray.map(eatery => new YelpData(eatery));
      response.status(200).send(yelpData);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in YELP!! Sorry we broke it!');
    });

}

function handleTheLocation(request, response){
  // this is where the request is coming from
  let city = request.query.city;
  // when a user searched for a city, we want to first check to see if that city is in the database
  let sql = 'SELECT * FROM locations WHERE search_query=$1;';
  let safeValues = [city];

  client.query(sql, safeValues)
    .then(resultsFromPostgres => {
      console.log(resultsFromPostgres);
      if(resultsFromPostgres.rowCount){
        console.log('found location object in the database!');
        // this means that the city is in the database and I need to return the location object from here
        let locationObject = resultsFromPostgres.rows[0];
        response.status(200).send(locationObject);

      } else {
        // the URL of our locations api
        let url = 'https://us1.locationiq.com/v1/search.php'
        let queryParams = {
          key: process.env.GEO_DATA_API_KEY,
          q: city, // referring back to line 27
          format: 'json',
          limit: 1
        }
        console.log('did not find location object in the database -- going to locationIQ to get it');
        // this means that the city is NOT in the database and I need to go to LocationIQ to get the data
        // OK SUPERAGENT is taking the query params and adding them on the end of the URL on line 29
        // the .then gets the results of the entire URL
        superagent.get(url)
          .query(queryParams)
          .then(resultsFromTheSuperagent => {
            // console.log('These are the results from the Location superagent:', resultsFromTheSuperagent.body);
            let geoData = resultsFromTheSuperagent.body;
            const obj = new Location(city, geoData);

            // and save it to the database

            let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)';

            let safeValues = [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude];

            client.query(sql, safeValues);


            response.status(200).send(obj);
          }).catch((error) => {
            console.log('ERROR', error);
            response.status(500).send('Error in Location!! Sorry we broke it!');
          });

      }
    })


}



// function showAllNames(request, response){
//   // get everything from the table and send it to the front end
//   let sql = 'SELECT * FROM people;';
//   client.query(sql)
//     .then(resultsFromPostgres => {
//       let names = resultsFromPostgres.rows;
//       response.send(names);
//     }).catch(err => console.log(err));

// }

function handleTheWeather(request, response){

  // the URL of our locations api
  let url = 'https://api.weatherbit.io/v2.0/forecast/daily'

  let weatherParams = {
    key: process.env.WEATHER_API_KEY,
    lat: request.query.latitude,
    lon: request.query.longitude,
    days: 8,
  }

  // OK SUPERAGENT is taking the query params and adding them on the end of the URL on line 29
  // the .then gets the results of the entire URL
  superagent.get(url)
    .query(weatherParams)
    .then(resultsFromTheSuperagent => {
      console.log('These are the results from the Weather superagent:', resultsFromTheSuperagent.body.data);
      let weatherData = resultsFromTheSuperagent.body;
      let weatherDays = weatherData.data.map(dayOfWeather => {
        return new Weather(dayOfWeather);
      })
      response.status(200).send(weatherDays);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Weather!! Sorry we broke it!');
    });

}



function handleTheTrails(request, response){

  // the URL of our locations api
  let url = 'https://www.hikingproject.com/data/get-trails'

  let trailParams = {
    key: process.env.TRAIL_API_KEY,
    lat: request.query.latitude,
    lon: request.query.longitude,
    minLength: request.query.length,
    // minStars: request.query.stars,
    // maxResults: 10,
  }

  // OK SUPERAGENT is taking the query params and adding them on the end of the URL on line 29
  // the .then gets the results of the entire URL
  superagent.get(url)
    .query(trailParams)
    .then(resultsFromTheSuperagent => {
      console.log('These are the results from the Trails superagent:', resultsFromTheSuperagent.body.trails);
      let bestTrails = resultsFromTheSuperagent.body.trails.map(bestOfTrails => {
        return new Trail(bestOfTrails);
      })
      response.status(200).send(bestTrails);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Trails!! Sorry we broke it!');
    });

}

function Location (location, geoData){
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Weather (weatherInfo){
  this.forecast = weatherInfo.weather.description;
  this.time = new Date(weatherInfo.valid_date).toDateString();
  // weatherArray.push(this);
}

function Trail (obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
  this.condition_date = obj.conditionDate;
  this.condition_time = obj.condition_time;
}

function Movies(obj) {
  this.title = obj.original_title
  this.overview = obj.overview
  this.average_votes = obj.vote_average
  this.total_votes = obj.vote_count
  this.image_url = `https://image.tmdb.org/t/p/original${obj.poster_path}`
  this.popularity = obj.popularity
  this.released_on = obj.release_date
}

function YelpData(obj) {
  this.name = obj.name
  this.image_url = obj.image_url
  this.price = obj.price
  this.rating = obj.rating
  this.url = obj.url
}

function handleTableData(request, response){
  let sql = 'SELECT * FROM locations;';
  client.query(sql)
    .then(resultsFromPostgres => {
      let data = resultsFromPostgres.rows;
      response.send(data);
    }).catch(err => console.log(err));
}

app.get('*', (request, response) => {
  response.status(404).send('Sorry you are not allowed to view this page yet!');
});

// turn on the PORT!
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  }).catch(err => console.log('ERROR', err));
