(function() {

    /*jshint */
    /*global */

    var fs = require('fs');


    var t;
    var start = function() {
        t = new Date().valueOf();
    };

    var stop = function(msg) {
        console.log(msg, (new Date().valueOf() - t));
    };



    var CFG = {
        saveEveryNSeconds: 5,
        rootDir:           __dirname
    };

    var dumbdb = function(cfg) {

        if (cfg) {
            if ('saveEveryNSeconds' in cfg) { CFG.saveEveryNSeconds = cfg.saveEveryNSeconds; }
        }

        var get = function(id) {
            return this._d[id];
            // var o = this._d[key];
            // return o ? this._clone(o): o;
        };

        var put = function(o) {
            //o = this._clone(o);
            if (!('_id' in o)) { o._id = this._getId(); }
            this._d[o._id] = o;
            this._isDirty = true;
            return o;
        };

        var del = function(id) {
            if (!this._d[id]) {
                return false;
            }
            delete this._d[id];
            this._isDirty = true;
            return true;
        };

        var exists = function(id) {
            return !!this._d[id];
        };

        var all = function() {
            var res = [];

            for (var id in this._d) {
                res.push( this._d[id] );
            }

            return res;
        };

        var sum = function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r;
        };

        var factor = function(arr) {
            var r = 1;
            for (var i = 0, f = arr.length; i < f; ++i) { r *= arr[i]; }
            return r;
        };

        var avg = function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r / f;
        };

        // map(doc) { emit(...)}
        // reduce(row, accum)
        var mapReduce = function(map, reduce) {
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
        };

        var close = function() {
            clearInterval(this._timer);
            delete this._timer;
            this._save();
        };

        var _getId = function() {
            var id;
            /*do {
                id = Math.floor( Math.random() * Math.pow(32, 6) ).toString(32);
            } while (this._d[id]);*/

            do {
                id = (++this._lastId).toString(32);
            } while (this._d[id]);
            return id;
        };

        var _save = function(cb) {
            if (!this._isDirty) { return cb ? cb(null) : null; }
            start();
            fs.writeFile(this._fn, JSON.stringify(this._d), function(err) {
            //fs.writeFile(this._fn, JSON.stringify(this._d, null, '\t'), function(err) {
                if (err) { return cb ? cb(err) : err; }
                this._isDirty = false;
                stop('Saved ' + this._fn + ' in %d ms having ' + Object.keys(this._d).length + ' items.');
            }.bind(this));
        };

        var _clone = function(o) {
            return JSON.parse( JSON.stringify(o) );
        };

        var o = {
            create: function(fn, cb) {
                fn = fn + '.ddb';

                var O = {
                    _fn:        fn,
                    _d:         {},
                    _isDirty:   true,
                    _lastId:    0,

                    _getId:     _getId,
                    _save:      _save,
                    _clone:     _clone,

                    sum:        sum,
                    factor:     factor,
                    avg:        avg,

                    get:        get,
                    put:        put,
                    del:        del,
                    exists:     exists,
                    all:        all,
                    mapReduce:  mapReduce,
                    close:      close
                };

                fs.stat(fn, function(err, stats) {
                    if (!err) { return cb('file already exists!'); }

                    O._save();

                    cb(null, O);

                    O._timer = setInterval(O._save.bind(O), CFG.saveEveryNSeconds * 1000);
                });
            },

            open: function(fn, cb) {
                fn = fn + '.ddb';
                start();
                fs.readFile(fn, function(err, data) {
                    if (err) { return cb(err); }

                    try {
                        data = JSON.parse(data);
                    } catch (ex) {
                        return cb(ex);
                    }

                    stop('Loaded ' + fn + ' in %d ms having ' + Object.keys(data).length + ' items.');

                    var O = {
                        _fn:        fn,
                        _d:         data,
                        _isDirty:   false,
                        _lastId:    0,

                        _getId:     _getId,
                        _save:      _save,
                        _clone:     _clone,

                        sum:        sum,
                        factor:     factor,
                        avg:        avg,

                        get:        get,
                        put:        put,
                        del:        del,
                        exists:     exists,
                        all:        all,
                        mapReduce:  mapReduce,
                        close:      close
                    };

                    cb(null, O);

                    O._timer = setInterval(O._save.bind(O), CFG.saveEveryNSeconds * 1000);
                });
            }
        };

        return o;
    };

    module.exports = dumbdb;

})();