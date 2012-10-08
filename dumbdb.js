(function() {

    'use strict';

    

    /*jshint node:true */
    /*global */

    var fs = require('fs');


    var t;
    var start = function() {
        t = new Date().valueOf();
    };

    var stop = function(msg) {
        console.log(msg, (new Date().valueOf() - t));
    };



    var defaults = function(defaults, opts) {
        if (!opts) { opts = {}; }
        for (var k in defaults) {
            if (!(k in opts)) {
                opts[k] = defaults[k];
            }
        }
        return opts;
    };



    var DumbdbCollection = function(name, path, data, cfg) {
        this._name = name;
        this._path = path;
        this._d    = data;
        this._cfg  = cfg;
        this._boundSave = this._save.bind(this);

        this._timer = setInterval(this._boundSave, this._cfg.saveEveryNSeconds * 1000);
    };

    DumbdbCollection.prototype = {

        _timer:    undefined,
        _name:     undefined,
        _path:     undefined,
        _d:        {},
        _isDirty:  false,
        _lastId:   0,

        get: function(id) {
            return this._d[id];
        },

        put: function(o) {
            if (!('_id' in o)) { o._id = this._getId(); }
            this._d[o._id] = o;
            this._isDirty = true;
            return o;
        },

        del: function(id) {
            if (!this._d[id]) {
                return false;
            }
            delete this._d[id];
            this._isDirty = true;
            return true;
        },

        exists: function(id) {
            return !!this._d[id];
        },

        all: function() {
            var res = [];

            for (var id in this._d) {
                res.push( this._d[id] );
            }

            return res;
        },

        mapReduce: function(map, reduce) {
            var id, res;

            if (!reduce) {
                this._res = [];

                this.emit = function(k, v) {
                    this._res.push(v);
                };

                this._map = map;
                for (id in this._d) {
                    this._map( this._d[id] );
                }
                res = this._res;
                delete this._map;
                delete this._res;
                return res;
            }

            this._res = {};

            this.emit = function(k, v) {
                if (k in this._res) { return this._res[k].push(v); }
                this._res[k] = [v];
            };

            this._map = map;
            for (id in this._d) {
                this._map( this._d[id] );
            }
            res = this._res;

            var res2 = {};
            this._reduce = reduce;
            for (var k in res) {
                res2[k] = this._reduce(k, res[k]);
            }
            delete this._map;
            delete this._reduce;
            delete this._res;
            return res2;
        },

        close: function() {
            clearInterval(this._timer);
            delete this._timer;
            this._dying = true;
            this._save();
            var warn = function() { throw 'Performed operation on a closed collection!'; };
            this.get = warn;
            this.put = warn;
            this.mapReduce = warn;
            this.exists = warn;
            this.del = warn;
            this.all = warn;
        },



        //// PRIVATES ////
        
        _getId: function() {
            var id;
            /*do {
                id = Math.floor( Math.random() * Math.pow(32, 6) ).toString(32);
            } while (this._d[id]);*/

            do {
                id = (++this._lastId).toString(32);
            } while (this._d[id]);
            return id;
        },

        _save: function(cb) {
            if (!this._isDirty) { return cb ? cb(null) : null; }
            if (this._cfg.verbose) { start(); }
            this._isDirty = false;
            fs.writeFile(this._path, JSON.stringify(this._d), function(err) {
            //fs.writeFile(this._path, JSON.stringify(this._d, null, '\t'), function(err) {
                if (err) { return cb ? cb(err) : err; }
                if (this._cfg.verbose) {
                    stop('Saved ' + this._name + ' in %d ms having ' + Object.keys(this._d).length + ' items.');
                }
                if (this._dying) {
                    delete this._d;
                }
            }.bind(this));
        },



        //// REDUCE UTILITIES ////

        sum: function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r;
        },

        factor: function(arr) {
            var r = 1;
            for (var i = 0, f = arr.length; i < f; ++i) { r *= arr[i]; }
            return r;
        },

        avg: function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r / f;
        }

    };



    var Dumbdb = function(cfg) {
        this._cfg = defaults({
            saveEveryNSeconds:  5,
            rootDir:            __dirname,
            verbose:            false
        }, cfg);
    };

    Dumbdb.prototype = {

        _collections: {},

        _init: function(collName, isOpening, allowFallback, cb) {
            if (collName in this._collections) {
                return cb(null, this._collections[collName]);
            }

            var path = [this._cfg.rootDir, '/', collName, '.ddb'].join('');
            var data, coll;

            var that = this;

            var thenDo = function(data) {
                coll = new DumbdbCollection(collName, path, data || {}, that._cfg);
                that._collections[collName] = coll;

                if (!isOpening) { coll._save(); }

                return cb(null, coll);
            };

            if (isOpening) {

                if (this._cfg.verbose) { start(); }

                fs.readFile(path, function(err, data) {
                    if (err) {
                        if (allowFallback) {
                            if (that._cfg.verbose) {
                                console.log('called open() on inexistent collection, creating instead...');
                            }
                            return thenDo();
                        }

                        return cb('Problem reading collection ' + collName + '!');
                    }

                    try {
                        data = JSON.parse(data);
                    } catch (ex) {
                        return cb('Problem parsing data from collection ' + collName + '!');
                    }

                    if (that._cfg.verbose) {
                        stop('Loaded ' + collName + ' in %d ms having ' + Object.keys(data).length + ' items.');
                    }

                    thenDo(data);
                });
            }
            else {
                fs.stat(path, function(err, stats) {
                    if (err) {
                        if (!allowFallback) {
                            return cb('Collection ' + collName + ' already exists!');
                        }
                        else {
                            if (that._cfg.verbose) {
                                console.log('called create() on existing collection, opening instead...');
                            }
                            return this._init(collName, true, false, cb);
                        }
                    }

                    thenDo();
                });
            }
        },

        create: function(collName, openIfExistent, cb) {
            if (!cb) {
                cb = openIfExistent;
                openIfExistent = false;
            }
            this._init(collName, false, openIfExistent, cb);
        },

        open: function(collName, createIfInexistent, cb) {
            if (!cb) {
                cb = createIfInexistent;
                createIfInexistent = false;
            }
            this._init(collName, true, createIfInexistent, cb);
        }
    };

    

    var dumbdb = function(cfg) {
        return new Dumbdb(cfg);
    };



    module.exports = dumbdb;

})();