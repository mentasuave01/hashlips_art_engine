import { createCanvas, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";
import sha1 from "sha1";
import {
    format,
    uniqueDnaTorrance,
    layerConfigurations,
    rarityDelimiter,
    shuffleLayerConfigurations,
    debugLogs,
    extraMetadata,
    text,
    namePrefix,
    network,
    solanaMetadata,
    gif,
    background,
    description,
    baseUri,
    imageFormat,
} from "./config.js";
import { HashlipsGiffer } from "../modules/HashlipsGiffer.js";
import type {
    Metadata,
    Attribute,
    Layer,
    RenderObject,
} from "./types.js";
import { buildSetup as fsBuildSetup, saveImage, writeMetaData, saveMetaDataSingleFile, buildDir } from "./filesystem.js";
import { layersSetup, createDna, isDnaUnique, filterDNAOptions, DNA_DELIMITER, cleanDna } from "./dna.js";
import { loadLayerImg, drawBackground, drawElement } from "./renderer.js";
import { addMetadata } from "./metadata.js";

const canvas: Canvas = createCanvas(format.width, format.height);
const ctx: SKRSContext2D = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;

let metadataList: Metadata[] = [];
let attributesList: Attribute[] = [];
const dnaList = new Set<string>();

let hashlipsGiffer: HashlipsGiffer | null = null;

export const buildSetup = () => fsBuildSetup(gif.export);

const addAttributes = (element: RenderObject): void => {
    attributesList.push({
        trait_type: element.layer.name,
        value: element.layer.selectedElement.name,
    });
};

const constructLayerToDna = (dna: string, layers: Layer[]) => {
    return layers.map((layer, index) => {
        const dnaPart = dna.split(DNA_DELIMITER)[index];
        const selectedElement = layer.elements.find(e => e.id === cleanDna(dnaPart));
        return {
            name: layer.name,
            blend: layer.blend,
            opacity: layer.opacity,
            selectedElement: selectedElement!,
        };
    });
};

function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const startCreating = async (): Promise<void> => {
    let layerConfigIndex = 0;
    let editionCount = 1;
    let failedCount = 0;
    let abstractedIndexes: number[] = [];

    const totalEditions = layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    const startEdition = network === "sol" ? 0 : 1;

    for (let i = startEdition; i <= totalEditions; i++) {
        abstractedIndexes.push(i);
    }

    if (shuffleLayerConfigurations) {
        abstractedIndexes = shuffle(abstractedIndexes);
    }

    while (layerConfigIndex < layerConfigurations.length) {
        const layers = layersSetup(layerConfigurations[layerConfigIndex].layersOrder, rarityDelimiter);
        const growTo = layerConfigurations[layerConfigIndex].growEditionSizeTo;

        while (editionCount <= growTo) {
            const newDna = createDna(layers);
            if (isDnaUnique(dnaList, newDna)) {
                const results = constructLayerToDna(newDna, layers);
                const renderObjectArray = await Promise.all(results.map(loadLayerImg));

                ctx.clearRect(0, 0, format.width, format.height);

                if (gif.export) {
                    hashlipsGiffer = new HashlipsGiffer(
                        canvas, ctx, `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
                        gif.repeat, gif.quality, gif.delay
                    );
                    hashlipsGiffer.start();
                }

                if (background.generate) {
                    drawBackground(ctx, format.width, format.height, background);
                }

                renderObjectArray.forEach((renderObject, index) => {
                    drawElement(ctx, renderObject, index, format, text, addAttributes);
                    if (gif.export && hashlipsGiffer) hashlipsGiffer.add();
                });

                if (gif.export && hashlipsGiffer) await hashlipsGiffer.stop();

                const currentEdition = abstractedIndexes[0];
                saveImage(currentEdition, imageFormat, canvas);

                const meta = addMetadata(
                    newDna, currentEdition, namePrefix, description, baseUri,
                    imageFormat, extraMetadata, attributesList, network, solanaMetadata
                );
                metadataList.push(meta);
                saveMetaDataSingleFile(currentEdition, meta, debugLogs);

                console.log(`Created edition: ${currentEdition}, with DNA: ${sha1(newDna)}`);

                dnaList.add(filterDNAOptions(newDna));
                editionCount++;
                abstractedIndexes.shift();
                attributesList = [];
            } else {
                console.log("DNA exists!");
                failedCount++;
                if (failedCount >= uniqueDnaTorrance) {
                    console.log(`Reached DNA tolerance. More layers/elements needed.`);
                    process.exit();
                }
            }
        }
        layerConfigIndex++;
    }
    writeMetaData(JSON.stringify(metadataList, null, 2));
};
