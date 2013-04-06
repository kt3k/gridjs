/**
 * actorongrid.js 0.0.1
 * author: Yosiya Hinosawa ( @kt3k )
 */

var dice = function (n) {
    return Math.floor(Math.random() * n);
};

window.actorOnGrid = (function (window) {
    'use strict';

    var GRID_SIZE = 50;
    var BORDER = 10;
    var RIDER_SIZE = GRID_SIZE - BORDER * 2;

    var actorOnGrid = function () {
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

        if (this.isDead()) {
            this.deathSequece();
        }
    };

    pt.isDead = function () {
        return Math.abs(this.div.getRot()) > 1000;
    };

    pt.remove = function () {
        console.log('actorOnGrid remove')
        this.div
        .transition()
        .addRot(400)
        .setScale(0)
        .css({opacity: 0})
        .transition()
        .remove()
        .transitionCommit();
    };

    pt.deathSequece = function () {
        this.div
        .transition()
        .setHue(0)
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .setSat(0)
        .setLum(0)
        .setScale(0)

        .transition()
        .remove()
        .transitionCommit()
    };

    var exports = pt.constructor = function () {
        return new actorOnGrid();
    }

    exports.prototype = actorOnGrid.prototype = pt;

    return exports;
}(this));