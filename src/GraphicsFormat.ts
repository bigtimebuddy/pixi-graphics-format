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
