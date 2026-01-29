import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { extname } from "path";
import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import {
    format,
    namePrefix,
    description,
    baseUri,
} from "../src/config.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build/json`;
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

interface Attribute {
    trait_type: string;
    value: string | number;
}

interface Metadata {
    name: string;
    description: string;
    image: string;
    edition: number;
    attributes: Attribute[][];
    compiler: string;
}

interface RareColor {
    name: string;
    rgb: { r: number; g: number; b: number };
}

const metadataList: Metadata[] = [];

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
    const w = canvas.width;
    const h = canvas.height;
    ctx.drawImage(imgObject.loadedImage, 0, 0, w, h);
};

const randomIntFromInterval = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const isNeighborColor = (
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number },
    tolerance: number
): boolean => {
    return (
        Math.abs(color1.r - color2.r) <= tolerance &&
        Math.abs(color1.g - color2.g) <= tolerance &&
        Math.abs(color1.b - color2.b) <= tolerance
    );
};

const addRarity = (): Attribute[] => {
    const w = canvas.width;
    const h = canvas.height;
    let i = -4;
    let count = 0;
    const imgdata = ctx.getImageData(0, 0, w, h);
    const rgb = imgdata.data;
    const newRgb = { r: 0, g: 0, b: 0 };
    const tolerance = 15;
    const rareColorBase = "NOT a Hot Dog";
    const rareColor: RareColor[] = [
        { name: "Hot Dog", rgb: { r: 192, g: 158, b: 131 } },
        { name: "Hot Dog", rgb: { r: 128, g: 134, b: 90 } },
        { name: "Hot Dog", rgb: { r: 113, g: 65, b: 179 } },
        { name: "Hot Dog", rgb: { r: 162, g: 108, b: 67 } },
    ];

    while ((i += 10 * 4) < rgb.length) {
        ++count;
        newRgb.r += rgb[i];
        newRgb.g += rgb[i + 1];
        newRgb.b += rgb[i + 2];
    }

    newRgb.r = ~~(newRgb.r / count);
    newRgb.g = ~~(newRgb.g / count);
    newRgb.b = ~~(newRgb.b / count);

    let rarity = rareColorBase;

    rareColor.forEach((color) => {
        if (isNeighborColor(newRgb, color.rgb, tolerance)) {
            rarity = color.name;
        }
    });

    console.log(newRgb);
    console.log(rarity);

    return [
        {
            trait_type: "average color",
            value: `rgb(${newRgb.r},${newRgb.g},${newRgb.b})`,
        },
        {
            trait_type: "What is this?",
            value: rarity,
        },
        {
            trait_type: "date",
            value: randomIntFromInterval(1500, 1900),
        },
    ];
};

const saveMetadata = (loadedImageObject: LoadedImageObject): void => {
    const shortName = loadedImageObject.imgObject.filename.replace(
        /\.[^/.]+$/,
        ""
    );

    const tempAttributes: Attribute[][] = [];
    tempAttributes.push(addRarity());

    const tempMetadata: Metadata = {
        name: `${namePrefix} #${shortName}`,
        description: description,
        image: `${baseUri}/${shortName}.webp`,
        edition: Number(shortName),
        attributes: tempAttributes,
        compiler: "HashLips Art Engine",
    };
    writeFileSync(
        `${buildDir}/${shortName}.json`,
        JSON.stringify(tempMetadata, null, 2)
    );
    metadataList.push(tempMetadata);
};

const writeMetaData = (data: string): void => {
    writeFileSync(`${buildDir}/_metadata.json`, data);
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
        saveMetadata(loadedImageObject);
        console.log(
            `Created metadata for image: ${loadedImageObject.imgObject.filename}`
        );
    });
    writeMetaData(JSON.stringify(metadataList, null, 2));
};

buildSetup();
startCreating();
