dumbdb.js
=========



summary
-------

dumbdb ain't couchdb.

it's an attempt to do the simplest nodb possible, using just core JS stuff.

each collection is a JS object used as a hash (duh).

collections are persisted to disk every n seconds.

_ids are auto generated if ommitted.

there are no _revs or attachments... or synchronization magic either.

you can spawn an http interface though, using [dumbdb_srv](https://github.com/JosePedroDias/dumbdb_srv)! :)

otherwise, you get an in-process kinda-db-thingy. if so, be careful since dumb doesn't clone given objects by default.

does it scale? probably not. what's the purpose? fun and a little bit of learning. KISS was the main concern here.



api
---

the require returns a function which can receive configuration options, namely:

  * saveEveryNSeconds  (defaults to 5)
  * rootDir            (defaults to __dirname, i.e., the current directory)
  * verbose            (defaults to false)

from that, you can either open or create a collection. (will be stored as `<collection_name>.ddb`)

once you create/open a collection you get this interface:

`{Boolean} exists({String} id)`

`{Object|null} get({String} id)`

`{Object} put({Object} o)`

`{Object[]} all()`

`{Object[]} mapReduce({Function({Object} doc, [{Function({String} key, {Array} values)})`

the mapping function must invoke `this.emit(key, value)` to publish rows.
reduction is optional. there are some auxiliary methods to aid in common reductions (`this.sum(arr)`, `this.factor(arr)`, `this.avg(arr)`).
