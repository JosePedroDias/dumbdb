var d = require('./dumbdb')({
	verbose: true,
	rootDir: __dirname + '/bogusDir'
});

d.open('coll', function(err, coll) {
	if (err) { return console.log(err); }
	console.log(coll);
});
