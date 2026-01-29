import { readFileSync } from "fs";
import { layerConfigurations } from "../src/config.js";
import { getElements } from "../src/main.js";

const basePath = process.cwd();
const layersDir = `${basePath}/layers`;

interface Attribute {
    trait_type: string;
    value: string;
}

interface MetadataItem {
    attributes: Attribute[];
    [key: string]: unknown;
}

interface RarityDataElement {
    trait: string;
    weight: string;
    occurrence: number | string;
}

// Read json data
const rawdata = readFileSync(`${basePath}/build/json/_metadata.json`, "utf-8");
const data: MetadataItem[] = JSON.parse(rawdata);
const editionSize = data.length;

const rarityData: Record<string, RarityDataElement[]> = {};

// Initialize layers to chart
layerConfigurations.forEach((config) => {
    const layers = config.layersOrder;

    layers.forEach((layer) => {
        // Get elements for each layer
        const elementsForLayer: RarityDataElement[] = [];
        const elements = getElements(`${layersDir}/${layer.name}/`);
        elements.forEach((element) => {
            // Just get name and weight for each element
            const rarityDataElement: RarityDataElement = {
                trait: element.name,
                weight: element.weight.toFixed(0),
                occurrence: 0, // initialize at 0
            };
            elementsForLayer.push(rarityDataElement);
        });
        const layerName =
            layer.options?.displayName !== undefined
                ? layer.options.displayName
                : layer.name;
        // Don't include duplicate layers
        if (!rarityData[layerName]) {
            // Add elements for each layer to chart
            rarityData[layerName] = elementsForLayer;
        }
    });
});

// Fill up rarity chart with occurrences from metadata
data.forEach((element) => {
    const attributes = element.attributes;
    attributes.forEach((attribute) => {
        const traitType = attribute.trait_type;
        const value = attribute.value;

        const rarityDataTraits = rarityData[traitType];
        if (rarityDataTraits) {
            rarityDataTraits.forEach((rarityDataTrait) => {
                if (rarityDataTrait.trait === value) {
                    // Keep track of occurrences
                    (rarityDataTrait.occurrence as number)++;
                }
            });
        }
    });
});

// Convert occurrences to occurrence string
for (const layer in rarityData) {
    for (const attribute in rarityData[layer]) {
        // Get chance
        const occurrence = rarityData[layer][attribute].occurrence as number;
        const chance = ((occurrence / editionSize) * 100).toFixed(2);

        // Show two decimal places in percent
        rarityData[layer][attribute].occurrence =
            `${occurrence} in ${editionSize} editions (${chance} %)`;
    }
}

// Print out rarity data
for (const layer in rarityData) {
    console.log(`Trait type: ${layer}`);
    for (const trait in rarityData[layer]) {
        console.log(rarityData[layer][trait]);
    }
    console.log();
}
