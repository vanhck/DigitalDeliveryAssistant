const express = require('express')
var mysql = require('mysql');
var googleMapsClient = require('@google/maps').createClient({
  key:'AIzaSyDvKst18hM40EO98NeMeEFNxRnbegx_kQI'
});

const app = express();

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "hackvans"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Database connected.");
});

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


	
app.get('/customerData', function (req, res) {
	//res.send(req.params.customerId);
	callback = function(response){
		res.send(response);
	}
	con.query("SELECT * FROM empfeanger", function (err, result) {
		var resData = {};
		resData.id = result[0].ID;
		resData.vorname = result[0].NAME;
		resData.nachname = result[0].NACHNAME;
		resData.coins = 100;
		resData.deliverys = 3;
		resData.pickUp_person = {"lat":80.12304846, "lng": 7.123984211};
		resData.car_parking = {"lat":82.14104846, "lng":  8.100984211};
		callback(resData);
	})
})

app.listen(3000, function () {
  console.log('Server listening on port 3000!')
})