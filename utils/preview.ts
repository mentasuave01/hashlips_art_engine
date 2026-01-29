import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readFileSync, writeFileSync } from "fs";
import { preview } from "../src/config.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build`;

interface MetadataItem {
    edition: number;
    [key: string]: unknown;
}

// Read json data
const rawdata = readFileSync(`${basePath}/build/json/_metadata.json`, "utf-8");
const metadataList: MetadataItem[] = JSON.parse(rawdata);

const saveProjectPreviewImage = async (data: MetadataItem[]): Promise<void> => {
    // Extract from preview config
    const { thumbWidth, thumbPerRow, imageRatio, imageName } = preview;
    // Calculate height on the fly
    const thumbHeight = thumbWidth * imageRatio;
    // Prepare canvas
    const previewCanvasWidth = thumbWidth * thumbPerRow;
    const previewCanvasHeight =
        thumbHeight * Math.ceil(data.length / thumbPerRow);
    // Shout from the mountain tops
    console.log(
        `Preparing a ${previewCanvasWidth}x${previewCanvasHeight} project preview with ${data.length} thumbnails.`
    );

    // Initiate the canvas now that we have calculated everything
    const previewPath = `${buildDir}/${imageName}`;
    const previewCanvas = createCanvas(previewCanvasWidth, previewCanvasHeight);
    const previewCtx = previewCanvas.getContext("2d");

    // Iterate all NFTs and insert thumbnail into preview image
    for (let index = 0; index < data.length; index++) {
        const nft = data[index];
        const image = await loadImage(`${buildDir}/images/${nft.edition}.webp`);
        previewCtx.drawImage(
            image,
            thumbWidth * (index % thumbPerRow),
            thumbHeight * Math.trunc(index / thumbPerRow),
            thumbWidth,
            thumbHeight
        );
    }

    // Write Project Preview to file
    writeFileSync(previewPath, previewCanvas.toBuffer("image/png"));
    console.log(`Project preview image located at: ${previewPath}`);
};

saveProjectPreviewImage(metadataList);
