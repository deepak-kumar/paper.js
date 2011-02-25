CompoundPath = PathItem.extend(new function() {

	function getCurrentPath(compoundPath) {
		if (compoundPath.children.length) {
			return compoundPath.children[compoundPath.children.length - 1];
		} else {
			throw Error('Use a moveTo() command first');
		}
	}
	
	var fields = {
		initialize: function(items) {
			this.base();
			this.children = [];
			if (items) {
				for (var i = 0, l = items.length; i < l; i++) {
					this.appendTop(items[i]);
				}
			}
		},

		draw: function(ctx, param) {
			if(!this.visible)
				return;
			if (this.children.length) {
				if(this.blendMode && !param.ignoreBlendMode) {
					BlendMode.process(ctx, this, param);
				} else {
					var firstChild = this.children[0];
					ctx.beginPath();
					param.compound = true;
					for (var i = 0, l = this.children.length; i < l; i++) {
						var child = this.children[i];
						child.draw(ctx, param);
					}
					param.compound = false;
					firstChild.setCtxStyles(ctx);
					if (firstChild.fillColor) {
						ctx.fillStyle = firstChild.fillColor.getCssString();
						ctx.fill();
					}
					if (firstChild.strokeColor) {
						ctx.strokeStyle = firstChild.strokeColor.getCssString();
						ctx.stroke();
					}
				}
			}
		},
		
		// TODO: have getBounds of Group / Layer / CompoundPath use the same
		// code (from a utility script?)
		getBounds: function() {
			if (this.children.length) {
				var rect = this.children[0].bounds;
				var x1 = rect.x;
				var y1 = rect.y;
				var x2 = rect.x + rect.width;
				var y2 = rect.y + rect.height;
				for (var i = 1, l = this.children.length; i < l; i++) {
					var rect2 = this.children[i].bounds;
					x1 = Math.min(rect2.x, x1);
					y1 = Math.min(rect2.y, y1);
					x2 = Math.max(rect2.x + rect2.width, x1 + x2 - x1);
					y2 = Math.max(rect2.y + rect2.height, y1 + y2 - y1);
				}
			}
			return new Rectangle(x1, y1, x2 - x1, y2 - y1);
		},
		
		/**
		 * If this is a compound path with only one path inside,
		 * the path is moved outside and the compound path is erased.
		 * Otherwise, the compound path is returned unmodified.
		 *
		 * @return the simplified compound path.
		 */
		simplify: function() {
			if (this.children.length == 1) {
				var child = this.children[0];
				child.moveAbove(this);
				this.remove();
				return child;
			}
			return this;
		},
		
		smooth: function() {
			for (var i = 0, l = this.children.length; i < l; i++) {
				this.children[i].smooth();
			}
		},

		moveTo: function() {
			var path = new Path();
			this.appendTop(path);
			path.moveTo.apply(path, arguments);
		},

		moveBy: function() {
			var point = arguments.length ? Point.read(arguments) : new Point();
			var path = getCurrentPath(this);
			var current = path.segments[path.segments.length - 1].point;
			this.moveTo(current.add(point));
		},

		closePath: function() {
			var path = getCurrentPath();
			path.setClosed(true);
		}
	};

	Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo',
			'arcTo', 'lineBy', 'curveBy', 'arcBy'], function(key) {
		fields[key] = function() {
			var path = getCurrentPath(this);
			path[key].apply(path, arguments);
		};
	});

	return fields;
});