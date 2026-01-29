import { MODE, type BlendMode } from "../constants/blend_mode.js";
import { NETWORK, type Network } from "../constants/network.js";

// Type definitions
export interface Format {
    width: number;
    height: number;
    smoothing: boolean;
}

export interface GifConfig {
    export: boolean;
    repeat: number;
    quality: number;
    delay: number;
}

export interface TextConfig {
    only: boolean;
    color: string;
    size: number;
    xGap: number;
    yGap: number;
    align: CanvasTextAlign;
    baseline: CanvasTextBaseline;
    weight: string;
    family: string;
    spacer: string;
}

export interface PixelFormat {
    ratio: number;
}

export interface BackgroundConfig {
    generate: boolean;
    brightness: string;
    static: boolean;
    default: string;
}

export interface PreviewConfig {
    thumbPerRow: number;
    thumbWidth: number;
    imageRatio: number;
    imageName: string;
}

export interface PreviewGifConfig {
    numberOfImages: number;
    order: "ASC" | "DESC" | "MIXED";
    repeat: number;
    quality: number;
    delay: number;
    imageName: string;
}

export interface LayerOptions {
    displayName?: string;
    blend?: BlendMode;
    opacity?: number;
    bypassDNA?: boolean;
}

export interface LayerConfig {
    name: string;
    options?: LayerOptions;
}

export interface LayerConfiguration {
    growEditionSizeTo: number;
    layersOrder: LayerConfig[];
}

export interface SolanaCreator {
    address: string;
    share: number;
}

export interface SolanaMetadata {
    symbol: string;
    seller_fee_basis_points: number;
    external_url: string;
    creators: SolanaCreator[];
}

// Configuration
export const network: Network = NETWORK.eth;

// General metadata for Ethereum
export const namePrefix = "Your Collection";
export const description = "Remember to replace this description";
export const baseUri = "ipfs://NewUriToReplace";

export const solanaMetadata: SolanaMetadata = {
    symbol: "YC",
    seller_fee_basis_points: 1000,
    external_url: "https://www.youtube.com/c/hashlipsnft",
    creators: [
        {
            address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
            share: 100,
        },
    ],
};

export const layerConfigurations: LayerConfiguration[] = [
    {
        growEditionSizeTo: 1000,
        layersOrder: [
            { name: "Background" },
            { name: "Body" },
            { name: "Accessories_01" },
            { name: "Head" },
            { name: "Accessories_02" },
            { name: "Weapons" },
        ],
    },
];

export const shuffleLayerConfigurations = false;
export const debugLogs = false;

export const format: Format = {
    width: 1024,
    height: 1024,
    smoothing: false,
};

export const gif: GifConfig = {
    export: false,
    repeat: 0,
    quality: 100,
    delay: 500,
};

export const text: TextConfig = {
    only: false,
    color: "#ffffff",
    size: 20,
    xGap: 40,
    yGap: 40,
    align: "left",
    baseline: "top",
    weight: "regular",
    family: "Courier",
    spacer: " => ",
};

export const pixelFormat: PixelFormat = {
    ratio: 2 / 128,
};

export const background: BackgroundConfig = {
    generate: true,
    brightness: "80%",
    static: false,
    default: "#000000",
};

export const extraMetadata: Record<string, unknown> = {};

export const rarityDelimiter = "#";

export const uniqueDnaTorrance = 10000;

export const preview: PreviewConfig = {
    thumbPerRow: 5,
    thumbWidth: 50,
    imageRatio: format.height / format.width,
    imageName: "preview.png",
};

export const preview_gif: PreviewGifConfig = {
    numberOfImages: 5,
    order: "ASC",
    repeat: 0,
    quality: 100,
    delay: 500,
    imageName: "preview.gif",
};

// Re-export for convenience
export { MODE, NETWORK };
export type { BlendMode, Network };
