// All text warnings in the console or in alerts
// make it easier to extract this for localization
var MESSAGES = {
    SELECTION: 'Must select symbols to export',
    NO_EXPORT: 'Nothing to export',
    SHAPES_ONLY: 'WARNING: Cannot export symbols or elements that are not shapes or shape primatives.',
    NO_ROTATION: 'WARNING: Unable to render primatives that have non-zero rotation. Consider breaking apart.',
    RECT_RADIUS: 'WARNING: Rounded rectangles do not support independent corner radius amounts.',
    RECT_NEG_RADIUS: 'WARNING: Unsupported rounded rectangle with radius less than zero.',
    NO_GRADIENTS: 'WARNING: Gradients are not supported in PixiJS, using fallback solid-color.',
    BITMAP_FILLS: 'WARNING: Bitmap fills are not supported',
    SAVE_CANCEL: '\nCancelled file save.',
    SAVE_ERROR: '\nERROR: Unable to write file. Please check the file is not locked or disk is not write-protected.',
    SAVE_TITLE: 'Save PGF File',
    SAVE_OVERWRITE: 'File already exists, overwrite?',
    SAVE_SUCCESS: '\nFile was saved successfully.'
};

/**
 * Create new pseudo-class for exporting graphics to PGF files
 * @class PGFExporter
 */
var PGFExporter = function() {

    /**
     * The output buffer to write file
     * @property {string} buffer
     */
    this.buffer = '';
};

// Reference to prototype
var p = PGFExporter.prototype;

/**
 * Preflight check
 * @method start
 */
p.start = function() {
    var doc = fl.getDocumentDOM();
    if (!doc) {
        return;
    }
    var selection = doc.selection;
    if (!selection || !selection.length) {
        return alert(MESSAGES.SELECTION);
    }
    fl.outputPanel.clear();

    for (var i = 0; i < selection.length; i++) {
        this.processShape(selection[i]);
    }
};

/**
 * Convert a color into a compressed color, for instance #ff00cc => #f0c
 * also this will return an object with alpha.
 * @method parseColor
 * @param {String} str The input color, e.g. "#ffffff" (16-bit), "#00ccff99" (24-bit)
 * @return {Object} Object with color (string) and alpha (number) keys
 */
p.parseColor = function(str) {
    var hex = str.slice(1);
    var is24bit = hex.length === 8;
    var alpha = is24bit ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    var color = '#' + hex.slice(0,6).replace(/([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/, '$1$2$3');
    if (color === '#000') {
        color = '0';
    }
    return {
        color: color,
        alpha: this.precision(alpha)
    };
};

/**
 * For compression-sake, round numbers to the nearest 2 decimal places
 * @method precision
 * @param {number} val Value to round
 * @return {number} Rounded value
 */
p.precision = function(val) {
    return Math.round(val * 100) / 100;
};

/**
 * Process a Shape object in JSFL to output to PGF file.
 * @method processShape
 * @param {Shape} shape Shape to render to buffer
 */
p.processShape = function(shape) {

    if (shape.elementType !== 'shape') {
        fl.trace(MESSAGES.SHAPES_ONLY);
        return;
    }

    var TRANSPARENT = '#00000000';
    var fillColor;
    var strokeColor;
    var isHole = false;
    var drawBuffer = '';
    var fillBuffer = '';
    var strokeBuffer = '';
    var strokeSize = 0;
    var isPrimative = false;
    var tx = shape.matrix.tx;
    var ty = shape.matrix.ty;

    if (shape.rotation) {
        fl.trace(MESSAGES.NO_ROTATION);
    }

    // Draw normal rectangles
    if (shape.isRectangleObject) {

        var radius = shape.bottomLeftRadius;

        if (!shape.lockFlag && (shape.bottomRightRadius !== radius || shape.topLeftRadius !== radius || shape.topRightRadius !== radius)) {
            fl.trace(MESSAGES.RECT_RADIUS);
        }

        if (radius < 0) {
            fl.trace(MESSAGES.RECT_NEG_RADIUS);
            radius = 0;
        }
        drawBuffer += radius ? 'rr ' : 'dr ';
        drawBuffer += this.precision(shape.x - (shape.width / 2)) + ' ';
        drawBuffer += this.precision(shape.y - (shape.height / 2)) + ' ';
        drawBuffer += this.precision(shape.width) + ' ' + this.precision(shape.height) + ' ';
        if (radius) {
            drawBuffer += this.precision(radius) + ' ';
        }
        isPrimative = true;
    }
    // Draw normal ellipses and circles
    else if (shape.isOvalObject && shape.endAngle === shape.startAngle) {
        isPrimative = true;
        var isCircle = (shape.width === shape.height);
        drawBuffer += isCircle ? 'dc ' : 'de ';
        drawBuffer += this.precision(shape.x) + ' ' + this.precision(shape.y) + ' ';
        drawBuffer += this.precision(shape.width / 2) + ' ';
        if (!isCircle) {
            drawBuffer += this.precision(shape.height / 2) + ' ';
        }
    }

    // Group with members, process each individually
    if (shape.members.length) {
        for (var i = 0; i < shape.members.length; i++) {
            this.processShape(shape.members[i]);
        }
        return;
    }

    // Handle the contours
    for (var i = 0; i < shape.contours.length; i++) {

        var contour = shape.contours[i];
        var emptyFill = contour.orientation === 0;
        var color = contour.fill.color;

        if (contour.fill.bitmapPath) {
            fl.trace(MESSAGES.BITMAP_FILLS);
            color = "#000000";
        }

        // For line-work only, use an empty fill
        if (emptyFill && fillColor !== TRANSPARENT) {
            fillColor = TRANSPARENT;
            fillBuffer += 'f 0 0 ';
        }
        else if (color && color !== fillColor) {
            if (contour.fill.colorArray) {
                fl.trace(MESSAGES.NO_GRADIENTS);
            }
            var c = this.parseColor(color);
            fillBuffer += 'f ' + c.color + ' ' + c.alpha + ' ';
            fillColor = contour.fill.color;
        }

        // Ignore interior contours
        // these are useless for PixiJS
        if (contour.interior) { continue; }
        
        var firstPoint;
        var lastPoint;
        var halfEdge = contour.getHalfEdge();
        var startId = halfEdge.id;
        var id = 0;

        while (id !== startId) {

            var edge = halfEdge.getEdge();
            var nextHalfEdge = halfEdge.getNext();
            var stroke = edge.stroke.color;

            // We have an edge color
            if (!stroke && !isHole && strokeColor !== TRANSPARENT) {
                strokeColor = TRANSPARENT;
                strokeBuffer += 's 0 0 0 ';
            }
            else if (stroke && (edge.stroke.thickness !== strokeSize || stroke !== strokeColor)) {
                strokeSize = edge.stroke.thickness;
                strokeColor = stroke;
                var c = this.parseColor(stroke);
                strokeBuffer += 's ' + strokeSize + ' ' + c.color + ' ' + c.alpha + ' ';
            }


            if (!isPrimative) {
                var points = shape.getCubicSegmentPoints(edge.cubicSegmentIndex);
                var move = points[0];
                var cp1 = points[1];
                var cp2 = points[2];
                var to = points[3];

                if (id === 0) {
                    firstPoint = move;
                    drawBuffer += 'm ' + this.precision(tx + move.x) + ' ' + this.precision(ty + move.y) + ' ';
                }

                if (startId == nextHalfEdge.id) {
                    lastPoint = to;
                    if (!edge.isLine && !emptyFill) {
                        drawBuffer += 'b ' + this.precision(tx + cp1.x) + ' ' + this.precision(ty + cp1.y) + ' ';
                        drawBuffer += this.precision(tx + cp2.x) + ' ' + this.precision(ty + cp2.y) + ' ';
                        drawBuffer += this.precision(tx + to.x) + ' ' + this.precision(ty + to.y) + ' ';
                    }
                    if (!emptyFill) {
                        drawBuffer += !isHole ? 'c ' : 'h ';
                    }
                }
                else { 

                    if (edge.isLine) {
                        drawBuffer += 'l ' + this.precision(tx + to.x) + ' ' + this.precision(ty + to.y) + ' ';
                    }
                    else {
                        drawBuffer += 'b ' + this.precision(tx + cp1.x) + ' ' + this.precision(ty + cp1.y) + ' ';
                        drawBuffer += this.precision(tx + cp2.x) + ' ' + this.precision(ty + cp2.y) + ' ';
                        drawBuffer += this.precision(tx + to.x) + ' ' + this.precision(ty + to.y) + ' ';
                    }
                }
            }
            halfEdge = nextHalfEdge;
            id = halfEdge.id;
        }
        isHole = true;
    }
    this.buffer += fillBuffer + strokeBuffer + drawBuffer;
};

/**
 * Save the output buffer
 * @method save
 * @param {boolean} [debug=false] Run in debug mode, output to console
 */
p.save = function(debug) {

    if (!this.buffer) {
        return alert(MESSAGES.NO_EXPORT);
    }

    this.buffer = this.buffer.slice(0, -1);

    if (debug) {
        fl.trace(this.buffer);
    }
    else {

        var uri = fl.browseForFileURL('save', MESSAGES.SAVE_TITLE);

        if (!uri) {
            return fl.trace(MESSAGES.SAVE_CANCEL);
        }

        // Replace empty extension
        uri = uri.replace(/\.\*$/, '');

        // Add the extension if it's missing
        if (!/\.pgf$/i.test(uri)) {
            uri += '.pgf';
        }

        if (FLfile.exists(uri) && !confirm(MESSAGES.SAVE_OVERWRITE)) {
            return fl.trace(MESSAGES.SAVE_CANCEL);
        }

        if (!FLfile.write(uri, this.buffer)) {
            return fl.trace(MESSAGES.SAVE_ERROR);
        }

        fl.trace(MESSAGES.SAVE_SUCCESS);
    }
};

(function() {

    var exporter = new PGFExporter();
    exporter.start();
    exporter.save();

}());
