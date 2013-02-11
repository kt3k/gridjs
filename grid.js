'ユニコード';
/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: div.js@1.0.1
 */

window.grid = (function (window) {
    'use strict';

    var DELAY_LEVEL = 300;
    var ANIMATION_DURATION = '500ms';

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

        var basicStyle = {
            position: 'absolute',
            left: 0,
            top: 0,
            width: this.parent.GRID_SIZE + 'px',
            height: this.parent.GRID_SIZE + 'px',
            webkitTransitionDuration: ANIMATION_DURATION
        };

        this.div = window.div(basicStyle).css(this.parent.style);

        this.commitDelay = 0;

        // periodic parameters
        this.periodic = {};
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;

        parent.metricsExcited || (parent.metricsExcited = []);

        this.div.grid = this;

        this.met = this.div.met;
        this.dom = this.div.dom;
    };

    var pt = grid.prototype;

    // return random positive integer less than n.
    var dice = function (n) {
        return Math.floor(Math.random() * n);
    };

    pt.setRandomMetrics = function () {
        this.div.setX(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_X - this.parent.GRID_SIZE / 2);
        this.div.setY(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_Y - this.parent.GRID_SIZE / 2);

        var amp = 270;
        this.div.setRot(dice(amp * 2) - amp);
    };

    pt.reset = function () {
        this.div.setRot(0);
        this.resetXY();
    };

    pt.resetXY = function () {
        this.div.setY(this.parent.GRID_LEVEL * this.row + this.parent.TOP_MARGIN);
        this.div.setX(this.parent.GRID_LEVEL * this.col + this.parent.LEFT_MARGIN);
        this.exciteMetrics();
    };

    pt.exciteMetrics = function () {
        if (this.parent.metricsExcited.indexOf(this) === -1) {
            this.parent.metricsExcited.push(this);
        }
    };

    pt.commit = function () {
        this.parent.metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.div.commit();
            }, Math.random() * grid.parent.COMMIT_DIFF + grid.commitDelay);
            grid.commitMetrics();
        });
        this.parent.metricsExcited = [];
        return this;
    };

    pt.commitMetrics = function () {
        this.row = this.rowToGo;
        this.col = this.colToGo;
        this.parent[this.row][this.col] = this;
        this.resetXY();
        this.commitDelay = 0;
    };

    pt.appendTo = function (dom) {
        dom.appendChild(this.dom);
        return this;
    };

    pt.remove = function () {
        var parentElement = this.dom.parentElement;

        if (parentElement != null) {
            parentElement.removeChild(this.dom);
        }
    };

    pt.execute = function (cmd) {
        return this[cmd]();
    };

    pt.executeIterate = function (cmds) {
        return cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this);
    };

    var linearChangeMethod = function (callback) {
        return function () {
            var args = arguments;
            return function () {
                callback.apply(this, args);
                this.exciteMetrics();
                return this;
            };
        };
    };

    var periodicMethod = function (key, dir) {
        return function () {
            this.div.met[key] = this.periodic[key][dir]();
            this.exciteMetrics();
            return this;
        };
    };

    var rotateMethod = linearChangeMethod(function (deg) {
        this.div.addRot(deg);
    });

    var hueMethod = linearChangeMethod(function (hue) {
        this.div.addHue(hue);
    });

    pt.rR = rotateMethod(90);
    pt.rL = rotateMethod(-90);

    pt.hR = hueMethod(60);
    pt.hL = hueMethod(-60);

    pt.sR = periodicMethod('sat', 'up');
    pt.sL = periodicMethod('sat', 'down');

    pt.lR = periodicMethod('lum', 'up');
    pt.lL = periodicMethod('lum', 'down');

    pt.cR = periodicMethod('scale', 'up');
    pt.cL = periodicMethod('scale', 'down');

    var nextGetOp = function (r, c) {
        return function () {
            return this.parent[this.nextRow(this.row, r)][this.nextCol(this.col, c)];
        };
    };

    pt.nextRow = function (row, d) {
        return (row + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    pt.nextCol = function (col, d) {
        return (col + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    pt.g1 = nextGetOp(1, -1);
    pt.g2 = nextGetOp(1, 0);
    pt.g3 = nextGetOp(1, 1);
    pt.g4 = nextGetOp(0, -1);
    pt.g6 = nextGetOp(0, 1);
    pt.g7 = nextGetOp(-1, -1);
    pt.g8 = nextGetOp(-1, 0);
    pt.g9 = nextGetOp(-1, 1);

    pt.gN = function () {
        return this.onLastCol() ? this.g3() : this.g6();
    };

    pt.onLastCol = function () {
        return this.col === this.parent.NUM_GRIDS - 1;
    };

    var delayMethod = function (n) {
        return function () {
            this.commitDelay = n * DELAY_LEVEL;
            this.exciteMetrics();
            return this;
        };
    };

    pt.d1 = delayMethod(1);
    pt.d2 = delayMethod(2);
    pt.d3 = delayMethod(3);
    pt.d4 = delayMethod(4);
    pt.d5 = delayMethod(5);
    pt.d6 = delayMethod(6);
    pt.d7 = delayMethod(7);
    pt.d8 = delayMethod(8);
    pt.d9 = delayMethod(9);

    var transMethod = function (r, c) {
        return function () {
            this.rowToGo = this.nextRow(this.rowToGo, r);
            this.colToGo = this.nextCol(this.colToGo, c);
            this.exciteMetrics();
            return this;
        };
    };

    pt.t1 = transMethod(1, -1);
    pt.t2 = transMethod(1, 0);
    pt.t3 = transMethod(1, 1);
    pt.t4 = transMethod(0, -1);
    pt.t6 = transMethod(0, 1);
    pt.t7 = transMethod(-1, -1);
    pt.t8 = transMethod(-1, 0);
    pt.t9 = transMethod(-1, 1);

    pt.nop = function () {};

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}(window));

/**
 * gridfield.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0
 */

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
        this.FIELD_SIZE = this.GRID_LEVEL * this.NUM_GRIDS;
        this.FIELD_CENTER_X = this.LEFT_MARGIN + this.FIELD_SIZE / 2;
        this.FIELD_CENTER_Y = this.TOP_MARGIN + this.FIELD_SIZE / 2;

        this.COMMIT_DIFF = args.diff;

        this.HUE_DEFAULT = args.hue;
        this.SAT_DEFAULT = args.sat;
        this.LUM_DEFAULT = args.lum;

        this.style = args.style;
    };

    pt.origin = function () {
        return this[0][0];
    };

    pt.born = function () {
        window.div.hue = this.HUE_DEFAULT;
        window.div.sat = this.SAT_DEFAULT;
        window.div.lum = this.LUM_DEFAULT;

        this.forEachIndex(function (i, j) {
            window.grid(i, j, this);
        });

        return this;
    };

    pt.commit = function () {
        this.origin().commit();

        return this;
    };

    pt.css = function (style) {
        this.forEachGrid(function (grid) {
            grid.div.css(style);
        });

        return this;
    };

    pt.solidCommit = function () {
        this.forEachGrid(function (grid) {
            grid.div.commit();
        });

        return this;
    };

    pt.randomize = function () {
        this.forEachGrid(function (grid) {
            grid.setRandomMetrics();
        });

        return this;
    };

    pt.reset = function () {
        this.forEachGrid(function (grid) {
            grid.reset();
        });

        return this;
    };

    pt.appendTo = function (dom) {
        this.forEachGrid(function (grid) {
            grid.appendTo(dom);
        });

        return this;
    };

    pt.remove = function () {
        this.forEachGrid(function (grid) {
            grid.remove();
        });
    };

    pt.forEachGrid = function (func) {
        this.forEachIndex(function (i, j) {
            func.call(this, this[i][j]);
        });
    };

    pt.forEachIndex = function (func) {
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
        if (array instanceof Array) {
            return array.map(function (x) {
                return flattenJoin(x, sep);
            }).join(sep);
        }

        return array;
    };

    var reduceCommandsWithMapping = function (mapping, append) {
        append = append || [];
        return function (routes) {
            routes = flattenJoin(routes, '');

            var commands = routes.split('')
            .map(mapper(mapping))
            .join(COMMAND_SEPARATOR)
            .split(COMMAND_SEPARATOR)
            .concat(append);

            this.origin().executeIterate(commands);

            return this;
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

    pt.operate = function (op) {
        switch (op.key) {
        case 't':
            return this.reduceTranslate(op.cmds);
        case 'd':
            return this.reduceDelay(op.cmds);
        case 'r':
            return this.reduceRot(op.cmds);
        case 'h':
            return this.reduceHue(op.cmds);
        case 's':
            return this.reduceSat(op.cmds);
        case 'l':
            return this.reduceLum(op.cmds);
        case 'c':
            return this.reduceScales(op.cmds);
        case 'm':
            return this.commit();
        default:
            throw Error('unsupported operation: key = `' + op.key + '`');
        }
    };

    pt.createOperationMapping = function (json) {
        var mapping = {};

        Object.keys(json).forEach(function (key) {
            mapping[key] = this.createOperation(json[key]);
        }, this);

        return mapping;
    };

    pt.createOperation = function (ops) {
        var field = this;

        return function () {
            ops.forEach(pt.operate, field);
        };
    };

    var exports = function (args) {
        return new gridField(args);
    };

    pt.constructor = exports;

    exports.prototype = pt;

    return exports;
}());

/**
 * gridlayouter.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0 card-ribosome.js@0.1.0 elapsed.js@1.0 scene.js@0.1.0
 */

var OPERATION_MAPPING = {
    SSS: [{key: 'd', cmds: [
        '21 3',
        '21 3',
        '21 3',
        '21 4'
    ]}, {key: 't', cmds: [
        '→→→↘',
        '→→→↘',
        '→→→↘',
        '→→→↘'
    ]}, {key: 'm'}],

    SSN: [{key: 'r', cmds: [
        'RLRL',
        '    ',
        '    ',
        '  R '
    ]}, {key: 'm'}],

    SSO: [{key: 'r', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'l', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'm'}],

    SSW: [{key: 'r', cmds: [
        '    ',
        '    ',
        'RRRR',
        '    '
    ]}, {key: 'l', cmds: [
        '    ',
        '    ',
        'RRRR',
        '    '
    ]}, {key: 'm'}],

    SNS: [{key: 'r', cmds: [
        '  R ',
        '  R ',
        '  R ',
        '  R '
    ]}, {key: 'l', cmds: [
        '  R ',
        '  R ',
        '  R ',
        '  R '
    ]}, {key: 'm'}],

    SNN: [
    ],

    SNO: [
    ],

    SNW: [
    ],

    SOS: [
    ],

    SON: [
    ],

    SOO: [
    ],

    SOW: [
    ],

    SWS: [
    ],

    SWN: [
    ],

    SWO: [
    ],

    SWW: [
    ],

    NSS: [
    ],

    NSN: [
    ],

    NSO: [
    ],

    NSW: [
    ],

    NNS: [
    ],

    NNN: [
    ],

    NNO: [
    ],

    NNW: [
    ],

    NOS: [
    ],

    NON: [
    ],

    NOO: [
    ],

    NOW: [
    ],

    NWS: [
    ],

    NWN: [
    ],

    NWO: [
    ],

    NWW: [
    ],

    OSS: [
    ],

    OSN: [
    ],

    OSO: [
    ],

    OSW: [
    ],

    ONS: [
    ],

    ONN: [
    ],

    ONO: [
    ],

    ONW: [
    ],

    OOS: [
    ],

    OON: [
    ],

    OOO: [
    ],

    OOW: [
    ],

    OWS: [
    ],

    OWN: [
    ],

    OWO: [
    ],

    OWW: [
    ],

    WSS: [
    ],

    WSN: [
    ],

    WSO: [
    ],

    WSW: [
    ],

    WNS: [
    ],

    WNN: [
    ],

    WNO: [
    ],

    WNW: [
    ],

    WOS: [
    ],

    WON: [
    ],

    WOO: [
    ],

    WOW: [
    ],

    WWS: [
    ],

    WWN: [
    ],

    WWO: [
    ],

    WWW: [
    ]
};

/**
 * gridLayouter implements scene
 */
window.gridLayouter = (function () {
    'use strict';

    var elapsed = window.elapsed;

    var NUM_GRIDS_DEFAULT = 4;
    var GRID_MARGIN_DEFAULT = 10;
    var LEFT_MARGIN_DEFAULT = 30;
    var TOP_MARGIN_DEFAULT = 10;
    var GRID_SIZE_DEFAULT = 50;
    var COMMIT_DIFF_DEFAULT = 40;
    var HUE_DEFAULT = 23;
    var SAT_DEFAULT = 30;
    var LUM_DEFAULT = 50;

    var gridLayouter = function (args) {
        this.args = args;
        this.initParams();
    };

    var pt = gridLayouter.prototype = new window.scene();

    pt.initParams = function () {
        this.num = NUM_GRIDS_DEFAULT;
        this.margin = GRID_MARGIN_DEFAULT;
        this.left = LEFT_MARGIN_DEFAULT;
        this.top = TOP_MARGIN_DEFAULT;
        this.size = GRID_SIZE_DEFAULT;
        this.diff = COMMIT_DIFF_DEFAULT;
        this.hue = HUE_DEFAULT;
        this.sat = SAT_DEFAULT;
        this.lum = LUM_DEFAULT;
    };

    pt.onStart = function (done) {

        var gfield = window.gridField({
            num: this.num,
            margin: this.margin,
            left: this.left,
            top: this.top,
            size: this.size,
            diff: this.diff,
            hue: this.hue,
            sat: this.sat,
            lum: this.lum
        });

        this.gfield = gfield;

        // debug
        // window.gfield = gfield;

        gfield.born().css({opacity: 0}).randomize().solidCommit();

        gfield.appendTo(window.document.body);

        elapsed(200).then(function () {
            gfield.css({opacity: 1}).solidCommit();

            elapsed(500).then(function () {
                gfield.reset().commit();

                elapsed(0).then(done);
            });
        });

        this.proteins = gfield.createOperationMapping(OPERATION_MAPPING);
        // this.proteins = this.createGridAlgorithm(gfield);

        window.cardRibosome(this.proteins);

    };
    pt.onStart = pt.methodOnStart(pt.onStart);

    pt.onStop = function (done) {
        var gfield = this.gfield;
        var self = this;

        gfield.randomize().solidCommit();

        window.cardRibosome.clear();

        elapsed(1000).then(function () {
            gfield.css({opacity: 0}).solidCommit();

            elapsed(1500).then(function () {
                gfield.remove();
                delete self.gfield;

                elapsed(0).then(done);
            });
        });
    };
    pt.onStop = pt.methodOnStop(pt.onStop);

    pt.createGridAlgorithm = function (gfield) {
        return {
            SSS: function () {
                gfield.operate({key: 'd', cmds: [
                    '21 3',
                    '21 3',
                    '21 3',
                    '21 4'
                ]}).operate({key: 't', cmds: [
                    '→→→↘',
                    '→→→↘',
                    '→→→↘',
                    '→→→↘'
                ]}).operate({key: 'm'});
            },
            SSN: function () {
                gfield.reduceRot([
                    'RLRL',
                    '    ',
                    '    ',
                    '  R '
                ]).commit();
            },
            SSO: function () {
                gfield.reduceRot([
                    ' L  ',
                    ' L  ',
                    'L L ',
                    '   L'
                ]).reduceLum([
                    ' L  ',
                    ' L  ',
                    'L L ',
                    '   L'
                ]).commit();
            },
            SSW: function () {
                gfield.reduceRot([
                    '    ',
                    '    ',
                    'RRRR',
                    '    '
                ]).reduceLum([
                    '    ',
                    '    ',
                    'RRRR',
                    '    '
                ]).commit();
            },

            SNS: function () {
                gfield.reduceRot([
                    '  R ',
                    '  R ',
                    '  R ',
                    '  R '
                ]).reduceLum([
                    '  R ',
                    '  R ',
                    '  R ',
                    '  R '
                ]).commit();
            },
            SNN: function () {
                gfield.reduceDelay([
                    '  11',
                    '  11',
                    '11  ',
                    '11  '
                ]).reduceTranslate([
                    '↓←↓←',
                    '↓↑←↑',
                    '↓→↓↑',
                    '→↑→↑'
                ]).commit();
            },
            SNO: function () {
                gfield.reduceDelay([
                    '11  ',
                    '11  ',
                    '  11',
                    '  11'
                ]).reduceTranslate([
                    '→↓→↓',
                    '↑←↑←',
                    '→↓→↓',
                    '↑←↑←'
                ]).commit();
            },
            SNW: function () {
                gfield.reduceDelay([
                    '  11',
                    '  11',
                    '11  ',
                    '11  '
                ]).reduceTranslate([
                    '↓←↓←',
                    '→↑→↑',
                    '↓←↓←',
                    '→↑→↑'
                ]).commit();
            },

            SOS: function () {
                gfield.reduceDelay([
                    '3113',
                    '2  2',
                    '2  2',
                    '2  2'
                ]).reduceTranslate([
                    '↖↗↖↗',
                    '↖↗↖↗',
                    '↖↗↖↗',
                    '↖↗↖↗'
                ]).commit();
            },
            SON: function () {
                gfield.reduceDelay([
                    '1111',
                    '1  1',
                    '1  1',
                    '1111'
                ]).reduceTranslate([
                    '→→→↓',
                    '↑→↓↓',
                    '↑↑←↓',
                    '↑←←←'
                ]).commit();
            },
            SOO: function () {
                gfield.reduceDelay([
                    ' 11 ',
                    '3223',
                    '2112',
                    '3333'
                ]).reduceTranslate([
                    '↓↓↓↓',
                    '↓↓↓↓',
                    '↓↓↓↓',
                    '↓↓↓↓'
                ]).commit();
            },
            SOW: function () {
                gfield.reduceScales([
                    '↑↓↑↓',
                    '↓↑↓↑',
                    '↑↓↑↓',
                    '↓↑↓↑'
                ]).commit();
            },

            SWS: function () {
                gfield.reduceScales([
                    ' ↑↓ ',
                    '↑↑↓↓',
                    '↓↓↑↑',
                    ' ↓↑ '
                ]).commit();
            },
            SWN: function () {
                gfield.reduceRot([
                    'RLRL',
                    'LRLR',
                    'RLRL',
                    'LRLR'
                ]).reduceHue([
                    '↑↓↑↓',
                    '↓↑↓↑',
                    '↑↓↑↓',
                    '↓↑↓↑'
                ]).commit();
            },
            SWO: function () {
                gfield.reduceRot([
                    ' RL ',
                    'RRLL',
                    'LLRR',
                    ' LR '
                ]).reduceHue([
                    ' ↑↓ ',
                    '↑↑↓↓',
                    '↓↓↑↑',
                    ' ↓↑ '
                ]).commit();
            },
            SWW: function () {
                gfield.reduceRot([
                    ' L  ',
                    ' L  ',
                    'L L ',
                    '   L'
                ]).reduceLum([
                    ' L  ',
                    ' L  ',
                    'L L ',
                    '   L'
                ]).reduceHue([
                    ' ↑  ',
                    ' ↑  ',
                    '↑ ↑ ',
                    '   ↑'
                ]).commit();
            },
            
            NSS: function () {
                gfield.reduceRot([
                    ' RL ',
                    'RRLL',
                    'LLRR',
                    ' LR '
                ]).reduceSat([
                    ' RL ',
                    'RRLL',
                    'LLRR',
                    ' LR '
                ]).commit();
            },
            NSN: function () {
                gfield.reduceRot([
                    'RLRL',
                    'LRLR',
                    'RLRL',
                    'LRLR'
                ]).reduceSat([
                    'RLRL',
                    'LRLR',
                    'RLRL',
                    'LRLR'
                ]).commit();
            },
            NSO: function () {
                gfield.reduceRot([
                    ' RL ',
                    'RRLL',
                    'LLRR',
                    ' LR '
                ]).reduceLum([
                    ' RL ',
                    'RRLL',
                    'LLRR',
                    ' LR '
                ]).commit();
            },
            NSW: function () {
                gfield.reduceRot([
                    'RLRL',
                    'LRLR',
                    'RLRL',
                    'LRLR'
                ]).reduceLum([
                    'RLRL',
                    'LRLR',
                    'RLRL',
                    'LRLR'
                ]).commit();
            },
            
            NNS: function () {
                gfield.reduceDelay([
                    '3 23',
                    '211 ',
                    ' 112',
                    '32 3'
                ]).reduceTranslate([
                    '←→↘↑',
                    '↗→↓↓',
                    '↑↑←↙',
                    '↓↖←→'
                ]).commit();
            },
            NNN: function () {
                gfield.reduceDelay([
                    '3 23',
                    '211 ',
                    ' 112',
                    '32 3'
                ]).reduceTranslate([
                    '←→↘↑',
                    '↗→↓↓',
                    '↑↑←↙',
                    '↓↖←→',

                    ' ↘↓ ',
                    '→  ↙',
                    '↗  ←',
                    ' ↑↖ '
                ]).commit();
            },
            NNO: function () {
                gfield.reduceDelay([
                    '1 1 ',
                    '2322',
                    '2232',
                    ' 1 1'
                ]).reduceTranslate([
                    '→↓→↓',
                    '↑→↑↓',
                    '↑↓←↓',
                    '↑←↑←'
                ]).commit();
            },
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
            WWW: null
        };
    };

    var exports = function (args) {
        return new gridLayouter(args);
    };

    exports.prototype = pt;

    pt.constructor = gridLayouter;

    return exports;
}());

window.documentReady(function () {
    'use strict';

    var gridScene = window.gridLayouter();

    window.gs = gridScene;

    gridScene.onStart(function () {});
});
