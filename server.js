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
	const fs = require('fs/promises')
	const path = require('path')
	
	// constants
	require('dotenv').config({
		override: true
	})
	
	const port = process.env.PORT || 80
	const BASE_PATH = process.env.BASE_PATH || ''
	
	// cross origin request origins
	const origins = [
		// local testing (same device)
		'http://localhost',	'http://127.0.0.1',
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
	server.use(BASE_PATH, express.static(PUBLIC_DIR))

	if (BASE_PATH.length > 0) {
		fs.readdir(`${PUBLIC_DIR}/img`)
		.then((imgFiles) => {
			for (const imgFile of imgFiles) {
				server.get(`/img/${imgFile}`, function(_req, res) {
					res.sendFile(path.resolve(`${PUBLIC_DIR}/img/${imgFile}`))
				})
			}
		})

		for (const rootFile of ['manifest.json', 'browserconfig.xml']) {
			server.get(`/${rootFile}`, function(_req, res) {
				res.sendFile(path.resolve(`${PUBLIC_DIR}/${rootFile}`))
			})
		}
	}
	
	// route root path to about page
	server.get(`${BASE_PATH}/`, function(req,res,next) {
		console.log(`routing root=${BASE_PATH} path to /anonymous_animals.html`)
		res.sendFile(`${PUBLIC_DIR}/anonymous_animals.html`, {
			root: '.'
		})
	})
	
	// handle /zoo
	server.get(`${BASE_PATH}/zoo`, function(req,res) {
		console.log('sending zoo')
		res.json(require(ZOO_PATH))
	})
	
	// http server
	server.listen(server.get('port'), on_start)
	
	// methods
	
	function on_start() {
		console.log(`server running at path=${BASE_PATH} port=${port}`)
		
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
