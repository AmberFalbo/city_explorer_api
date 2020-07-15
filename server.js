'use strict';

// my libraries
const express = require('express'); // my server library
const cors = require('cors'); // the worst body guard
const superagent = require('superagent'); // the in-between to and from APIs

require('dotenv').config(); // allows us to get into the .evn /secrets

// tell express to use the libraries
const app = express();
app.use(cors());

// global variables
const PORT = process.env.PORT || 3001;
// global weather Array
// const weatherArray = [];

// my route to see if it shows in terminal(console.log) and page to front end at (response.status) and (200) means good to go!
// app.get('/bananas', (request, response) => {
//   console.log('This is B A N A N A S');
//   response.status(200).send('this is super BANANAS yup!');
// })

app.get('/location', handleTheLocation);

function handleTheLocation(request, response){
  // this is where the request is coming from
  let city = request.query.city;
  // the URL of our locations api
  let url = 'https://us1.locationiq.com/v1/search.php'

  let queryParams = {
    key: process.env.GEO_DATA_API_KEY,
    q: city, // referring back to line 27
    format: 'json',
    limit: 1
  }

  // OK SUPERAGENT is taking the query params and adding them on the end of the URL on line 29
  // the .then gets the results of the entire URL
  superagent.get(url)
    .query(queryParams)
    .then(resultsFromTheSuperagent => {
      console.log('These are the results from the Location superagent:', resultsFromTheSuperagent.body);
      let geoData = resultsFromTheSuperagent.body;
      const obj = new Location(city, geoData);
      response.send(obj);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Location!! Sorry we broke it!');
    });
}


app.get('/weather', handleTheWeather);

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
      response.send(weatherDays);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Weather!! Sorry we broke it!');
    });

}


app.get('/trails', handleTheTrails);

function handleTheTrails(request, response){
 
  // the URL of our locations api
  let url = 'https://www.hikingproject.com/data/get-trails'

  let trailParams = {
    key: process.env.TRAIL_API_KEY,
    lat: request.query.latitude,
    lon: request.query.longitude,
    minLength: request.query.length,
    minStars: request.query.stars,
    maxResults: 10,
  }

  // OK SUPERAGENT is taking the query params and adding them on the end of the URL on line 29
  // the .then gets the results of the entire URL
  superagent.get(url)
    .query(trailParams)
    .then(resultsFromTheSuperagent => {
      console.log('These are the results from the Trails superagent:', resultsFromTheSuperagent.body.data);
      let trailData = resultsFromTheSuperagent.body;
      let bestTrails = trailData.data.map(bestOfTrails => {
        return new Trail(bestOfTrails);
      })
      response.send(bestTrails);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Error in Trails!! Sorry we broke it!');
    });

}

function Location(location, geoData){
  this.search_query = location;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Weather(weatherInfo){
  this.forecast = weatherInfo.weather.description;
  this.time = new Date(weatherInfo.valid_date).toDateString();
  // weatherArray.push(this);
}

function Trail(obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
  this.condition_date = new Date(obj.conditionDate.slice(0,10)).toDateString();
  this.condition_time = obj.conditionDate.slice(11, 19);
}

app.get('*', (request, response) => {
  response.status(404).send('Sorry you are not allowed to view this page yet!');
});

// turn on the PORT!
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
