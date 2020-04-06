'use strict';
// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// Application Setup
const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());

//Routes
app.get('/location',locationHandler);
app.get('/weather',weatherHandler);
app.get('/trails',trailsHandler)
app.get('*', notFoundHandler);
app.use(errorHandler);


//Handlers
let latitude;
let longitude;
let coordArray=[];

function locationHandler(request,response){
    let city = request.query.city;
    superagent(`https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`).then((resp)=>{
        const geoData = resp.body;
        const locationData = new Location(city,geoData);
        latitude = locationData.latitude;
        longitude = locationData.longitude;
        coordArray.push(latitude,longitude);
        response.status(200).json(locationData);
    }).catch((err)=> errorHandler(err,request,response));
}


function weatherHandler(request,response){
    superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`).then(weatherRes=>{
        const weatherSummaries = weatherRes.body.data.map(day=>{
            return new Weather(day);
        })
        response.status(200).json(weatherSummaries);
    }).catch(err=>errorHandler(err,request,response));
}


function trailsHandler(request,response){
    superagent(`https://www.hikingproject.com/data/get-trails?lat=${coordArray[0]}&lon=${coordArray[1]}&maxDistance=10&key=${process.env.TRAIL_API_KEY}`).then(resp =>{
        const availableTrails = resp.body.trails.map(value=>{
            return new Trail(value);
        })
        response.status(200).json(availableTrails);
    }).catch(err=>errorHandler(err,request,response));
}



// HELPER FUNCTIONS
function notFoundHandler(request,response){
    response.status(404).send('Error 404: URL Not found.')
}
function errorHandler (error,request,response){
    response.status(500).send('SORRY AN ERROR OCCURED '+error);
}
function Location(city,geoData){
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}
function Weather(data){
    this.forecast = data.weather.description;
    this.time = new Date(data.valid_date).toDateString();
}
function Trail(data){
    this.name = data.name;
    this.location = data.location;
    this.length = data.length;
    this.stars = data.stars;
    this.star_votes = data.starVotes;
    this.summary = data.summary;
    this.trail_url = data.url;
    this.conditions = data.conditionStatus;
    this.condition_date = data.conditionDate.split(' ')[0];
    this.condition_time = data.conditionDate.split(' ')[1];
}



app.listen(PORT, () => console.log(`the server is up and running on ${PORT}`));