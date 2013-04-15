/**
 * GridCommandCompiler
 * author: Yosiya Hinosawa ( @kt3k )
 */

window.GridCommandCompiler = (function () {
    'use strict';

    var exports = {};

    exports.OP_MAP = {
        delay: {
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
        },
        translate: {
            '↙': 't1|gN',
            '↓': 't2|gN',
            '↘': 't3|gN',
            '←': 't4|gN',
            '→': 't6|gN',
            '↖': 't7|gN',
            '↑': 't8|gN',
            '↗': 't9|gN',
            ' ': 'gN'
        },
        scale: {
            '↑': 'cR|gN',
            '↓': 'cL|gN',
            ' ': 'gN'
        },
        rot: {
            'R': 'rR|gN',
            'r': 'rR|rR|rR|rR|rR|rR|rR|rR|gN',
            'L': 'rL|gN',
            'l': 'rL|rL|rL|rL|rL|rL|rL|rL|gN',
            ' ': 'gN'
        },
        hue: {
            '↑': 'hR|gN',
            '↓': 'hL|gN',
            ' ': 'gN'
        },
        sat: {
            'R': 'sR|gN',
            'L': 'sL|gN',
            ' ': 'gN'
        },
        lum: {
            'R': 'lR|gN',
            'L': 'lL|gN',
            ' ': 'gN'
        },
        commit: {
            'm': 'commitAll'
        }
    };

    exports.compileOp = function (op) {
        return op.cmds
        .join('')
        .split('')
        .map(function (cmd) { return exports.OP_MAP[op.key][cmd]; })
        .join('|')
        .split('|');
    };

    exports.compileOpList = function (ops) {
        return ops
        .map(exports.compileOp)
        .reduce(function (x, y) { return x.concat(y); }, []);
    };

    exports.compile = function (opsMap) {
        var cmdMap = {};

        Object.keys(opsMap).forEach(function (key) {
            cmdMap[key] = exports.compileOpList(opsMap[key]);
        });

        return cmdMap;
    };

    return exports;
}());

var CODON_MAP = {
    SSS: [{key: 'delay', cmds: [
        '21 3',
        '21 3',
        '21 3',
        '21 4'
    ]}, {key: 'translate', cmds: [
        '→→→↘',
        '→→→↘',
        '→→→↘',
        '→→→↘'
    ]}, {key: 'commit', cmds: ['m']}],

    SSN: [{key: 'rot', cmds: [
        'RLRL',
        '    ',
        '    ',
        '  r '
    ]}, {key: 'commit', cmds: ['m']}],

    SSO: [{key: 'rot', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'lum', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'commit', cmds: ['m']}],

    SSW: [{key: 'rot', cmds: [
        '    ',
        '    ',
        'RRRR',
        '    '
    ]}, {key: 'lum', cmds: [
        '    ',
        '    ',
        'RRRR',
        '    '
    ]}, {key: 'commit', cmds: ['m']}],

    SNS: [{key: 'rot', cmds: [
        '  R ',
        '  R ',
        '  R ',
        '  R '
    ]}, {key: 'lum', cmds: [
        '  R ',
        '  R ',
        '  R ',
        '  R '
    ]}, {key: 'commit', cmds: ['m']}],

    SNN: [{key: 'delay', cmds: [
        '  11',
        '  11',
        '11  ',
        '11  '
    ]}, {key: 'translate', cmds: [
        '↓←↓←',
        '↓↑←↑',
        '↓→↓↑',
        '→↑→↑'
    ]}, {key: 'commit', cmds: ['m']}],

    SNO: [{key: 'delay', cmds: [
        '11  ',
        '11  ',
        '  11',
        '  11'
    ]}, {key: 'translate', cmds: [
        '→↓→↓',
        '↑←↑←',
        '→↓→↓',
        '↑←↑←'
    ]}, {key: 'commit', cmds: ['m']}],

    SNW: [{key: 'delay', cmds: [
        '  11',
        '  11',
        '11  ',
        '11  '
    ]}, {key: 'translate', cmds: [
        '↓←↓←',
        '→↑→↑',
        '↓←↓←',
        '→↑→↑'
    ]}, {key: 'commit', cmds: ['m']}],

    SOS: [{key: 'delay', cmds: [
        '3113',
        '2  2',
        '2  2',
        '2  2'
    ]}, {key: 'translate', cmds: [
        '↖↗↖↗',
        '↖↗↖↗',
        '↖↗↖↗',
        '↖↗↖↗'
    ]}, {key: 'commit', cmds: ['m']}],

    SON: [{key: 'delay', cmds: [
        '1111',
        '1  1',
        '1  1',
        '1111'
    ]}, {key: 'translate', cmds: [
        '→→→↓',
        '↑→↓↓',
        '↑↑←↓',
        '↑←←←'
    ]}, {key: 'commit', cmds: ['m']}],

    SOO: [{key: 'delay', cmds: [
        ' 11 ',
        '3223',
        '2112',
        '3333'
    ]}, {key: 'translate', cmds: [
        '↓↓↓↓',
        '↓↓↓↓',
        '↓↓↓↓',
        '↓↓↓↓'
    ]}, {key: 'commit', cmds: ['m']}],

    SOW: [{key: 'scale', cmds: [
        '↑↓↑↓',
        '↓↑↓↑',
        '↑↓↑↓',
        '↓↑↓↑'
    ]}, {key: 'commit', cmds: ['m']}],

    SWS: [{key: 'scale', cmds: [
        ' ↑↓ ',
        '↑↑↓↓',
        '↓↓↑↑',
        ' ↓↑ '
    ]}, {key: 'commit', cmds: ['m']}],

    SWN: [{key: 'rot', cmds: [
        'RLRL',
        'LRLR',
        'RLRL',
        'LRLR'
    ]}, {key: 'hue', cmds: [
        '↑↓↑↓',
        '↓↑↓↑',
        '↑↓↑↓',
        '↓↑↓↑'
    ]}, {key: 'commit', cmds: ['m']}],

    SWO: [{key: 'rot', cmds: [
        ' RL ',
        'RRLL',
        'LLRR',
        ' LR '
    ]}, {key: 'hue', cmds: [
        ' ↑↓ ',
        '↑↑↓↓',
        '↓↓↑↑',
        ' ↓↑ '
    ]}, {key: 'commit', cmds: ['m']}],

    SWW: [{key: 'rot', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'lum', cmds: [
        ' L  ',
        ' L  ',
        'L L ',
        '   L'
    ]}, {key: 'hue', cmds: [
        ' ↑  ',
        ' ↑  ',
        '↑ ↑ ',
        '   ↑'
    ]}, {key: 'commit', cmds: ['m']}],

    NSS: [{key: 'rot', cmds: [
        ' RL ',
        'RRLL',
        'LLRR',
        ' LR '
    ]}, {key: 'sat', cmds: [
        ' RL ',
        'RRLL',
        'LLRR',
        ' LR '
    ]}, {key: 'commit', cmds: ['m']}],

    NSN: [{key: 'rot', cmds: [
        'RLRL',
        'LRLR',
        'RLRL',
        'LRLR'
    ]}, {key: 'sat', cmds: [
        'RLRL',
        'LRLR',
        'RLRL',
        'LRLR'
    ]}, {key: 'commit', cmds: ['m']}],

    NSO: [{key: 'rot', cmds: [
        ' RL ',
        'RRLL',
        'LLRR',
        ' LR '
    ]}, {key: 'lum', cmds: [
        ' RL ',
        'RRLL',
        'LLRR',
        ' LR '
    ]}, {key: 'commit', cmds: ['m']}],

    NSW: [{key: 'rot', cmds: [
        'RLRL',
        'LRLR',
        'RLRL',
        'LRLR'
    ]}, {key: 'lum', cmds: [
        'RLRL',
        'LRLR',
        'RLRL',
        'LRLR'
    ]}, {key: 'commit', cmds: ['m']}],

    NNS: [{key: 'delay', cmds: [
        '3 23',
        '211 ',
        ' 112',
        '32 3'
    ]}, {key: 'translate', cmds: [
        '←→↘↑',
        '↗→↓↓',
        '↑↑←↙',
        '↓↖←→'
    ]}, {key: 'commit', cmds: ['m']}],

    NNN: [{key: 'delay', cmds: [
        '3 23',
        '211 ',
        ' 112',
        '32 3'
    ]}, {key: 'translate', cmds: [
        '←→↘↑',
        '↗→↓↓',
        '↑↑←↙',
        '↓↖←→',

        ' ↘↓ ',
        '→  ↙',
        '↗  ←',
        ' ↑↖ '
    ]}, {key: 'commit', cmds: ['m']}],

    NNO: [{key: 'delay', cmds: [
        '1 1 ',
        '2322',
        '2232',
        ' 1 1'
    ]}, {key: 'translate', cmds: [
        '→↓→↓',
        '↑→↑↓',
        '↑↓←↓',
        '↑←↑←'
    ]}, {key: 'commit', cmds: ['m']}],

    NNW: [{key: 'delay', cmds: [
        '1   ',
        '    ',
        '    ',
        '   1'
    ]}, {key: 'rot', cmds: [
        'l  l',
        '    ',
        '    ',
        'r  r'
    ]}, {key: 'translate', cmds: [
        '↖  ↗',
        '    ',
        '    ',
        '↙  ↘'
    ]}, {key: 'commit', cmds: ['m']}],

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

window.codonMap = window.GridCommandCompiler.compile(CODON_MAP);
