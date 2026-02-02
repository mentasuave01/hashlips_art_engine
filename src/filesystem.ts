import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import type { Canvas } from "@napi-rs/canvas";
import type { Metadata } from "./types.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build`;

export const buildSetup = (exportGif: boolean): void => {
    if (existsSync(buildDir)) {
        rmSync(buildDir, { recursive: true });
    }
    mkdirSync(buildDir);
    mkdirSync(`${buildDir}/json`);
    mkdirSync(`${buildDir}/images`);
    if (exportGif) {
        mkdirSync(`${buildDir}/gifs`);
    }
};

export const saveImage = (editionCount: number, imageFormat: string, canvas: Canvas): void => {
    const mimeType = imageFormat === "png" ? "image/png" : "image/webp";
    writeFileSync(
        `${buildDir}/images/${editionCount}.${imageFormat}`,
        canvas.toBuffer(mimeType as "image/png")
    );
};

export const writeMetaData = (data: string): void => {
    writeFileSync(`${buildDir}/json/_metadata.json`, data);
};

export const saveMetaDataSingleFile = (
    editionCount: number,
    metadata: Metadata | undefined,
    debugLogs: boolean
): void => {
    if (debugLogs) {
        console.log(
            `Writing metadata for ${editionCount}: ${JSON.stringify(metadata)}`
        );
    }
    writeFileSync(
        `${buildDir}/json/${editionCount}.json`,
        JSON.stringify(metadata, null, 2)
    );
};

export { buildDir };
