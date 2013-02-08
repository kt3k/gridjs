'ユニコード';
/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://opensource.org/licenses/MIT )
 */

window.grid = (function (window) {
    'use strict';

    // utility for periodic metrics
    var period = function (table) {
        var index = 0;
        var length = table.length;
        return {
            up: function () {
                index += 1;
                index %= length;
                return this.value();
            },
            down: function () {
                index += length - 1;
                index %= length;
                return this.value();
            },
            value: function () {
                return table[index];
            }
        };
    };

    // constructor
    var grid = function (i, j, parent) {
        this.row = this.rowToGo = i;
        this.col = this.colToGo = j;
        this.parent = parent;

        this.div = window.div({
            position: 'absolute',
            left: 0,
            top: 0,
            width: this.parent.GRID_SIZE + 'px',
            height: this.parent.GRID_SIZE + 'px',
            webkitTransitionDuration: '500ms'
        });

        this.commitDelay = 0;

        this.periodic = {};
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;

        parent.metricsExcited || (parent.metricsExcited = []);

        this.resetXY();

        this.div.grid = this;

        this.met = this.div.met;
        this.dom = this.div.dom;
    };

    var pt = grid.prototype;

    grid.prototype.resetXY = function () {
        this.div.setY(this.parent.GRID_LEVEL * this.row + this.parent.TOP_MARGIN);
        this.div.setX(this.parent.GRID_LEVEL * this.col + this.parent.LEFT_MARGIN);
        this.exciteMetrics();
    };

    grid.metricsChange = function (callback) {
        return function () {
            var args = arguments;
            return function () {
                callback.apply(this, args);
                this.exciteMetrics();
                return this;
            };
        };
    };

    grid.periodicMethod = function (key, dir) {
        return function () {
            this.div.met[key] = this.periodic[key][dir]();
            this.exciteMetrics();
            return this;
        };
    };

    grid.rotate = grid.metricsChange(function (deg) {
        this.div.addRot(deg);
    });

    grid.hue = grid.metricsChange(function (hue) {
        this.div.addHue(hue);
    });

    grid.prototype.exciteMetrics = function () {
        if (this.parent.metricsExcited.indexOf(this) === -1) {
            this.parent.metricsExcited.push(this);
        }
    };

    grid.prototype.rR = grid.rotate(90);
    grid.prototype.rL = grid.rotate(-90);

    grid.prototype.hR = grid.hue(60);
    grid.prototype.hL = grid.hue(-60);

    grid.prototype.sR = grid.periodicMethod('sat', 'up');
    grid.prototype.sL = grid.periodicMethod('sat', 'down');

    grid.prototype.lR = grid.periodicMethod('lum', 'up');
    grid.prototype.lL = grid.periodicMethod('lum', 'down');

    grid.prototype.cR = grid.periodicMethod('scale', 'up');
    grid.prototype.cL = grid.periodicMethod('scale', 'down');

    grid.prototype.commit = function () {
        this.parent.metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.row = grid.rowToGo;
                grid.col = grid.colToGo;
                grid.parent[grid.row][grid.col] = grid;
                grid.resetXY();
                grid.div.commit();
            }, Math.random() * grid.parent.COMMIT_DIFF + grid.commitDelay);
            grid.commitDelay = 0;
        });
        this.parent.metricsExcited = [];
        return this;
    };

    grid.next = function (r, c) {
        return function () {
            return this.parent[this.nextRow(r)][this.nextCol(c)];
        };
    };

    grid.prototype.nextRow = function (d) {
        return (this.row + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    grid.prototype.nextCol = function (d) {
        return (this.col + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    grid.prototype.appendTo = function (dom) {
        dom.appendChild(this.dom);
        return this;
    };

    grid.prototype.execute = function (cmd) {
        return this[cmd]();
    };

    grid.prototype.executeIterate = function (cmds) {
        return cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this);
    };

    grid.prototype.g1 = grid.next(1, -1);
    grid.prototype.g2 = grid.next(1, 0);
    grid.prototype.g3 = grid.next(1, 1);
    grid.prototype.g4 = grid.next(0, -1);
    grid.prototype.g6 = grid.next(0, 1);
    grid.prototype.g7 = grid.next(-1, -1);
    grid.prototype.g8 = grid.next(-1, 0);
    grid.prototype.g9 = grid.next(-1, 1);

    grid.prototype.gN = function () {
        return this.onLastCol() ? this.g3() : this.g6();
    };

    grid.prototype.onLastCol = function () {
        return this.col === this.parent.NUM_GRIDS - 1;
    };

    grid.delay = function (n) {
        return function () {
            this.commitDelay = 300 * n;
            this.exciteMetrics();
            return this;
        };
    };

    grid.prototype.d1 = grid.delay(1);
    grid.prototype.d2 = grid.delay(2);
    grid.prototype.d3 = grid.delay(3);
    grid.prototype.d4 = grid.delay(4);
    grid.prototype.d5 = grid.delay(5);
    grid.prototype.d6 = grid.delay(6);
    grid.prototype.d7 = grid.delay(7);
    grid.prototype.d8 = grid.delay(8);
    grid.prototype.d9 = grid.delay(9);

    grid.trans = function (r, c) {
        return function () {
            this.rowToGo = this.nextRow(r);
            this.colToGo = this.nextCol(c);
            return this;
        };
    };

    pt.t1 = grid.trans(1, -1);
    pt.t2 = grid.trans(1, 0);
    pt.t3 = grid.trans(1, 1);
    pt.t4 = grid.trans(0, -1);
    pt.t6 = grid.trans(0, 1);
    pt.t7 = grid.trans(-1, -1);
    pt.t8 = grid.trans(-1, 0);
    pt.t9 = grid.trans(-1, 1);

    pt.nop = function () {};

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}(window));



window.gridField = (function () {
    'use strict';

    var gridField = function (args) {
        this.init(args);
    };

    var pt = gridField.prototype;

    pt.init = function (args) {
        this.NUM_GRIDS = args.num;
        this.GRID_MARGIN = args.margin;
        this.LEFT_MARGIN = args.left;
        this.TOP_MARGIN = args.top;
        this.GRID_SIZE = args.size;
        this.GRID_LEVEL = this.GRID_SIZE + this.GRID_MARGIN;
        this.LEFT_LIMIT = this.LEFT_MARGIN - this.GRID_SIZE;
        this.TOP_LIMIT = this.TOP_MARGIN - this.GRID_SIZE;
        this.FIELD_SIZE = this.GRID_LEVEL * this.NUM_GRIDS;
        this.RIGHT_LIMIT = this.LEFT_MARGIN + this.FIELD_SIZE;
        this.BOTTOM_LIMIT = this.TOP_MARGIN + this.FIELD_SIZE;

        this.COMMIT_DIFF = args.diff;

        this.HUE_DEFAULT = args.hue;
        this.SAT_DEFAULT = args.sat;
        this.LUM_DEFAULT = args.lum;
    };

    pt.origin = function () {
        return this[0][0];
    };

    pt.born = function () {
        window.div.hue = this.HUE_DEFAULT;
        window.div.sat = this.SAT_DEFAULT;
        window.div.lum = this.LUM_DEFAULT;

        this.forEachGrid(function (i, j) {
            window.grid(i, j, this);
        });

        return this;
    };

    pt.commit = function () {
        this.origin().commit();
        return this;
    };

    pt.solidCommit = function () {
        this.forEachGrid(function (i, j) {
            this[i][j].div.commit();
        });

        return this;
    };

    pt.appendTo = function (dom) {
        this.forEachGrid(function (i, j) {
            this[i][j].appendTo(dom);
        });

        return this;
    };

    pt.forEachGrid = function (func) {
        for (var i = 0; i < this.NUM_GRIDS; i++) {
            for (var j = 0; j < this.NUM_GRIDS; j++) {
                func.call(this, i, j);
            }
        }
    };

    var COMMAND_SEPARATOR = '|';

    var mapper = function (mapping) {
        return function (x) {
            return mapping[x];
        };
    };

    var flattenJoin = function flattenJoin(array, sep) {
        if (!(array instanceof Array)) {
            return array;
        }

        return array.map(function (x) {
            return flattenJoin(x, sep);
        }).join(sep);
    };

    var reduceCommandsWithMapping = function (mapping, append) {
        return function (grid, routes) {
            routes = flattenJoin(routes, '');

            var commands = routes.split('')
            .map(mapper(mapping))
            .join(COMMAND_SEPARATOR)
            .split(COMMAND_SEPARATOR)
            .concat(append || []);

            return grid.executeIterate(commands);
        };
    };

    pt.reduceDelay = reduceCommandsWithMapping({
        '1': 'd1|gN',
        '2': 'd2|gN',
        '3': 'd3|gN',
        '4': 'd4|gN',
        '5': 'd5|gN',
        '6': 'd6|gN',
        '7': 'd7|gN',
        '8': 'd8|gN',
        '9': 'd9|gN',
        ' ': 'gN'
    });

    pt.reduceTranslate = reduceCommandsWithMapping({
        '↙': 't1|gN',
        '↓': 't2|gN',
        '↘': 't3|gN',
        '←': 't4|gN',
        '→': 't6|gN',
        '↖': 't7|gN',
        '↑': 't8|gN',
        '↗': 't9|gN',
        ' ': 'gN'
    });

    pt.reduceScales = reduceCommandsWithMapping({
        '↑': 'cR|gN',
        '↓': 'cL|gN',
        ' ': 'gN'
    });

    pt.reduceRot = reduceCommandsWithMapping({
        'R': 'rR|gN',
        'L': 'rL|gN',
        ' ': 'gN'
    });

    pt.reduceHue = reduceCommandsWithMapping({
        '↑': 'hR|gN',
        '↓': 'hL|gN',
        ' ': 'gN'
    });

    pt.reduceSat = reduceCommandsWithMapping({
        'R': 'sR|gN',
        'L': 'sL|gN',
        ' ': 'gN'
    });

    pt.reduceLum = reduceCommandsWithMapping({
        'R': 'lR|gN',
        'L': 'lL|gN',
        ' ': 'gN'
    });

    var exports = function (args) {
        return new gridField(args);
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}());

window.documentReady(function () {
    'use strict';

    var NUM_GRIDS_DEFAULT = 4;
    var GRID_MARGIN_DEFAULT = 10;
    var LEFT_MARGIN_DEFAULT = 30;
    var TOP_MARGIN_DEFAULT = 10;
    var GRID_SIZE_DEFAULT = 50;
    var COMMIT_DIFF_DEFAULT = 40;
    var HUE_DEFAULT = 17;
    var SAT_DEFAULT = 30;
    var LUM_DEFAULT = 50;

    window.sixteen = window.gridField({
        num: NUM_GRIDS_DEFAULT,
        margin: GRID_MARGIN_DEFAULT,
        left: LEFT_MARGIN_DEFAULT,
        top: TOP_MARGIN_DEFAULT,
        size: GRID_SIZE_DEFAULT,
        diff: COMMIT_DIFF_DEFAULT,
        hue: HUE_DEFAULT,
        sat: SAT_DEFAULT,
        lum: LUM_DEFAULT
    });

    sixteen.born().solidCommit();

    sixteen.appendTo(document.body);

    var proteins = {
        SSS: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                '21 3',
                '21 3',
                '21 3',
                '21 4'
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '→→→↘',
                '→→→↘',
                '→→→↘',
                '→→→↘'
            ]).commit();
        },
        SSN: function () {
            sixteen.reduceRot(sixteen.origin(), [
                'RLRL',
                '    ',
                '    ',
                '  R '
            ]).commit();
        },
        SSO: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).commit();
        },
        SSW: function () {
            sixteen.reduceRot(sixteen.origin(), [
                '    ',
                '    ',
                'RRRR',
                '    '
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                '    ',
                '    ',
                'RRRR',
                '    '
            ]).commit();
        },

        SNS: function () {
            sixteen.reduceSat(sixteen.origin(), [
                '  R ',
                '  R ',
                '  R ',
                '  R '
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                '  R ',
                '  R ',
                '  R ',
                '  R '
            ]).commit();
        },
        SNN: function () {
            sixteen.reduceTranslate(sixteen.origin(), [
                '↓←↓←',
                '↓↑←↑',
                '↓→↓↑',
                '→↑→↑'
            ]).commit();
        },
        SNO: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                '11  ',
                '11  ',
                '  11',
                '  11'
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '→↓→↓',
                '↑←↑←',
                '→↓→↓',
                '↑←↑←'
            ]).commit();
        },
        SNW: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                '  11',
                '  11',
                '11  ',
                '11  '
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '↓←↓←',
                '→↑→↑',
                '↓←↓←',
                '→↑→↑'
            ]).commit();
        },

        SOS: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                '3113',
                '2  2',
                '2  2',
                '2  2'
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '↖↗↖↗',
                '↖↗↖↗',
                '↖↗↖↗',
                '↖↗↖↗',
            ]).commit();
        },
        SON: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                '1111',
                '1  1',
                '1  1',
                '1111'
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '→→→↓',
                '↑→↓↓',
                '↑↑←↓',
                '↑←←←'
            ]).commit();
        },
        SOO: function () {
            sixteen.reduceDelay(sixteen.origin(), [
                ' 123',
                ' 123',
                ' 123',
                '1234'
            ]);
            sixteen.reduceTranslate(sixteen.origin(), [
                '↓↓↓↓',
                '↓↓↓↓',
                '↓↓↓↓',
                '↓↓↓↓'
            ]).commit();
        },
        SOW: function () {
            sixteen.reduceScales(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },

        SWS: function () {
            sixteen.reduceScales(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWN: function () {
            sixteen.reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            sixteen.reduceHue(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },
        SWO: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            sixteen.reduceHue(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWW: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).commit();
            sixteen.reduceHue(sixteen.origin(), [
                ' ↑  ',
                ' ↑  ',
                '↑ ↑ ',
                '   ↑'
            ]).commit();
        },
        
        NSS: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            sixteen.reduceSat(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).commit();
        },
        NSN: function () {
            sixteen.reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            sixteen.reduceSat(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).commit();
        },
        NSO: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).commit();
        },
        NSW: function () {
            sixteen.reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            sixteen.reduceLum(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).commit();
        },
        
        NNS: function () {},
        NNN: function () {},
        NNO: function () {},
        NNW: function () {},
        
        NOS: function () {},
        NON: function () {},
        NOO: function () {},
        NOW: function () {},
        
        NWS: function () {},
        NWN: function () {},
        NWO: function () {},
        NWW: function () {},
        
        OSS: function () {},
        OSN: function () {},
        OSO: function () {},
        OSW: function () {},
        
        ONS: function () {},
        ONN: function () {},
        ONO: function () {},
        ONW: function () {},
        
        OOS: function () {},
        OON: function () {},
        OOO: function () {},
        OOW: function () {},
        
        OWS: function () {},
        OWN: function () {},
        OWO: function () {},
        OWW: function () {},
        
        WSS: function () {},
        WSN: function () {},
        WSO: function () {},
        WSW: function () {},
        
        WNS: function () {},
        WNN: function () {},
        WNO: function () {},
        WNW: function () {},
        
        WOS: function () {},
        WON: function () {},
        WOO: function () {},
        WOW: function () {},
        
        WWS: function () {},
        WWN: function () {},
        WWO: function () {},
        WWW: function () {}
    };

    window.cardRibosome(proteins);
});
