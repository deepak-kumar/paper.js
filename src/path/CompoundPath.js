/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * All rights reserved.
 */

var CompoundPath = this.CompoundPath = PathItem.extend({
	initialize: function(paths) {
		this.base();
		this._children = [];
		// Do not reassign to paths, since arguments would get modified, which
		// we potentially use as array, depending on what is passed.
		var items = !paths || !Array.isArray(paths)
				|| typeof paths[0] !== 'object' ? arguments : paths;
		for (var i = 0, l = items.length; i < l; i++) {
			var path = items[i];
			// All paths except for the top one (last one in list) are set to
			// clockwise orientation when creating a compound path, so that they
			// appear as holes, but only if their orientation was not already
			// specified before (= _clockwise is defined).
			if (path._clockwise === undefined)
				path.setClockwise(i < l - 1);
			this.appendTop(path);
		}
	},

	/**
	 * If this is a compound path with only one path inside,
	 * the path is moved outside and the compound path is erased.
	 * Otherwise, the compound path is returned unmodified.
	 *
	 * @return the simplified compound path.
	 */
	simplify: function() {
		if (this._children.length == 1) {
			var child = this._children[0];
			child.moveAbove(this);
			this.remove();
			return child;
		}
		return this;
	},

	smooth: function() {
		for (var i = 0, l = this._children.length; i < l; i++)
			this._children[i].smooth();
	},

	draw: function(ctx, param) {
		var firstChild = this._children[0];
		ctx.beginPath();
		param.compound = true;
		for (var i = 0, l = this._children.length; i < l; i++)
			Item.draw(this._children[i], ctx, param);
		firstChild._setStyles(ctx);
		var fillColor = firstChild.getFillColor(),
			strokeColor = firstChild.getStrokeColor();
		if (fillColor) {
			ctx.fillStyle = fillColor.getCanvasStyle(ctx);
			ctx.fill();
		}
		if (strokeColor) {
			ctx.strokeStyle = strokeColor.getCanvasStyle(ctx);
			ctx.stroke();
		}
		param.compound = false;
	}
}, new function() { // Injection scope for PostScript-like drawing functions
	function getCurrentPath(that) {
		if (!that._children.length)
			throw new Error('Use a moveTo() command first');
		return that._children[that._children.length - 1];
	}

	var fields = {
		moveTo: function(point) {
			var path = new Path();
			this.appendTop(path);
			path.moveTo.apply(path, arguments);
		},

		moveBy: function(point) {
			this.moveTo(getCurrentPath(this).getLastSegment()._point.add(
					Point.read(arguments)));
		},

		closePath: function() {
			getCurrentPath(this).setClosed(true);
		}
	};

	// Redirect all other drawing commands to the current path
	Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo',
			'arcTo', 'lineBy', 'curveBy', 'arcBy'], function(key) {
		fields[key] = function() {
			var path = getCurrentPath(this);
			path[key].apply(path, arguments);
		};
	});

	return fields;
});
