# pixi-graphics-format

PixiJS Graphics file format and Loader middleware

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
const graphic = PIXI.GraphicsFormat.parse("f #f00 dr 0 0 100 50");
app.stage.addChild(graphic);
```

Use the loader to load an external file as Graphics object. The file must be a text file with the `.pgf` file extension.

```js
PIXI.loader.add('example', 'file.pgf');
PIXI.loader.load((loader, resources) => {
    app.stage.addChild(resources.example.graphics); 
});
```
