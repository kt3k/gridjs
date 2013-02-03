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

    var swapParam = function (x, y, key) {
        var xKey = x[key];
        x[key] = y[key];
        y[key] = xKey;
    };

    // constructor
    var grid = function (i, j, parent) {
        this.row = i;
        this.col = j;
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

    grid.prototype.resetXY = function () {
        this.div.setX(this.parent.GRID_LEVEL * this.row + this.parent.LEFT_MARGIN);
        this.div.setY(this.parent.GRID_LEVEL * this.col + this.parent.TOP_MARGIN);
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

    grid.saturation = grid.metricsChange(function (sat) {
        this.div.addSat(sat);
        this.checkColor();
    });

    grid.luminosity = grid.metricsChange(function (lum) {
        this.div.addLum(lum);
        this.checkColor();
    });

    grid.scale = grid.metricsChange(function (scale) {
        this.div.addScale(scale);
    });

    grid.prototype.checkColor = function () {
        this.met.sat = Math.min(Math.max(this.met.sat, 0), 100);
        this.met.lum = Math.min(Math.max(this.met.lum, 20), 100);
    };

    grid.prototype.swapPosition = function (target) {
        this.parent[this.row][this.col] = target;
        this.parent[target.row][target.col] = this;

        swapParam(target, this, 'col');
        swapParam(target, this, 'row');

        this.resetXY();
        target.resetXY();

        this.setLastOne(target);
        return this;
    };

    grid.prototype.exciteMetrics = function () {
        if (this.parent.metricsExcited.indexOf(this) === -1) {
            this.parent.metricsExcited.push(this);
        }
    };

    grid.prototype.rR = grid.rotate(90);
    grid.prototype.rL = grid.rotate(-90);

    grid.prototype.hR = grid.hue(60);
    grid.prototype.hL = grid.hue(-60);

    grid.prototype.sU = grid.saturation(20);
    grid.prototype.sD = grid.saturation(-20);

    grid.prototype.sR = grid.periodicMethod('sat', 'up');
    grid.prototype.sL = grid.periodicMethod('sat', 'down');

    grid.prototype.lU = grid.luminosity(20);
    grid.prototype.lD = grid.luminosity(-20);

    grid.prototype.lR = grid.periodicMethod('lum', 'up');
    grid.prototype.lL = grid.periodicMethod('lum', 'down');

    grid.prototype.cU = grid.scale(8);
    grid.prototype.cD = grid.scale(-8);

    grid.prototype.cR = grid.periodicMethod('scale', 'up');
    grid.prototype.cL = grid.periodicMethod('scale', 'down');

    grid.prototype.commit = function () {
        this.parent.metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.div.commit();
            }, Math.random() * grid.parent.COMMIT_DIFF + grid.commitDelay);
            grid.commitDelay = 0;
        });
        this.parent.metricsExcited = [];
        return this;
    };

    grid.next = function (r, c) {
        return function () {
            return this.parent[
                (this.row + this.parent.NUM_GRIDS + r) % this.parent.NUM_GRIDS
            ][
                (this.col + this.parent.NUM_GRIDS + c) % this.parent.NUM_GRIDS
            ];
        };
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

    grid.prototype.g1 = grid.next(-1, 1);
    grid.prototype.g2 = grid.next(0, 1);
    grid.prototype.g3 = grid.next(1, 1);
    grid.prototype.g4 = grid.next(-1, 0);
    grid.prototype.g6 = grid.next(1, 0);
    grid.prototype.g7 = grid.next(-1, -1);
    grid.prototype.g8 = grid.next(0, -1);
    grid.prototype.g9 = grid.next(1, -1);

    grid.prototype.gN = function () {
        return this.onLastRow() ? this.g3() : this.g6();
    };

    grid.prototype.onLastRow = function () {
        return this.row === this.parent.NUM_GRIDS - 1;
    };

    grid.prototype.ex = function () {
        var lastOne = this.getLastOne();
        lastOne.commitDelay += 300;
        return this;
    };

    grid.prototype.resetLastOne = function () {
        this.parent.lastOneGrid = null;
        return this;
    };

    grid.prototype.setLastOne = function (target) {
        this.parent.lastOneGrid = target;
    };

    grid.prototype.getLastOne = function () {
        return this.parent.lastOneGrid || this;
    };

    grid.swapNext = function (direction) {
        return function () {
            return this.swapPosition(this.execute(direction));
        };
    };

    grid.prototype.w1 = grid.swapNext('g1');
    grid.prototype.w2 = grid.swapNext('g2');
    grid.prototype.w3 = grid.swapNext('g3');
    grid.prototype.w4 = grid.swapNext('g4');
    grid.prototype.w6 = grid.swapNext('g6');
    grid.prototype.w7 = grid.swapNext('g7');
    grid.prototype.w8 = grid.swapNext('g8');
    grid.prototype.w9 = grid.swapNext('g9');

    grid.prototype.nop = function () {};

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    grid.prototype.constructor = exports;
    exports.prototype = grid.prototype;

    return exports;
}(window));

var NUM_GRIDS_DEFAULT = 4;
var GRID_MARGIN_DEFAULT = 10;
var LEFT_MARGIN_DEFAULT = 30;
var TOP_MARGIN_DEFAULT = 10;
var GRID_SIZE_DEFAULT = 50;
var COMMIT_DIFF_DEFAULT = 40;
var HUE_DEFAULT = 17;
var SAT_DEFAULT = 30;
var LUM_DEFAULT = 50;


window.gridField = (function () {
    'use strict';

    var gridField = function () {
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
    };

    pt.origin = function () {
        return this[0][0];
    };

    pt.born = function () {
        window.div.hue = HUE_DEFAULT;
        window.div.sat = SAT_DEFAULT;
        window.div.lum = LUM_DEFAULT;

        this.init({
            num: NUM_GRIDS_DEFAULT,
            margin: GRID_MARGIN_DEFAULT,
            left: LEFT_MARGIN_DEFAULT,
            top: TOP_MARGIN_DEFAULT,
            size: GRID_SIZE_DEFAULT,
            diff: COMMIT_DIFF_DEFAULT
        });

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

    var COMMAND_SEPARATOR = '|';

    var mapper = function (mapping) {
        return function (x) {
            return mapping[x];
        };
    };

    pt.forEachGrid = function (func) {
        for (var i = 0; i < NUM_GRIDS_DEFAULT; i++) {
            for (var j = 0; j < NUM_GRIDS_DEFAULT; j++) {
                func.call(this, i, j);
            }
        }
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

    pt.reduceMove = reduceCommandsWithMapping({
        '→': 'w6',
        '←': 'w4',
        '↓': 'w2',
        '↑': 'w8',
        '↘': 'w3',
        '↗': 'w9',
        '↖': 'w7',
        '↙': 'w1',
        '*': 'ex'
    }, ['resetLastOne']);

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
        '↑': 'sR|gN',
        '↓': 'sL|gN',
        ' ': 'gN'
    });

    pt.reduceLum = reduceCommandsWithMapping({
        '↑': 'lR|gN',
        '↓': 'lL|gN',
        ' ': 'gN'
    });

    var exports = function () {
        return new gridField();
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}());

window.documentReady(function () {
    'use strict';

    var sixteen = window.gridField().born().solidCommit().appendTo(document.body);

    var proteins = {
        SSS: function () {
            sixteen.reduceMove(sixteen.origin(), '↖*←←←↖←←←↖←←←↖←←').commit();
        },
        SSN: function () {
            sixteen[0][0].rR();
            sixteen[1][0].rL();
            sixteen[2][0].rR();
            sixteen[3][0].rL();
            sixteen[2][3].rR().commit();
        },
        SSO: function () {
            sixteen[1][0].rR().lD();
            sixteen[1][1].rL().lD();
            sixteen[2][2].rR().lD();
            sixteen[3][3].rL().lD();
            sixteen[0][2].rR().lD().commit();
        },
        SSW: function () {
            sixteen[0][2].rR().lU();
            sixteen[1][2].rL().lU();
            sixteen[2][2].rR().lU();
            sixteen[3][2].rL().lU();
            sixteen[0][0].commit();
        },

        SNS: function () {
            sixteen[2][0].rR().sU();
            sixteen[2][1].rL().sU();
            sixteen[2][2].rR().sU();
            sixteen[2][3].rR().sU();
            sixteen[0][0].commit();
        },
        SNN: function () {
            sixteen.reduceMove(sixteen[0][0], '↓↓↓→↑→↓→↑↑↑←↓←↑').commit();
        },
        SNO: function () {
            sixteen.reduceMove(sixteen[0][0], '*↓*→*↑*');
            sixteen.reduceMove(sixteen[0][2], '↓→↑');
            sixteen.reduceMove(sixteen[2][0], '↓→↑');
            sixteen.reduceMove(sixteen[2][2], '*↓*→*↑*').commit();
        },
        SNW: function () {
            sixteen.reduceMove(sixteen[0][0], '*→*↓*←*');
            sixteen.reduceMove(sixteen[0][2], '→↓←');
            sixteen.reduceMove(sixteen[2][0], '→↓←');
            sixteen.reduceMove(sixteen[2][2], '*→*↓*←*').commit();
        },

        SOS: function () {
            sixteen.reduceMove(sixteen.origin(), '*↓↓↓↙*↓↓↓').commit();
            sixteen.reduceMove(sixteen.origin().g6(), '*↓↓↓↘*↓↓↓').commit();
        },
        SON: function () {
            sixteen.reduceMove(sixteen.origin(), '*↓*↓*↓*→*→*→*↑*↑*↑*←*←*').commit();
            sixteen.reduceMove(sixteen.origin().g3(), '→↓←').commit();
        },
        SOO: function () {
            sixteen.reduceMove(sixteen.origin(), '↓↓↓');
            sixteen.reduceMove(sixteen.origin().g6(), '*↓*↓*↓*');
            sixteen.reduceMove(sixteen.origin().g4(), '***↓***↓***↓***');
            sixteen.reduceMove(sixteen.origin().g6().g6(), '**↓**↓**↓**').commit();
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
        SWW: function () {},
        
        NSS: function () {
            sixteen.reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            sixteen.reduceSat(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
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
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
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
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
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
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
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
