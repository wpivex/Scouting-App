// const { Pool } = require('pg');
// var connectionString = 'postgresql://postgres:wpivexu@localhost:5432/testdata';
// // const pool = new Pool({
  // // connectionString: process.env.DATABASE_URL,
  // // ssl: {
    // // rejectUnauthorized: true
  // // }
// // });
// const pool = new Pool({
    // connectionString: 'postgresql://postgres:wpivexu@localhost:5432/testdata',
    // ssl: process.env.DATABASE_URL ? true : false
// })

const express = require('express')
const path = require('path')
const idb = require('idb-keyval');
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post("/getMatch", bodyParser.json(), function(req, res) {
	  idb.get(req.body.matchKey).then(
		val => {
			console.log(val);
			res.json(val);
		});
	})
  .post("/storeMatch", bodyParser.json(), function(req, res) {
	  idb.set('vex', req.body.matchVal).then(() => console.log('It worked!')).catch(err => console.log('It failed!', err));
	})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
