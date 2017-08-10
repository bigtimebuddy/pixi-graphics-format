import typescript from "rollup-plugin-typescript2";
import uglify from "rollup-plugin-uglify-es";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

const plugins = [
    typescript(),
    resolve({ jsnext: true }),
    commonjs(),
    uglify({
        output: {
            comments: true,
        },
    }),
];
const compiled = (new Date()).toUTCString().replace(/GMT/g, "UTC");

const banner = `/*!
 * ${pkg.name} - v${pkg.version}
 * https://github.com/bigtimebuddy/pixi-graphics-format
 * Compiled ${compiled}
 *
 * ${pkg.name} is licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license
 */`;

/**
 * This configuration is designed for building the browser version
 * of the library, ideally included using the <script> element
 */
export default {
    entry: "src/index.ts",
    sourceMap: true,
    moduleName: "__pixiGraphics",
    intro: 'if (typeof PIXI === "undefined") { throw "PixiJS required"; }',
    banner,
    dest: `dist/pixi-graphics-format.js`,
    format: "umd",
    plugins,
};
