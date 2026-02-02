import { readFileSync, writeFileSync } from "fs";
import { NETWORK } from "../constants/network.js";
import {
    baseUri,
    description,
    namePrefix,
    network,
    solanaMetadata,
    imageFormat,
} from "../src/config.js";

const basePath = process.cwd();

interface MetadataItem {
    name: string;
    description: string;
    image: string;
    edition: number;
    creators?: { address: string; share: number }[];
    [key: string]: unknown;
}

// Read json data
const rawdata = readFileSync(`${basePath}/build/json/_metadata.json`, "utf-8");
const data: MetadataItem[] = JSON.parse(rawdata);

data.forEach((item) => {
    if (network === NETWORK.sol) {
        item.name = `${namePrefix} #${item.edition}`;
        item.description = description;
        item.creators = solanaMetadata.creators;
    } else {
        item.name = `${namePrefix} #${item.edition}`;
        item.description = description;
        item.image = `${baseUri}/${item.edition}.${imageFormat}`;
    }
    writeFileSync(
        `${basePath}/build/json/${item.edition}.json`,
        JSON.stringify(item, null, 2)
    );
});

writeFileSync(
    `${basePath}/build/json/_metadata.json`,
    JSON.stringify(data, null, 2)
);

if (network === NETWORK.sol) {
    console.log(`Updated description for images to ===> ${description}`);
    console.log(`Updated name prefix for images to ===> ${namePrefix}`);
    console.log(
        `Updated creators for images to ===> ${JSON.stringify(
            solanaMetadata.creators
        )}`
    );
} else {
    console.log(`Updated baseUri for images to ===> ${baseUri}`);
    console.log(`Updated description for images to ===> ${description}`);
    console.log(`Updated name prefix for images to ===> ${namePrefix}`);
}
