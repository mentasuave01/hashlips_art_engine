import sha1 from "sha1";
import { NETWORK } from "../constants/network.js";
import type { Metadata, Attribute, SolanaMetadata } from "./types.js";

export const addMetadata = (
    dna: string,
    edition: number,
    namePrefix: string,
    description: string,
    baseUri: string,
    imageFormat: string,
    extraMetadata: Record<string, unknown>,
    attributesList: Attribute[],
    network: string,
    solanaMetadata: SolanaMetadata
): Metadata => {
    const dateTime = Date.now();
    const mimeType = imageFormat === "png" ? "image/png" : "image/webp";
    let tempMetadata: Metadata = {
        name: `${namePrefix} #${edition}`,
        description: description,
        image: `${baseUri}/${edition}.${imageFormat}`,
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
            image: `${edition}.${imageFormat}`,
            external_url: solanaMetadata.external_url,
            edition: edition,
            dna: tempMetadata.dna,
            date: tempMetadata.date,
            ...extraMetadata,
            attributes: tempMetadata.attributes,
            properties: {
                files: [
                    {
                        uri: `${edition}.${imageFormat}`,
                        type: mimeType,
                    },
                ],
                category: "image",
                creators: solanaMetadata.creators,
            },
            compiler: "HashLips Art Engine",
        };
    }
    return tempMetadata;
};
