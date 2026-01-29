import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { extname } from "path";
import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import { format, pixelFormat } from "../src/config.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build/pixel_images`;
const inputDir = `${basePath}/build/images`;

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

interface ImageObject {
    filename: string;
    path: string;
}

interface LoadedImageObject {
    imgObject: ImageObject;
    loadedImage: Image;
}

const buildSetup = (): void => {
    if (existsSync(buildDir)) {
        rmSync(buildDir, { recursive: true });
    }
    mkdirSync(buildDir);
};

const getImages = (dir: string): ImageObject[] | null => {
    try {
        return readdirSync(dir)
            .filter((item) => {
                const extension = extname(`${dir}${item}`);
                return extension === ".png" || extension === ".jpg" || extension === ".webp";
            })
            .map((i) => ({
                filename: i,
                path: `${dir}/${i}`,
            }));
    } catch {
        return null;
    }
};

const loadImgData = async (imgObject: ImageObject): Promise<LoadedImageObject> => {
    const image = await loadImage(imgObject.path);
    return {
        imgObject,
        loadedImage: image,
    };
};

const draw = (imgObject: LoadedImageObject): void => {
    const size = pixelFormat.ratio;
    const w = canvas.width * size;
    const h = canvas.height * size;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imgObject.loadedImage, 0, 0, w, h);
    ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
};

const saveImage = (loadedImageObject: LoadedImageObject): void => {
    writeFileSync(
        `${buildDir}/${loadedImageObject.imgObject.filename}`,
        canvas.toBuffer("image/webp")
    );
};

const startCreating = async (): Promise<void> => {
    const images = getImages(inputDir);
    if (images == null) {
        console.log("Please generate collection first.");
        return;
    }
    const loadedImageObjects = await Promise.all(
        images.map((imgObject) => loadImgData(imgObject))
    );
    loadedImageObjects.forEach((loadedImageObject) => {
        draw(loadedImageObject);
        saveImage(loadedImageObject);
        console.log(`Pixelated image: ${loadedImageObject.imgObject.filename}`);
    });
};

buildSetup();
startCreating();
