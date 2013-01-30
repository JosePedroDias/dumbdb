# dumbdb.js



## summary

dumbdb ain't couchdb.

it's an attempt to do the simplest nodb possible, using just core JS stuff.

each collection is a JS object used as a hash (duh).

collections are persisted to disk every n seconds.

_ids are auto generated if ommitted.

there are no _revs or attachments... or synchronization magic either.

you can spawn an http interface though, using [dumbdb_srv](https://github.com/JosePedroDias/dumbdb_srv)! :)

otherwise, you get an in-process kinda-db-thingy. if so, be careful since dumb doesn't clone given objects by default.

does it scale? probably not. what's the purpose? fun and a little bit of learning. KISS was the main concern here.



## API

### require

the require returns a function which can receive configuration options, namely:

  * `saveEveryNSeconds`  (defaults to 5)
  * `rootDir`            (defaults to __dirname, i.e., the current directory collections are read/saved to)
  * `verbose`            (defaults to false, iif true prints out additional info to stdout)
  * `timestamps`         (defaults to true, sets _createdAt and _modifiedAt keys on objects)

`var dumbdb = require('dumbdb')({verbose:true});`



### create and open collection

from that, you can either open or create a collection. (will be stored as `<collection_name>.ddb`)

`dumbdb.create({String} collectionName, [{Boolean} openIfExistent], Function({String} err, {Collection} coll))`

`dumbdb.open({String} collectionName, [{Boolean} createIfInexistent], Function({String} err, {Collection} coll))`



### collection methods

once you create/open a collection you get this interface:

`{Boolean} <coll>.exists({String} id)`

`{Object|null} <coll>.get({String} id)`

`{Object} <coll>.put({Object} o)`

`{Object[]} <coll>.all()`

`{Object[]} <coll>.mapReduce({Function({Object} doc, [{Function({String} key, {Array} values)})`

the mapping function must invoke `this.emit(key, value)` to publish rows.
reduction is optional.
there are some auxiliary methods to aid in common reductions (`this.sum(arr)`, `this.factor(arr)`, `this.avg(arr)`).
