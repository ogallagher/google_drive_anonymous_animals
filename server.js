/*

Owen Gallagher <ogallagher>
10 June 2021

Google Drive Anonymous Animals collector server.

*/

try {
	const express = require('express')
	const bodyparser = require('body-parser')
	const cors = require('cors')
	const cp = require('child_process')
	const colors = require('colors')
	
	// constants
	
	// const port = process.env.app_port || 80 // cloudnode
	const port = process.env.PORT || 80 // vercel
	
	// cross origin request origins
	const origins = [
		'http://localhost',	'http://127.0.0.1',		// local testing (same device)
		'http://anonymousanimals.cloudno.de'		// free hosting
	]
	
	const PUBLIC_DIR = './public'
	const ZOO_PATH = `${PUBLIC_DIR}/zoo.json`
	const ZOOKEEPER_PATH = __dirname + '/zookeeper.js'
	
	// server instance
	const server = express()
	
	// main
	
	// handle POST request data with bodyparser
	server.use(bodyparser.json())
	server.use(bodyparser.urlencoded({
		extended: false,
		limit: '50mb'
	}))

	// enable cross-origin requests for same origin html imports
	server.use(cors({
		origin: function(origin,callback) {
			if (origin != null && origins.indexOf(origin) == -1) {
				console.log(`cross origin request failed for ${origin}`)
				return callback(new Error('CORS for origin ' + origin + ' is not allowed access.'), false)
			}
			else {
				return callback(null,true)
			}
		}
	}))
	
	server.set('port', port)
	
	// serve website from public/
	server.use(express.static(PUBLIC_DIR))
	
	// route root path to about page
	server.get('/', function(req,res,next) {
		console.log(`routing root path to /anonymous_animals.html`)
		res.sendFile(`${PUBLIC_DIR}/anonymous_animals.html`, {
			root: '.'
		})
	})
	
	// handle /zoo
	server.get('/zoo', function(req,res) {
		console.log('sending zoo')
		res.json(require(ZOO_PATH))
	})
	
	// http server
	server.listen(server.get('port'), on_start)
	
	// methods
	
	function on_start() {
		console.log('server running')
		
		// spawn_zookeeper()
	}
	
	function spawn_zookeeper() {
		// spawn zookeeper child process
		console.log('spawning zookeeper child process ' + ZOOKEEPER_PATH)
		let zookeeper = cp.spawn(`node`, [`${ZOOKEEPER_PATH}`], {
			stdio: 'pipe',
			detached: false,
			serialization: 'json'
		})
		zookeeper.stdout.on('data', (data) => {
		  console.log(`zookeeper: ${data}`.slice(0,-1).green)
		})
		zookeeper.stderr.on('data', (data) => {
		  console.error(`zookeeper: ${data}`.slice(0,-1).green)
		})
		zookeeper.on('close', (code) => {
		  console.log(`zookeeper exited with code ${code}`.slice(0,-1).green)
		})
	}
}
catch (err) {
	console.log(err)
	console.log('make sure you run the `npm install` command to get needed node modules first')
	process.exit(1)
}
