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
	console.log("customer data called.");
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

app.get('/driverStatus', function (req, res) {
	//res.send(req.params.customerId);
	console.log("driver status called.");
	curLat = 80.12304846;
	curLng = 7.123984211;
	callback = function(response){
		res.send(response);
	}
	calculateDestinations = function(destinations){
		/*arrayDestinations = [];
		for(var o = 0; o < destinations.length; o++){
			arrayDestinations.push([
				destinations[o].lat,
				destinations[o].lng,
			])
		}*/
		googleMapsClient.distanceMatrix(
			{
				origins: destinations,
				destinations: destinations,
				language: 'de',
				units: 'metric',
				region: 'au'
			},
			function(results, response) {
				
				function permutate(array, callback) {
					// Do the actual permuation work on array[], starting at index
					function p(array, index, callback) {
					  // Swap elements i1 and i2 in array a[]
					  function swap(a, i1, i2) {
						var t = a[i1];
						a[i1] = a[i2];
						a[i2] = t;
					  }

					  if (index == array.length - 1) {
						callback(array);
						return 1;
					  } else {
						var count = p(array, index + 1, callback);
						for (var i = index + 1; i < array.length; i++) {
						  swap(array, i, index);
						  count += p(array, index + 1, callback);
						  swap(array, i, index);
						}
						return count;
					  }
					}
					if (!array || array.length == 0) {
					  return 0;
					}
					return p(array, 0, callback);
				  }
				  
				var possibilities = [
					{"i":0,"description":response.json.destination_addresses[0]},
					{"i":1,"description":response.json.destination_addresses[1]},
					{"i":2,"description":response.json.destination_addresses[2]}
				]
				kombiX = [];
				for(var x = 0; x < response.json.origin_addresses.length; x++){
					kombiY = [];
					for(var y = 0; y < response.json.destination_addresses.length; y++){
						kombiY.push(response.json.rows[x].elements[y].duration.value);
					}
					kombiX.push(kombiY);
				}
				
				var result = [];
				  // Permutate [1, 2, 3], pushing every permutation onto result[]
				  permutate(possibilities, function (a) {
					// Create a copy of a[] and add that to result[]
					result.push(a.slice(0));
				  });
				
				var best = {score:-1, points:[]};
				for(var i = 0; i < result.length; i++){
					
					if(best.score == -1){
						best.points = result[i];
						best.score = kombiX[result[i][0].i][result[i][1].i] + kombiX[result[i][1].i][result[i][2].i] ;
					}else if(kombiX[result[i][0].i][result[i][1].i] + kombiX[result[i][1].i][result[i][2].i]<best.score){
						best.points = result[i];
						best.score = kombiX[result[i][0].i][result[i][1].i] + kombiX[result[i][1].i][result[i][2].i]
					}
				}
				
				//callback({"a":kombiX,"b": result, "c": best, "result[i][0].i":result[0][0].i ,"result[i][1].i":result[0][1].i});
				var destinations_fastest = [];
				for(var i = 0; i < best.points.length;i++){
					destinations_fastest.push({
						"description":best.points[i].description,
						"arival_time":"",
						"estimated_arrival_time":"2017-06-24:" +(11*i) + ":42:12",
						"appraised_arrivalTime":"2017-06-24:" +(12*i) +":45:12"
						});
				}
				callback(destinations_fastest);
			}
		);
	}
	con.query("SELECT * FROM empfeanger INNER JOIN stack ON empfeanger.id = stack.empfeanger_id", function (err, result) {
		var resData = [];
		var destinations = [];
		for(var i = 0; i < result.length; i++){
			resData.push({
				id :result[i].ID,
				name :result[i].NACHNAME,
				vorname :result[i].NAME,
				strasse :result[i].STRASSE + " " + result[i].HAUS_NR ,
				postleitzahl :result[i].PLZ,
				ort :result[i].WOHNORT,
				date :"2017-06-24",
				predicted :"2017-06-24T00:46:28.000Z",
				estimated :"2017-06-24T00:46:28.000Z",
				latitude :result[i].ABLAGEORG_LAT,
				longitude :result[i].ABLAGEORG_LNG,
				driver :'Hacker Klaus'
			});
			destinations.push(result[i].WOHNORT + " " + result[i].STRASSE+ " " + result[i].HAUS_NR);
		}
		console.log(destinations);
		calculateDestinations(destinations);
	})
})

app.get('/destinations', function (req, res) {
	console.log("destinations called.");
	callback = function(response){
		res.send(response);
	}
	con.query("SELECT * FROM empfeanger INNER JOIN stack ON empfeanger.id = stack.empfeanger_id", function (err, result) {
		var resData = [];
		for(var i = 0; i < result.length; i++){
			resData.push({
				id :result[i].ID,
				name :result[i].NACHNAME,
				vorname :result[i].NAME,
				strasse :result[i].STRASSE + " " + result[i].HAUS_NR ,
				postleitzahl :result[i].PLZ,
				ort :result[i].WOHNORT,
				date :"2017-06-24",
				predicted :"2017-06-24T00:46:28.000Z",
				estimated :"2017-06-24T00:46:28.000Z",
				latitude :result[i].ABLAGEORG_LAT,
				longitude :result[i].ABLAGEORG_LNG,
				driver :'Hacker Klaus'
			});
		}
		callback(resData);
	})
})

app.listen(3000, function () {
  console.log('Server listening on port 3000!')
})