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

app.post("/storeMatch", bodyParser.json(), function(req, res) {
  set('vex', req.body.matchVal).then(() => console.log('It worked!')).catch(err => console.log('It failed!', err));
});

app.post("/getMatch", bodyParser.json(), function(req, res) {
  get(req.body.matchKey).then(
	val => {
		console.log(val);
		res.json(val);
	});
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
	  // const result = await client.query('SELECT current_database()');
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
