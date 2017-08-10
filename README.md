# pixi-graphics-format

This library creates an interoperable file format for storing PixiJS Graphics. This data can be externalized as `*.pgf` files and be loaded using the PixiJS Loader. Also, this provides utilities for serializing and unserializing Graphics.

## Installation

Install using NPM or Yarn

```bash
npm install pixi-graphics-format
```

```bash
yarn add pixi-graphics-format
```

## Setup

If you're using Webpack or Rollup, make sure that **pixi-graphics-format** is included after **pixi.js**.

```js
import * as PIXI from 'pixi.js';
import {GraphicsFormat} from 'pixi-graphics-format';
```

Alternatively, if you're using the `PIXI` global object and not importing classes, use this:

```js
import 'pixi.js';
import 'pixi-graphics-format';
```

## Usage

Using the parser to convert a graphics string to Graphics object:

```js
const graphic = PIXI.GraphicsFormat.parse("f #f00 dr 0 0 100 50 c");
app.stage.addChild(graphic);
```

Use the loader to load an external file as Graphics object. The file must be a text file with the `.pgf` file extension.

```js
PIXI.loader.add('example', 'file.pgf');
PIXI.loader.load((loader, resources) => {
    app.stage.addChild(resources.example.graphics);
});
```

## Tools

### Adobe Animate

Provided is a JSFL script (see **tools/AdobeAnimate/PGF Exporter.jsfl**) used for exporting vector graphics from Adobe Animate CC (or Flash CS5+). For information installing JSFL scripts, see [here](http://help.adobe.com/en_US/flash/cs/extend/WS5b3ccc516d4fbf351e63e3d118a9024f3f-7fe8CS5.html#WS5b3ccc516d4fbf351e63e3d118a9024f3f-7fe3CS5).

## Demo 

See [demo and editor here](https://bigtimebuddy.github.io/pixi-graphics-format/example/) to preview `.pgf` files.

## Documentation

Full API documentation can be found [here](https://bigtimebuddy.github.io/pixi-graphics-format/);

## License

MIT License.