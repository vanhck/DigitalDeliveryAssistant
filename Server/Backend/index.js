const express = require('express')
var mysql = require('mysql');
var googleMapsClient = require('@google/maps').createClient({
  key:'AIzaSyDvKst18hM40EO98NeMeEFNxRnbegx_kQI'
});

const app = express();

app.get('/', function (req, res) {
	googleMapsClient.distanceMatrix(
		{
			origins: [[-33.7032647,151.0962581], 'Chatswood Station, NSW'],
			destinations: ['Central Station, NSW', 'Parramatta Station, NSW'],
			language: 'en',
			units: 'metric',
			region: 'au'
		},
		function(results, response) {
			console.log(results);
			res.send(response.json.rows);
			
			console.log(response.json.rows[0].elements[0]);
		}
	);
})

app.listen(80, function () {
  console.log('Server listening on port 80!')
})