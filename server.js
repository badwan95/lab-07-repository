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
app.get('/weather',weatherHandler)
app.get('*', notFoundHandler);



//Handlers
function locationHandler(request,response){
    let city = request.query.city;
    superagent(`https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`).then((resp)=>{
        const geoData = resp.body;
        const locationData = new Location(city,geoData);
        response.status(200).json(locationData);
    }).catch((err)=> errorHandler(err,request,response));
}
function weatherHandler(request,response){
    let city = request.query.city;
    superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${process.env.WEATHER_API_KEY}`).then(weatherRes=>{
        const weatherSummaries = weatherRes.body.data.map(day=>{
            return new Weather(day);
        })
        response.status(200).json(weatherSummaries);
    }).catch(err=>errorHandler(err,request,response));
}


// HELPER FUNCTIONS
function notFoundHandler(request,response){
    response.status(404).send('Error 404: URL Not found.')
}
function errorHandler (error,request,response){
    response.status(500).send('SORRY AN ERROR OCCURED'+error);
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



app.listen(PORT, () => console.log(`the server is up and running on ${PORT}`));