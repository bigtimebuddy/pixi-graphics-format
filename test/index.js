/* tslint:disable:no-unused-expression */
require("pixi.js");
const path = require("path");
const lib = require("../dist/pixi-graphics");

describe("PIXI.GraphicsFormat", function() {

    before(function() {
        PIXI.utils.skipHello();
        const app = new PIXI.Application(200, 200);
        document.body.appendChild(app.view);
        this.app = app;
    });

    afterEach(function() {
        PIXI.loader.reset();
    });

    after(function() {
        this.app.destroy(true, true);
        delete this.app;
    });

    it("should contain the class", function() {
        expect(PIXI.GraphicsFormat).to.be.a.function;
        expect(lib.GraphicsFormat).to.be.a.function;
        expect(PIXI.GraphicsFormat).to.equal(lib.GraphicsFormat);
    });

    it("should execute a draw command", function() {
        const result = PIXI.GraphicsFormat.parse("f #f00 dr 30 10 100 150");
        expect(result).is.instanceof(PIXI.Graphics);
        const bounds = result.getLocalBounds();
        expect(bounds.x).to.equal(30);
        expect(bounds.y).to.equal(10);
        expect(bounds.width).to.equal(100);
        expect(bounds.height).to.equal(150);
        expect(result.fillColor).to.equal(0xFF0000);
    });

    it("should load with PIXI.loader", function(done) {
        this.slow(200);
        PIXI.loader.add("gfx", path.resolve(__dirname, "example.pixi"));
        PIXI.loader.load((loader, resources) => {
            expect(resources.gfx).to.be.okay;
            expect(resources.gfx.graphics).is.instanceof(PIXI.Graphics);
            const {graphics} = resources.gfx;
            const bounds = graphics.getLocalBounds();
            expect(bounds.x).to.equal(-50);
            expect(bounds.y).to.equal(-50);
            expect(bounds.width).to.equal(100);
            expect(bounds.height).to.equal(100);
            expect(graphics.fillColor).to.equal(0xFFFF00);
            done();
        });
    });
});
