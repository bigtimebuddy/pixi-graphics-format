/**
 * Global namespace provided by **pixi.js**
 * @namespace PIXI
 */
import GraphicsFormat from "./GraphicsFormat";

// Apply to the global loader
PIXI.loader.use(GraphicsFormat.middleware());

// Apply to all future loaders
PIXI.loaders.Loader.addPixiMiddleware(GraphicsFormat.middleware);

// Load pixi files as text with XHR
PIXI.loaders.Resource.setExtensionXhrType("pixi", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.TEXT);

if (!(PIXI as any).GraphicsFormat) {
    Object.defineProperty(PIXI, "GraphicsFormat", {
        get() {
            return GraphicsFormat;
        },
    });
}

export {GraphicsFormat};
