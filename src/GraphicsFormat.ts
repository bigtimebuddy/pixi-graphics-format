/**
 * Parse *.pgf files for graphics
 * @class GraphicsFormat
 * @memberof PIXI
 */
export default class GraphicsFormat {

    /**
     * The aliases for draw commands
     * @name PIXI.GraphicsFormat.COMMANDS
     * @static
     * @type {Object}
     * @property {string} c closePath
     * @property {string} h addHole
     * @property {string} m moveTo
     * @property {string} l lineTo
     * @property {string} q quadraticCurveTo
     * @property {string} b bezierCurveTo
     * @property {string} f beginFill
     * @property {string} s lineStyle
     * @property {string} dr drawRect
     * @property {string} rr drawRoundedRect
     * @property {string} rc drawRoundedRect
     * @property {string} dc drawCircle
     * @property {string} ar arc
     * @property {string} at arcTo
     * @property {string} de drawEllipse
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
     */
    public static parse(contents: string, graphics: PIXI.Graphics = new PIXI.Graphics()): PIXI.Graphics {

        // each shape is a new line
        const isCommand = /^[a-z]{1,2}$/;
        const commands: Array<string|number> = contents.split(" ");
        for (let j = 0; j < commands.length; j++) {
            // Convert all numbers to floats, ignore colors
            const arg: string = commands[j] as string;
            if (arg[0] === "#") {
                commands[j] = GraphicsFormat.hexToUint(arg);
            }
            else if (!isCommand.test(arg)) {
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
                resolvedName = GraphicsFormat.COMMANDS[item] || item;
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
    public static stringify(graphics:PIXI.Graphics): string {

        // These are protected, which is why they are cast as 'any'
        const graphicsData:PIXI.GraphicsData[] = (graphics as any).graphicsData;

        let buffer = '';
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
                    buffer += `${fillAlpha} `;
                }
            }
            if (data.lineWidth > 0 && (data.lineWidth !== lineWidth || data.lineColor !== lineColor || data.lineAlpha !== lineAlpha)) {
                lineWidth = data.lineWidth;
                lineColor = data.lineColor;
                lineAlpha = data.lineAlpha;
                buffer += `s ${lineWidth} `;
                if (lineColor > 0 || lineAlpha !== 1) {
                    buffer += `#${GraphicsFormat.uintToHex(lineColor)} `;
                }
                if (lineAlpha !== 1) {
                    buffer += `${lineAlpha} `;
                }
            }

            const {shape} = data;
            const holes:PIXI.Polygon[] = (data as any).holes; // "holes" is protected

            if (shape instanceof PIXI.Rectangle) {
                buffer += `dr ${shape.x} ${shape.y} ${shape.width} ${shape.height} c `;
            }
            else if (shape instanceof PIXI.Ellipse) {
                buffer += `de ${shape.x} ${shape.y} ${shape.width} ${shape.height} c `;
            }
            else if (shape instanceof PIXI.Circle) {
                buffer += `dc ${shape.x} ${shape.y} ${shape.radius} c `;
            }
            else if (shape instanceof PIXI.Polygon) {

                const {points} = shape;
                const len = points.length;

                // Check to see if the path is closed (first point is last point)
                const closed = points[0] === points[len - 2] && points[1] === points[len - 1];
                console.log("holes", holes);
                const numPoints = closed && holes.length === 0 ? (len / 2) - 1 : len / 2;

                for (let i = 0; i < numPoints; i++) {
                    const x = shape.points[i * 2];
                    const y = shape.points[(i * 2) + 1];                    
                    buffer += `${i === 0 ? 'm' : 'l'} ${x} ${y} `;
                }

                // Check for holes and add them before closing the path
                for (let k = 0; k < holes.length; k++) {
                    const hole = holes[k];
                    const len = hole.points.length / 2;
                    for (let l = 0; l < len; l++) {
                        const x = hole.points[l * 2];
                        const y = hole.points[(l * 2) + 1];                 
                        buffer += `${l === 0 ? 'm' : 'l'} ${x} ${y} `;
                    }
                    buffer += 'h ';
                }
                if (closed) {
                    buffer += 'c ';
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
    private static uintToHex(color:number): string
    {
        let hex:string = color.toString(16);
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
}
