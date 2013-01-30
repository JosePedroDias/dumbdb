//var d = require('dumbdb')({
var d = require('./dumbdb')({
	verbose: true,
	//rootDir: __dirname + '/bogusDir'
});

d.open('person', function(err, coll) {
	if (err) { return console.log(err); }
	console.log(coll);
});
