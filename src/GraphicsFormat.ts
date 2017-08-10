/**
 * Parse or serialize PIXI.Graphics objects with `*.pgf` files.
 * @class GraphicsFormat
 * @memberof PIXI
 * @example
 * const app = new PIXI.Application();
 * const graphics = PIXI.GraphicsFormat.parse("f #f00 dr 30 10 100 150 c");
 * app.stage.addChild(graphics);
 */
export default class GraphicsFormat {

    /**
     * The aliases for draw commands
     * @name PIXI.GraphicsFormat.COMMANDS
     * @static
     * @readonly
     * @type {Object}
     * @property {string} c Alias for method `closePath`
     * @property {string} h Alias for method `addHole`
     * @property {string} m Alias for method `moveTo`
     * @property {string} l Alias for method `lineTo`
     * @property {string} q Alias for method `quadraticCurveTo`
     * @property {string} b Alias for method `bezierCurveTo`
     * @property {string} f Alias for method `beginFill`
     * @property {string} s Alias for method `lineStyle`
     * @property {string} dr Alias for method `drawRect`
     * @property {string} rr Alias for method `drawRoundedRect`
     * @property {string} rc Alias for method `drawRoundedRect`
     * @property {string} dc Alias for method `drawCircle`
     * @property {string} ar Alias for method `arc`
     * @property {string} at Alias for method `arcTo`
     * @property {string} de Alias for method `drawEllipse`
     */
    public static COMMANDS: {[id: string]: string} = {
        c: "closePath",
        h: "addHole",
        m: "moveTo",
        l: "lineTo",
        q: "quadraticCurveTo",
        b: "bezierCurveTo",
        f: "beginFill",
        s: "lineStyle",
        dr: "drawRect",
        rr: "drawRoundedRect",
        rc: "drawRoundedRect",
        dc: "drawCircle",
        ar: "arc",
        at: "arcTo",
        de: "drawEllipse",
    };

    /**
     * Pattern to check that data is correct format.
     * @name PIXI.GraphicsFormat.FORMAT
     * @static
     * @private
     * @type {RexExp}
     * @readonly
     */
    private static FORMAT: RegExp = /^((\s)?(c|h|m|l|q|b|f|s|dr|rr|rc|dc|ar|at|de)(\s[0-9\.#\-a-f]+)*(\s)?)*$/;

    /**
     * Pattern to check for valid keys
     * @name PIXI.GraphicsFormat.VALID_KEYS
     * @static
     * @private
     * @type {RexExp}
     * @readonly
     */
    private static VALID_KEYS: RegExp = /^(c|h|m|l|q|b|f|s|dr|rr|rc|dc|ar|at|de)$/;

    /**
     * The extension for PIXI Graphics
     * @readonly
     * @static
     * @default 'pgf'
     */
    public static get EXTENSION(): string {
        return "pgf";
    }

    /**
     * Parse a string as a Graphics Object
     * @static
     * @method PIXI.GraphicsFormat.parse
     * @param {string} contents Commands to draw
     * @param {PIXI.Graphics} [graphics] Graphics object to use, if none is supplied will create new object.
     * @return {PIXI.Graphics} New graphics object created
     * @throws {SyntaxError} Throws error if contents is not well formatted
     */
    public static parse(contents: string, graphics: PIXI.Graphics = new PIXI.Graphics()): PIXI.Graphics {

        contents = contents.replace(/\n/g, " ");

        if (!this.FORMAT.test(contents)) {
            throw new SyntaxError("Supplied content is invalid GraphicsFormat");
        }

        const commands: Array<string|number> = contents.split(" ");
        for (let j = 0; j < commands.length; j++) {
            // Convert all numbers to floats, ignore colors
            const arg: string = commands[j] as string;
            if (arg[0] === "#") {
                commands[j] = GraphicsFormat.hexToUint(arg);
            }
            else if (!this.VALID_KEYS.test(arg)) {
                commands[j] = parseFloat(arg);
            }
        }

        // Execute the draw commands
        let currentCommand;
        const params: Array<string|number> = [];
        let i = 0;
        while (i <= commands.length) {
            const item = commands[i++];
            let resolvedName: string;
            if (typeof item === "string") {
                resolvedName = this.COMMANDS[item] || item;
            }
            // At the end or at a command
            if (item === undefined || (graphics as any)[resolvedName]) {
                // execute command
                if (currentCommand) {
                    (graphics as any)[currentCommand].apply(graphics, params);
                    params.length = 0;
                }
                // Same the command for later
                currentCommand = resolvedName;
            }
            else {
                params.push(item);
            }
        }
        return graphics;
    }

    /**
     * Convert the graphic to a string
     * @static
     * @method PIXI.GraphicsFormat.stringify
     * @param {PIXI.Graphics} graphics Object to convert to string
     * @return {string} Graphic serialized as string
     */
    public static stringify(graphics: PIXI.Graphics): string {

        // These are protected, which is why they are cast as 'any'
        const graphicsData: PIXI.GraphicsData[] = (graphics as any).graphicsData;

        let buffer = "";
        let fillColor = 0x0;
        let fillAlpha = 1;
        let lineWidth = 0;
        let lineColor = 0;
        let lineAlpha = 1;

        for (let j = 0; j < graphicsData.length; j++) {

            const data = graphicsData[j];

            if (data.fillColor !== fillColor || data.fillAlpha !== fillAlpha) {
                fillColor = data.fillColor;
                fillAlpha = data.fillAlpha;
                buffer += `f #${GraphicsFormat.uintToHex(fillColor)} `;
                if (fillAlpha !== 1) {
                    buffer += `${GraphicsFormat.toPrecision(fillAlpha)} `;
                }
            }
            if (data.lineWidth > 0 && (
                    data.lineWidth !== lineWidth ||
                    data.lineColor !== lineColor ||
                    data.lineAlpha !== lineAlpha)) {
                lineWidth = data.lineWidth;
                lineColor = data.lineColor;
                lineAlpha = data.lineAlpha;
                buffer += `s ${GraphicsFormat.toPrecision(lineWidth)} `;
                if (lineColor > 0 || lineAlpha !== 1) {
                    buffer += `#${GraphicsFormat.uintToHex(lineColor)} `;
                }
                if (lineAlpha !== 1) {
                    buffer += `${GraphicsFormat.toPrecision(lineAlpha)} `;
                }
            }

            const {shape} = data;
            const holes: PIXI.Polygon[] = (data as any).holes; // "holes" is protected

            if (shape instanceof PIXI.Rectangle) {
                const x = GraphicsFormat.toPrecision(shape.x);
                const y = GraphicsFormat.toPrecision(shape.y);
                const width = GraphicsFormat.toPrecision(shape.width);
                const height = GraphicsFormat.toPrecision(shape.height);
                buffer += `dr ${x} ${y} ${width} ${height} c `;
            }
            else if (shape instanceof PIXI.Ellipse) {
                const x = GraphicsFormat.toPrecision(shape.x);
                const y = GraphicsFormat.toPrecision(shape.y);
                const width = GraphicsFormat.toPrecision(shape.width);
                const height = GraphicsFormat.toPrecision(shape.height);
                buffer += `de ${x} ${y} ${width} ${height} c `;
            }
            else if (shape instanceof PIXI.Circle) {
                const x = GraphicsFormat.toPrecision(shape.x);
                const y = GraphicsFormat.toPrecision(shape.y);
                const radius = GraphicsFormat.toPrecision(shape.radius);
                buffer += `dc ${x} ${y} ${radius} c `;
            }
            else if (shape instanceof PIXI.Polygon) {

                const {points} = shape;
                const len = points.length;

                // Check to see if the path is closed (first point is last point)
                const closed = points[0] === points[len - 2] && points[1] === points[len - 1];
                const numPoints = closed && holes.length === 0 ? (len / 2) - 1 : len / 2;

                for (let i = 0; i < numPoints; i++) {
                    const x = GraphicsFormat.toPrecision(shape.points[i * 2]);
                    const y = GraphicsFormat.toPrecision(shape.points[(i * 2) + 1]);
                    buffer += `${i === 0 ? "m" : "l"} ${x} ${y} `;
                }

                // Check for holes and add them before closing the path
                for (let k = 0; k < holes.length; k++) {
                    const hole = holes[k];
                    const pts = hole.points.length / 2;
                    for (let l = 0; l < pts; l++) {
                        const x = GraphicsFormat.toPrecision(hole.points[l * 2]);
                        const y = GraphicsFormat.toPrecision(hole.points[(l * 2) + 1]);
                        buffer += `${l === 0 ? "m" : "l"} ${x} ${y} `;
                    }
                    buffer += "h ";
                }
                if (closed) {
                    buffer += "c ";
                }
            }
        }
        return buffer.trim();
    }

    /**
     * Optimize 8 bit colors to be shorthand hex values (e.g., "#ffcc99" => "#fc9")
     * @static
     * @method PIXI.GraphicsFormat.uintToHex
     * @private
     * @param {string} hex The hex color
     * @return {string}
     */
    private static uintToHex(color: number): string
    {
        let hex: string = color.toString(16);
        while (hex.length < 6) {
            hex = `0${hex}`;
        }
        return hex.replace(/([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/, "$1$2$3");
    }

    /**
     * Middleware to use for PIXI.loader
     * @static
     * @method PIXI.GraphicsFormat.middleware
     * @private
     * @param {string} contents Commands to draw
     * @param {PIXI.Graphics} [graphics] Graphics object to use, if none is supplied will create new object.
     * @return {PIXI.Graphics} New graphics object created
     */
    public static middleware(): (resource: PIXI.loaders.Resource, next: () => void) => void {
        return function graphicsFormatParser(resource: PIXI.loaders.Resource, next: () => void): void {
            if (resource.extension === "pgf") {
                (resource as any).graphics = GraphicsFormat.parse(resource.data as string);
            }
            next();
        };
    }

    /**
     * Convert the Hexidecimal string (e.g., "#fff") to uint
     * @static
     * @private
     * @method PIXI.GraphicsFormat.hexToUint
     */
    private static hexToUint(hex: string): number {
        // Remove the hash
        hex = hex.substr(1);

        // Convert shortcolors fc9 to ffcc99
        if (hex.length === 3) {
            hex = hex.replace(/([a-f0-9])/g, "$1$1");
        }
        return parseInt(hex, 16);
    }

    /**
     * Round a number to decimal places
     * @method PIXI.GraphicsFormat.toPrecision
     * @private
     * @static
     * @param {number} val Number to round
     * @param {number} [places=2] Number of decimal places to round to
     * @return {number} Rounded number
     */
    private static toPrecision(val: number, places: number = 2): number {
        const num = Math.pow(10, places);
        return Math.round(val * num) / num;
    }
}
