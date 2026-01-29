import { writeFile } from "fs/promises";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { Canvas, SKRSContext2D } from "@napi-rs/canvas";

export class HashlipsGiffer {
    private canvas: Canvas;
    private ctx: SKRSContext2D;
    private fileName: string;
    private repeat: number;
    private quality: number;
    private delay: number;
    private encoder: ReturnType<typeof GIFEncoder>;

    constructor(
        canvas: Canvas,
        ctx: SKRSContext2D,
        fileName: string,
        repeat: number,
        quality: number,
        delay: number
    ) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.fileName = fileName;
        this.repeat = repeat;
        this.quality = quality;
        this.delay = delay;
        this.encoder = GIFEncoder();
    }

    start(): void {
        // GIF encoder is initialized in constructor
    }

    add(): void {
        const { width, height } = this.canvas;
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const { data } = imageData;

        // Convert to RGBA array
        const rgba = new Uint8Array(data.buffer);

        // Quantize to palette (256 colors max for GIF)
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);

        // Write frame
        this.encoder.writeFrame(index, width, height, {
            palette,
            delay: this.delay,
            repeat: this.repeat,
        });
    }

    async stop(): Promise<void> {
        this.encoder.finish();
        const buffer = this.encoder.bytes();
        await writeFile(this.fileName, buffer);
        console.log(`Created gif at ${this.fileName}`);
    }
}
