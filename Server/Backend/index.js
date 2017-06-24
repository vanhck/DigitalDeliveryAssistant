const express = require('express');
var bodyParser = require('body-parser');

var mysql = require('mysql');
var googleMapsClient = require('@google/maps').createClient({
  key:'AIzaSyDvKst18hM40EO98NeMeEFNxRnbegx_kQI'
});

const app = express();
dataUpdated = false;

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

app.get('/update/:id/:status', function (req, res) {
	dataUpdated = true;
	console.log("update called.");
	callback = function(response){
		res.send(response);
	}
	console.log(req.params.id  + " " + req.params.status);
	con.query("UPDATE `stack` SET `status` = \"" + req.params.status + "\" WHERE `id` = \"" +req.params.id +"\"", function (err, result) {
		if(err){
			callback(err);
		}else{
			callback("success");
		}
		
	})
})

app.use(bodyParser.json());
app.use(function (req, res, next) {
  next()
})
app.post("/addOnTheGoPackage", function(req, res){
	//req.body.
	dataUpdated = true;
	con.query(
		"INSERT INTO `stack`( `EMPFEANGER_ID`, `ABLAGEORG_LAT`, `ABLAGEORG_LNG`, `PARKHINWEIS_LAT`, `PARKHINWEIS_LNG`, `STATUS`, `APPRAISED_ARRIVAL`, `ACTUAL_ARRIVAL`, `addresse_on_the_go`) VALUES ("+
		""+ req.body.empfeanger_id + ","+
		""+ req.body.ablageort_lat + ","+
		""+ req.body.ablageort_lng + ","+
		""+ req.body.parkhinweis_lat + ","+
		""+ req.body.parkhinweis_lng + ","+
		"\""+ "pending" + "\","+
		"\""+ "2017-06-24 16:45:38" + "\","+
		"\""+ "0000-00-00 00:00:1" + "\","+
		"\""+ req.body.addresse_on_the_go + "\""+
		")", function (err, result) {
			console.log(err);
		});

	res.send("sucess");
});

app.get('/isUpdate', function (req, res) {
	res.send(dataUpdated);
	dataUpdated = false;
})
app.get('/update', function (req, res) {
	dataUpdated = true;
	res.send("data updated.");
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

app.get('/driverStatus/:lat?/:lng?', function (req, res) {
	//res.send(req.params.customerId);
	console.log("driver status called.");
	
	curLat = (req.params.lat)? req.params.lat: 80.12304846;
	curLng = (req.params.lng)? req.params.lng: 7.123984211;
	callback = function(response){
		res.send(response);
	}
	calculateDestinations = function(destinations){
		//destinations.push("Wiesloch Albert-Schweitzer-Schtrasse 02");
		console.log(destinations);
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
				  
			var possibilities = [];
			for(var i = 0; i < response.json.destination_addresses.length; i++){
				possibilities.push({"i":i,"description":response.json.destination_addresses[i]});
			}
				
				kombiX = [];
				for(var x = 0; x < response.json.origin_addresses.length; x++){
					kombiY = [];
					for(var y = 0; y < response.json.destination_addresses.length; y++){
						kombiY.push({"score":response.json.rows[x].elements[y].duration.value,"time":response.json.rows[x].elements[y].duration.text,"distance":response.json.rows[x].elements[y].distance.text});
					}
					kombiX.push(kombiY);
				}
				
				var result = [];
				  // Permutate [1, 2, 3], pushing every permutation onto result[]
				  permutate(possibilities, function (a) {
					// Create a copy of a[] and add that to result[]
					result.push(a.slice(0));
				  });
				
				var best = {score:-1, points:[], distance:"", time:""};
				for(var i = 0; i < result.length; i++){
					
					if(best.score == -1){
						best.points = result[i];
						best.score = 0;
						for(var j = 0; j < result[i].length-1; j++){
							best.score += kombiX[result[i][0+j].i][result[i][1+j].i].score;
							best.points[j].time = kombiX[result[i][0+j].i][result[i][1+j].i].time;
							best.points[j].distance = kombiX[result[i][0+j].i][result[i][1+j].i].distance;
							best.points[j].socre = kombiX[result[i][0+j].i][result[i][1+j].i].score;
						}
					}else{
						var concScore = 0;
						for(var j = 0; j < result[i].length-1; j++){
							concScore += kombiX[result[i][0+j].i][result[i][1+j].i].score;
							
						}
						if(concScore<best.score){
							best.points = result[i];
							best.score = concScore;
							for(var j = 0; j < best.points.length-1; j++){
								best.points[j].time = kombiX[result[i][0+j].i][result[i][1+j].i].time;
								best.points[j].distance = kombiX[result[i][0+j].i][result[i][1+j].i].distance;
								best.points[j].score = kombiX[result[i][0+j].i][result[i][1+j].i].score;
							}
						}
						
						
					}
				}
				
				//callback({"a":kombiX,"b": result, "c": best, "result[i][0].i":result[0][0].i ,"result[i][1].i":result[0][1].i});
				var destinations_fastest = [];
				var date = new Date();
				var timeStamp = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
				for(var i = 0; i < best.points.length;i++){
					var futureDate = new Date(Date.now() + (1000*best.points[i].score%60 /*sec*/ * 60*best.points[i].score/60 /*min*/ * 60*best.points[i].score/3600))
					destinations_fastest.push({
						"feasibilityScore":best.score,
						"description":best.points[i].description,
						"time" : best.points[i].time,
						"distance" : best.points[i].distance,
						"arival_time":"",
						"estimated_arrival_time":best.points[i].score? futureDate.getFullYear() + "-" + (futureDate.getMonth()+1) + "-" + futureDate.getDate() + "T" + futureDate.getHours() + ":" + futureDate.getMinutes() + ":" + date.getSeconds() : "",
						"appraised_arrivalTime":"2017-06-24T" +(12*i) +":45:12"
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
				strasse : result[i].addresse_on_the_go ? result[i].addresse_on_the_go : result[i].STRASSE + " " + result[i].HAUS_NR ,
				postleitzahl :result[i].PLZ,
				ort :result[i].WOHNORT,
				status: result[i].STATUS,
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