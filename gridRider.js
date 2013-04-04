/**
 * gridRider.js 0.0.1
 * author: Yosiya Hinosawa ( @kt3k )
 */

var dice = function (n) {
    return Math.floor(Math.random() * n);
};

window.gridRider = (function (window) {
    'use strict';

    var GRID_SIZE = 50;
    var BORDER = 10;
    var RIDER_SIZE = GRID_SIZE - BORDER * 2;

    var gridRider = function () {
        this.parity = 1;
    };

    var pt = {};

    pt.init = function(div) {
        this.div = window.div()
        .css({
            'position': 'absolute',
            'width': RIDER_SIZE + 'px',
            'height': RIDER_SIZE + 'px',
            'borderRadius': '5px',
            'opacity': 0,
            'zIndex': 5,
            'boxShadow': '0px 0px 3px black' 
        })
        .setX(BORDER + div.getX())
        .setY(BORDER + div.getY() - 400)
        .setHue(dice(360))
        .setRot(0)
        .commit()
        .appendTo(window.document.body)
        .transition()
        .css({opacity: 1})
        .addY(400)
        .addRot(360)
        .transitionCommit();

        var self = this;

        this.div.dom.addEventListener('click', function () { console.log(self); }, true);
    };

    pt.listen = function (move) {
        Object.keys(move).forEach(function (key) {
            this.div.met[key] += move[key];
        }, this);

        this.div.addRot(360 * this.parity);
        this.parity *= -1;

        this.div.commit();
    };

    var exports = pt.constructor = function () {
        return new gridRider();
    }

    exports.prototype = gridRider.prototype = pt;

    return exports;
}(this));