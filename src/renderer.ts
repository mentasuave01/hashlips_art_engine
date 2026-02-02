import { loadImage, type SKRSContext2D, type Image } from "@napi-rs/canvas";
import type { RenderObject, LayerToDna, TextConfig, Format, BackgroundConfig } from "./types.js";

export const loadLayerImg = async (layer: LayerToDna): Promise<RenderObject> => {
    const image = await loadImage(layer.selectedElement.path);
    return { layer, loadedImage: image };
};

export const genColor = (brightness: string): string => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, ${brightness})`;
};

export const drawBackground = (ctx: SKRSContext2D, width: number, height: number, background: BackgroundConfig): void => {
    ctx.fillStyle = background.static ? background.default : genColor(background.brightness);
    ctx.fillRect(0, 0, width, height);
};

export const addText = (ctx: SKRSContext2D, sig: string, x: number, y: number, size: number, text: TextConfig): void => {
    ctx.fillStyle = text.color;
    ctx.font = `${text.weight} ${size}pt ${text.family}`;
    ctx.textBaseline = text.baseline;
    ctx.textAlign = text.align;
    ctx.fillText(sig, x, y);
};

export const drawElement = (
    ctx: SKRSContext2D,
    renderObject: RenderObject,
    index: number,
    format: Format,
    text: TextConfig,
    addAttributes: (element: RenderObject) => void
): void => {
    ctx.globalAlpha = renderObject.layer.opacity;
    ctx.globalCompositeOperation = renderObject.layer.blend;
    if (text.only) {
        addText(
            ctx,
            `${renderObject.layer.name}${text.spacer}${renderObject.layer.selectedElement.name}`,
            text.xGap,
            text.yGap * (index + 1),
            text.size,
            text
        );
    } else {
        ctx.drawImage(
            renderObject.loadedImage,
            0,
            0,
            format.width,
            format.height
        );
    }
    addAttributes(renderObject);
};
