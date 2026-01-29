import { readdirSync } from "fs";
import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import { format, preview_gif } from "../src/config.js";
import { HashlipsGiffer } from "../modules/HashlipsGiffer.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build`;
const imageDir = `${buildDir}/images`;

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

interface LoadedImage {
    loadedImage: Image;
}

const loadImg = async (img: string): Promise<LoadedImage> => {
    const loadedImage = await loadImage(img);
    return { loadedImage };
};

// Read image paths
const imageList: Promise<LoadedImage>[] = [];
readdirSync(imageDir).forEach((file) => {
    imageList.push(loadImg(`${imageDir}/${file}`));
});

const saveProjectPreviewGIF = async (data: Promise<LoadedImage>[]): Promise<void> => {
    // Extract from preview config
    const { numberOfImages, order, repeat, quality, delay, imageName } = preview_gif;
    // Extract from format config
    const { width, height } = format;
    // Prepare canvas
    const previewCanvasWidth = width;
    const previewCanvasHeight = height;

    if (data.length < numberOfImages) {
        console.log(
            `You do not have enough images to create a gif with ${numberOfImages} images.`
        );
    } else {
        // Shout from the mountain tops
        console.log(
            `Preparing a ${previewCanvasWidth}x${previewCanvasHeight} project preview with ${data.length} images.`
        );
        const previewPath = `${buildDir}/${imageName}`;

        ctx.clearRect(0, 0, width, height);

        const hashlipsGiffer = new HashlipsGiffer(
            canvas,
            ctx,
            previewPath,
            repeat,
            quality,
            delay
        );
        hashlipsGiffer.start();

        let renderObjectArray = await Promise.all(data);

        // Determine the order of the Images before creating the gif
        if (order === "DESC") {
            renderObjectArray.reverse();
        } else if (order === "MIXED") {
            renderObjectArray = renderObjectArray.sort(() => Math.random() - 0.5);
        }

        // Reduce the size of the array of Images to the desired amount
        if (numberOfImages > 0) {
            renderObjectArray = renderObjectArray.slice(0, numberOfImages);
        }

        renderObjectArray.forEach((renderObject) => {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(
                renderObject.loadedImage,
                0,
                0,
                previewCanvasWidth,
                previewCanvasHeight
            );
            hashlipsGiffer.add();
        });

        await hashlipsGiffer.stop();
    }
};

saveProjectPreviewGIF(imageList);
