import { type BlendMode } from "../constants/blend_mode.js";
import { type Network } from "../constants/network.js";
import { type Image } from "@napi-rs/canvas";

// Image and Format
export type ImageFormat = "png" | "webp";

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

// Layer Configuration
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

// Solana Metadata
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

// Internal Engine Structures
export interface Attribute {
    trait_type: string;
    value: string;
}

export interface Metadata {
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

export interface Element {
    id: number;
    name: string;
    filename: string;
    path: string;
    weight: number;
}

export interface Layer {
    id: number;
    elements: Element[];
    name: string;
    blend: BlendMode;
    opacity: number;
    bypassDNA: boolean;
}

export interface LayerToDna {
    name: string;
    blend: BlendMode;
    opacity: number;
    selectedElement: Element;
}

export interface RenderObject {
    layer: LayerToDna;
    loadedImage: Image;
}

export { BlendMode, Network };
