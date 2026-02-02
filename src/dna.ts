import { readdirSync } from "fs";
import type { Element, Layer, LayerConfig, LayerOptions, BlendMode } from "./types.js";

const basePath = process.cwd();
const layersDir = `${basePath}/layers`;
const DNA_DELIMITER = "-";

export const getRarityWeight = (str: string, rarityDelimiter: string): number => {
    const nameWithoutExtension = str.slice(0, -4);
    let nameWithoutWeight = Number(
        nameWithoutExtension.split(rarityDelimiter).pop()
    );
    if (isNaN(nameWithoutWeight)) {
        nameWithoutWeight = 1;
    }
    return nameWithoutWeight;
};

export const cleanName = (str: string, rarityDelimiter: string): string => {
    const nameWithoutExtension = str.slice(0, -4);
    const nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
    return nameWithoutWeight || "";
};

export const getElements = (path: string, rarityDelimiter: string): Element[] => {
    return readdirSync(path)
        .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
        .map((i, index) => {
            if (i.includes("-")) {
                throw new Error(`layer name can not contain dashes, please fix: ${i}`);
            }
            return {
                id: index,
                name: cleanName(i, rarityDelimiter),
                filename: i,
                path: `${path}${i}`,
                weight: getRarityWeight(i, rarityDelimiter),
            };
        });
};

export const layersSetup = (layersOrder: LayerConfig[], rarityDelimiter: string): Layer[] => {
    return layersOrder.map((layerObj, index) => ({
        id: index,
        elements: getElements(`${layersDir}/${layerObj.name}/`, rarityDelimiter),
        name: layerObj.options?.displayName ?? layerObj.name,
        blend: layerObj.options?.blend ?? ("source-over" as BlendMode),
        opacity: layerObj.options?.opacity ?? 1,
        bypassDNA: layerObj.options?.bypassDNA ?? false,
    }));
};

export const removeQueryStrings = (dna: string): string => {
    const query = /(\?.*$)/;
    return dna.replace(query, "");
};

export const cleanDna = (str: string): number => {
    const withoutOptions = removeQueryStrings(str);
    const dna = Number(withoutOptions.split(":").shift());
    return dna;
};

export const filterDNAOptions = (dna: string): string => {
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

export const isDnaUnique = (DnaList: Set<string>, dna: string): boolean => {
    const filteredDNA = filterDNAOptions(dna);
    return !DnaList.has(filteredDNA);
};

export const createDna = (layers: Layer[]): string => {
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

export { DNA_DELIMITER };
