import { NETWORK } from "../constants/network.js";
import { MODE } from "../constants/blend_mode.js";
import type {
    ImageFormat,
    Format,
    GifConfig,
    TextConfig,
    PixelFormat,
    BackgroundConfig,
    PreviewConfig,
    PreviewGifConfig,
    LayerConfiguration,
    SolanaMetadata,
    Network,
    BlendMode
} from "./types.js";

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
        growEditionSizeTo: 100,
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

// Image output format: "png" or "webp"
export const imageFormat: ImageFormat = "webp";

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

export const uniqueDnaTorrance = 100;

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

// Re-export constants for convenience
export { MODE, NETWORK };
