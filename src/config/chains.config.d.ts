import type { ChainWalletConfig } from '@demetacode/multi-vm-wallet';
export type VmType = 'EVM' | 'SVM';
export type ChainKey = keyof typeof CHAIN_REGISTRY;
export declare const CHAIN_REGISTRY: {
    readonly ethereum: {
        vm: "EVM";
        config: {
            chainId: number;
            name: string;
            rpcUrl: string;
            explorerUrl: string;
            nativeToken: {
                name: string;
                symbol: string;
                decimals: number;
            };
            confirmationNo: number;
        };
    };
    readonly base: {
        vm: "EVM";
        config: {
            chainId: number;
            name: string;
            rpcUrl: string;
            explorerUrl: string;
            nativeToken: {
                name: string;
                symbol: string;
                decimals: number;
            };
            confirmationNo: number;
        };
    };
    readonly bsc: {
        vm: "EVM";
        config: {
            chainId: number;
            name: string;
            rpcUrl: string;
            explorerUrl: string;
            nativeToken: {
                name: string;
                symbol: string;
                decimals: number;
            };
            confirmationNo: number;
        };
    };
    readonly '0g': {
        vm: "EVM";
        config: {
            chainId: number;
            name: string;
            rpcUrl: string;
            explorerUrl: string;
            nativeToken: {
                name: string;
                symbol: string;
                decimals: number;
            };
            confirmationNo: number;
        };
    };
    readonly solana: {
        vm: "SVM";
        config: {
            chainId: string;
            name: string;
            rpcUrl: string;
            explorerUrl: string;
            nativeToken: {
                name: string;
                symbol: string;
                decimals: number;
            };
            confirmationNo: number;
        };
    };
};
export declare const SUPPORTED_CHAIN_LIST: ChainKey[];
/**
 * Normalize common aliases to ChainKey
 */
export declare function normalizeChainKey(input: string | null | undefined): ChainKey;
/**
 * Get VM type for a chain
 */
export declare function getVmType(chain: ChainKey): VmType;
/**
 * Get chain config
 */
export declare function getChainConfig(chain: ChainKey): ChainWalletConfig;
/**
 * Get user-friendly chain display name
 */
export declare function getChainDisplayName(chain: ChainKey): string;
/**
 * Get native token symbol
 */
export declare function getNativeSymbol(chain: ChainKey): string;
//# sourceMappingURL=chains.config.d.ts.map