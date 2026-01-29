import { createCanvas, loadImage, type Canvas, type SKRSContext2D, type Image } from "@napi-rs/canvas";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import sha1 from "sha1";
import { NETWORK } from "../constants/network.js";
import {
    format,
    baseUri,
    description,
    background,
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
    type LayerConfiguration,
    type LayerConfig,
    type BlendMode,
} from "./config.js";
import { HashlipsGiffer } from "../modules/HashlipsGiffer.js";

const basePath = process.cwd();
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;

const canvas: Canvas = createCanvas(format.width, format.height);
const ctx: SKRSContext2D = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;

interface Metadata {
    name: string;
    description: string;
    image: string;
    dna: string;
    edition: number;
    date: number;
    attributes: Attribute[];
    compiler: string;
    symbol?: string;
    seller_fee_basis_points?: number;
    external_url?: string;
    properties?: {
        files: { uri: string; type: string }[];
        category: string;
        creators: { address: string; share: number }[];
    };
}

interface Attribute {
    trait_type: string;
    value: string;
}

interface Element {
    id: number;
    name: string;
    filename: string;
    path: string;
    weight: number;
}

interface Layer {
    id: number;
    elements: Element[];
    name: string;
    blend: BlendMode;
    opacity: number;
    bypassDNA: boolean;
}

interface LayerToDna {
    name: string;
    blend: BlendMode;
    opacity: number;
    selectedElement: Element;
}

interface RenderObject {
    layer: LayerToDna;
    loadedImage: Image;
}

let metadataList: Metadata[] = [];
let attributesList: Attribute[] = [];
const dnaList = new Set<string>();
const DNA_DELIMITER = "-";

let hashlipsGiffer: HashlipsGiffer | null = null;

export const buildSetup = (): void => {
    if (existsSync(buildDir)) {
        rmSync(buildDir, { recursive: true });
    }
    mkdirSync(buildDir);
    mkdirSync(`${buildDir}/json`);
    mkdirSync(`${buildDir}/images`);
    if (gif.export) {
        mkdirSync(`${buildDir}/gifs`);
    }
};

const getRarityWeight = (str: string): number => {
    const nameWithoutExtension = str.slice(0, -4);
    let nameWithoutWeight = Number(
        nameWithoutExtension.split(rarityDelimiter).pop()
    );
    if (isNaN(nameWithoutWeight)) {
        nameWithoutWeight = 1;
    }
    return nameWithoutWeight;
};

const cleanDna = (str: string): number => {
    const withoutOptions = removeQueryStrings(str);
    const dna = Number(withoutOptions.split(":").shift());
    return dna;
};

const cleanName = (str: string): string => {
    const nameWithoutExtension = str.slice(0, -4);
    const nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
    return nameWithoutWeight || "";
};

export const getElements = (path: string): Element[] => {
    return readdirSync(path)
        .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
        .map((i, index) => {
            if (i.includes("-")) {
                throw new Error(`layer name can not contain dashes, please fix: ${i}`);
            }
            return {
                id: index,
                name: cleanName(i),
                filename: i,
                path: `${path}${i}`,
                weight: getRarityWeight(i),
            };
        });
};

const layersSetup = (layersOrder: LayerConfig[]): Layer[] => {
    const layers = layersOrder.map((layerObj, index) => ({
        id: index,
        elements: getElements(`${layersDir}/${layerObj.name}/`),
        name:
            layerObj.options?.displayName != undefined
                ? layerObj.options.displayName
                : layerObj.name,
        blend:
            layerObj.options?.blend != undefined
                ? layerObj.options.blend
                : ("source-over" as BlendMode),
        opacity:
            layerObj.options?.opacity != undefined
                ? layerObj.options.opacity
                : 1,
        bypassDNA:
            layerObj.options?.bypassDNA !== undefined
                ? layerObj.options.bypassDNA
                : false,
    }));
    return layers;
};

const saveImage = (editionCount: number): void => {
    writeFileSync(
        `${buildDir}/images/${editionCount}.webp`,
        canvas.toBuffer("image/webp")
    );
};

const genColor = (): string => {
    const hue = Math.floor(Math.random() * 360);
    const pastel = `hsl(${hue}, 100%, ${background.brightness})`;
    return pastel;
};

const drawBackground = (): void => {
    ctx.fillStyle = background.static ? background.default : genColor();
    ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (dna: string, edition: number): void => {
    const dateTime = Date.now();
    let tempMetadata: Metadata = {
        name: `${namePrefix} #${edition}`,
        description: description,
        image: `${baseUri}/${edition}.webp`,
        dna: sha1(dna),
        edition: edition,
        date: dateTime,
        ...extraMetadata,
        attributes: attributesList,
        compiler: "HashLips Art Engine",
    };
    if (network == NETWORK.sol) {
        tempMetadata = {
            name: tempMetadata.name,
            symbol: solanaMetadata.symbol,
            description: tempMetadata.description,
            seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
            image: `${edition}.webp`,
            external_url: solanaMetadata.external_url,
            edition: edition,
            dna: tempMetadata.dna,
            date: tempMetadata.date,
            ...extraMetadata,
            attributes: tempMetadata.attributes,
            properties: {
                files: [
                    {
                        uri: `${edition}.webp`,
                        type: "image/webp",
                    },
                ],
                category: "image",
                creators: solanaMetadata.creators,
            },
            compiler: "HashLips Art Engine",
        };
    }
    metadataList.push(tempMetadata);
    attributesList = [];
};

const addAttributes = (element: RenderObject): void => {
    const selectedElement = element.layer.selectedElement;
    attributesList.push({
        trait_type: element.layer.name,
        value: selectedElement.name,
    });
};

const loadLayerImg = async (layer: LayerToDna): Promise<RenderObject> => {
    const image = await loadImage(layer.selectedElement.path);
    return { layer, loadedImage: image };
};

const addText = (sig: string, x: number, y: number, size: number): void => {
    ctx.fillStyle = text.color;
    ctx.font = `${text.weight} ${size}pt ${text.family}`;
    ctx.textBaseline = text.baseline;
    ctx.textAlign = text.align;
    ctx.fillText(sig, x, y);
};

const drawElement = (renderObject: RenderObject, index: number, _layersLen: number): void => {
    ctx.globalAlpha = renderObject.layer.opacity;
    ctx.globalCompositeOperation = renderObject.layer.blend;
    if (text.only) {
        addText(
            `${renderObject.layer.name}${text.spacer}${renderObject.layer.selectedElement.name}`,
            text.xGap,
            text.yGap * (index + 1),
            text.size
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

const constructLayerToDna = (dna: string = "", layers: Layer[] = []): LayerToDna[] => {
    const mappedDnaToLayers = layers.map((layer, index) => {
        const selectedElement = layer.elements.find(
            (e) => e.id == cleanDna(dna.split(DNA_DELIMITER)[index])
        );
        return {
            name: layer.name,
            blend: layer.blend,
            opacity: layer.opacity,
            selectedElement: selectedElement!,
        };
    });
    return mappedDnaToLayers;
};

const filterDNAOptions = (dna: string): string => {
    const dnaItems = dna.split(DNA_DELIMITER);
    const filteredDNA = dnaItems.filter((element) => {
        const query = /(\?.*$)/;
        const querystring = query.exec(element);
        if (!querystring) {
            return true;
        }
        const options = querystring[1].split("&").reduce((r: Record<string, string>, setting) => {
            const keyPairs = setting.split("=");
            return { ...r, [keyPairs[0]]: keyPairs[1] };
        }, {});
        return options.bypassDNA;
    });
    return filteredDNA.join(DNA_DELIMITER);
};

const removeQueryStrings = (dna: string): string => {
    const query = /(\?.*$)/;
    return dna.replace(query, "");
};

const isDnaUnique = (DnaList: Set<string> = new Set(), dna: string = ""): boolean => {
    const filteredDNA = filterDNAOptions(dna);
    return !DnaList.has(filteredDNA);
};

const createDna = (layers: Layer[]): string => {
    const randNum: string[] = [];
    layers.forEach((layer) => {
        let totalWeight = 0;
        layer.elements.forEach((element) => {
            totalWeight += element.weight;
        });
        let random = Math.floor(Math.random() * totalWeight);
        for (let i = 0; i < layer.elements.length; i++) {
            random -= layer.elements[i].weight;
            if (random < 0) {
                randNum.push(
                    `${layer.elements[i].id}:${layer.elements[i].filename}${layer.bypassDNA ? "?bypassDNA=true" : ""
                    }`
                );
                return;
            }
        }
    });
    return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (data: string): void => {
    writeFileSync(`${buildDir}/json/_metadata.json`, data);
};

const saveMetaDataSingleFile = (editionCount: number): void => {
    const metadata = metadataList.find((meta) => meta.edition == editionCount);
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

function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex: number;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
    return array;
}

export const startCreating = async (): Promise<void> => {
    let layerConfigIndex = 0;
    let editionCount = 1;
    let failedCount = 0;
    let abstractedIndexes: number[] = [];
    for (
        let i = network == NETWORK.sol ? 0 : 1;
        i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
        i++
    ) {
        abstractedIndexes.push(i);
    }
    if (shuffleLayerConfigurations) {
        abstractedIndexes = shuffle(abstractedIndexes);
    }
    if (debugLogs) {
        console.log("Editions left to create: ", abstractedIndexes);
    }
    while (layerConfigIndex < layerConfigurations.length) {
        const layers = layersSetup(
            layerConfigurations[layerConfigIndex].layersOrder
        );
        while (
            editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
        ) {
            const newDna = createDna(layers);
            if (isDnaUnique(dnaList, newDna)) {
                const results = constructLayerToDna(newDna, layers);
                const loadedElements: Promise<RenderObject>[] = [];

                results.forEach((layer) => {
                    loadedElements.push(loadLayerImg(layer));
                });

                const renderObjectArray = await Promise.all(loadedElements);

                if (debugLogs) {
                    console.log("Clearing canvas");
                }
                ctx.clearRect(0, 0, format.width, format.height);

                if (gif.export) {
                    hashlipsGiffer = new HashlipsGiffer(
                        canvas,
                        ctx,
                        `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
                        gif.repeat,
                        gif.quality,
                        gif.delay
                    );
                    hashlipsGiffer.start();
                }

                if (background.generate) {
                    drawBackground();
                }

                renderObjectArray.forEach((renderObject, index) => {
                    drawElement(
                        renderObject,
                        index,
                        layerConfigurations[layerConfigIndex].layersOrder.length
                    );
                    if (gif.export && hashlipsGiffer) {
                        hashlipsGiffer.add();
                    }
                });

                if (gif.export && hashlipsGiffer) {
                    await hashlipsGiffer.stop();
                }

                if (debugLogs) {
                    console.log("Editions left to create: ", abstractedIndexes);
                }

                saveImage(abstractedIndexes[0]);
                addMetadata(newDna, abstractedIndexes[0]);
                saveMetaDataSingleFile(abstractedIndexes[0]);
                console.log(
                    `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(newDna)}`
                );

                dnaList.add(filterDNAOptions(newDna));
                editionCount++;
                abstractedIndexes.shift();
            } else {
                console.log("DNA exists!");
                failedCount++;
                if (failedCount >= uniqueDnaTorrance) {
                    console.log(
                        `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
                    );
                    process.exit();
                }
            }
        }
        layerConfigIndex++;
    }
    writeMetaData(JSON.stringify(metadataList, null, 2));
};
