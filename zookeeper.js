/*

Owen Gallagher
10 June 2021

*/

const fs = require('fs')
const { loadImage } = require('canvas')

const parentPort = null

const PUBLIC_DIR = './public'
const ZOO_PATH = `${PUBLIC_DIR}/zoo.json`

const IMG_PROTOCOL = 'https://'
const IMG_SERVER_ADDR = 'ssl.gstatic.com'
const IMG_PATH = '/docs/common/profile/'
const IMG_SIZE = 'lg'
const IMG_FORMAT = 'png'
const IMG_PREFIX = `${IMG_PROTOCOL}${IMG_SERVER_ADDR}${IMG_PATH}`
const IMG_SUFFIX = `_${IMG_SIZE}.${IMG_FORMAT}`

const alphabet = 'abcdefghijklmnopqrstuvwxyz '.split('')
const ANIMAL_LEN_MAX = 3

let zoo = require(ZOO_PATH)

function zookeeper() {
	console.log(zoo)
	
	let writer = setInterval(write_zoo, 10 * 1000)
	
	let promises = []
	
	for (let animal of zoo) {
		let animal_local = animal
		let p = animal_to_url(animal_local)
		.then(animal_done)
		.catch(function() {
			console.log(`known animal failed ${animal_local}`)
			return Promise.resolve()
		})
	
		promises.push(p)
	}
	
	return Promise.all(promises)
	.then(discover_animals)
	.then(function() {
		clearInterval(writer)
		write_zoo()
		console.log('zookeeper finished')
	})
}

function animal_to_url(animal) {
	if (animal) {
		// concat prefix + animal + suffix
		let url = `${IMG_PREFIX}${animal}${IMG_SUFFIX}`
		
		return new Promise(function(resolve,reject) {
			try {
				loadImage(url)
				.then(function(img) {
					delete img
					console.log(`valid url: ${url}`)
					resolve([animal,url])
				})
				.catch(function() {
					reject([animal,url])
				})
			}
			catch (err) {
				console.log('img url test error: ' + err)
				reject([animal,url])
			}
		})
	}
	else {
		Promise.reject(animal)
	}
}

function animal_done(animal_url) {
	let animal_name = animal_url[0]
	let img_url = animal_url[1]
	
	if (zoo.indexOf(animal_name) == -1) {
		zoo = zoo + animal_name
		console.log(`added new animal ${animal_name} to zoo`)
	}
	else {
		console.log(`skipped known animal ${animal_name} at ${img_url}`)
	}
}

function discover_animals() {
	return new Promise(function(resolve) {
		let promises = []
		
		// for each name length
		for (let len=3; len<=ANIMAL_LEN_MAX; len++) {
			let p = new Promise(function(resolve) {
				let promises = []
				let name_arrs = combinations(alphabet, len)
				console.log(`check ${name_arrs.length} names of length ${len}`)
				
				for (let i=0; i<name_arrs.length; i++) {
					let name_arr = name_arrs[i]
					let animal = name_arr.join('')
					
					if (i % 1000 == 0) {
						console.log(`${i}: ${animal}`)
					}
					
					promises.push(
						animal_to_url(animal)
						.then(animal_done)
						.catch(function(animal_url) {
							// ignore
						})
						.finally(function() {
							return Promise.resolve()
						})
					)
				}
				
				Promise.all(promises)
				.then(resolve)
			})
			
			promises.push(p)
		}
		
		Promise.all(promises)
		.then(resolve)
	})
}

function combinations(options,places) {
	if (places <= 1) {
		let c = []
		for (let o of options) {
			c.push([o])
		}
		
		return c
	}
	else {
		let c = []
		
		for (let o of options) {
			for (let subc of combinations(options,places-1)) {
				c.push([o].concat(subc))
			}
		}
		
		return c
	}
}

function write_zoo() {
	fs.writeFile(ZOO_PATH, JSON.stringify(zoo), {encoding: 'utf8'}, function(err) {
		if (err) {
			console.log('zoo write error: ' + err)
		}
		else {
			console.log('wrote zoo of length ' + zoo.length)
		}
	})
}

// spawned as worker thread
console.log('spawned as zookeeper worker')

zookeeper()
.then(function() {
	parentPort.postMessage('zookeeper done')
})