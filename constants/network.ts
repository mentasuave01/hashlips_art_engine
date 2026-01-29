export const NETWORK = {
    eth: "eth",
    sol: "sol",
} as const;

export type Network = (typeof NETWORK)[keyof typeof NETWORK];
