/**
 * Token Service - Fetch token details from various sources
 */
import { ethers, JsonRpcProvider } from 'ethers';
// ==================== UTILITY FUNCTIONS ====================
export function calculatePercentageChange(oldPrice, currentPrice) {
    const percentChange = ((currentPrice - oldPrice) / oldPrice) * 100;
    if (percentChange === Infinity) {
        return 0;
    }
    return Number(percentChange.toFixed(2));
}
// ==================== COINGECKO PRICE FETCHER ====================
const COINGECKO_SIMPLE_PRICE = 'https://api.coingecko.com/api/v3/simple/price';
const COINGECKO_API_KEY = process.env.CG_API_KEY;
const COINGECKO_USE_DEMO_HEADER = true;
const priceCache = new Map();
const CACHE_TTL_MS = 45 * 1000;
const COINGECKO_ID_MAP = {
    ETH: 'ethereum',
    BNB: 'binancecoin',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    FTM: 'fantom',
    SOL: 'solana',
    '0G': 'zero-gravity',
};
export async function getNativeTokenUsdPrice(chain) {
    const nativeSymbol = chain === 'solana' ? 'SOL' : chain === 'bsc' ? 'BNB' : 'ETH';
    const now = Date.now();
    const cacheKey = `${nativeSymbol}_usd`;
    if (priceCache.has(cacheKey)) {
        const cached = priceCache.get(cacheKey);
        if (cached.expiresAt > now) {
            return cached.value;
        }
    }
    const coingeckoId = COINGECKO_ID_MAP[nativeSymbol];
    if (!coingeckoId) {
        throw new Error(`No CoinGecko ID mapping found for ${nativeSymbol}`);
    }
    const params = new URLSearchParams({
        ids: coingeckoId,
        vs_currencies: 'usd',
    });
    const headers = { Accept: 'application/json' };
    if (COINGECKO_API_KEY) {
        const headerName = COINGECKO_USE_DEMO_HEADER
            ? 'x-cg-demo-api-key'
            : 'x-cg-pro-api-key';
        headers[headerName] = COINGECKO_API_KEY;
    }
    const res = await fetch(`${COINGECKO_SIMPLE_PRICE}?${params.toString()}`, {
        headers,
    });
    if (!res.ok)
        throw new Error(`CoinGecko request failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const price = data?.[coingeckoId]?.usd;
    if (typeof price !== 'number') {
        throw new Error(`Invalid response from CoinGecko: missing ${coingeckoId}.usd`);
    }
    priceCache.set(cacheKey, { value: price, expiresAt: Date.now() + CACHE_TTL_MS });
    return price;
}
// ==================== ON-CHAIN TOKEN DATA ====================
// Minimal ERC-20 ABI for metadata
const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
];
/**
 * Fetch ERC-20 token metadata directly from the blockchain.
 */
export const getTokenDataFromChain = async (tokenAddress, provider) => {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name?.() ?? 'Unknown',
        contract.symbol?.() ?? 'UNKNOWN',
        contract.decimals?.() ?? 18,
        contract.totalSupply?.() ?? BigInt(0),
    ]);
    return {
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
    };
};
// ==================== DEXSCREENER ====================
export const getTokenDetails_DEXSCREENER = async (token) => {
    try {
        console.log('DEXSCREENER');
        console.log('token: ', token);
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
            method: 'GET',
        });
        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            if (!pair)
                return null;
            const result = {
                name: pair.baseToken?.name || 'Unknown',
                symbol: pair.baseToken?.symbol || 'UNKNOWN',
                address: pair.baseToken?.address || token,
                priceUsd: Number(pair.priceUsd || 0),
                priceNative: Number(pair.priceNative || 0),
                mc: pair.marketCap || 0,
                liquidityInUsd: pair.liquidity?.base || 0,
                telegramUrl: pair.info?.socials?.find((s) => s.type === 'telegram')?.url || '',
                twitterUrl: pair.info?.socials?.find((s) => s.type === 'twitter')?.url || '',
                websiteUrl: pair.info?.websites?.[0]?.url || '',
                volume: {
                    m5: pair.volume?.m5 || 0,
                    h1: pair.volume?.h1 || 0,
                    h24: pair.volume?.h24 || 0,
                },
                change: {
                    m5: pair.priceChange?.m5 || 0,
                    h1: pair.priceChange?.h1 || 0,
                    h24: pair.priceChange?.h24 || 0,
                },
                chain: pair.chainId || 'unknown',
            };
            return result;
        }
        return null;
    }
    catch (error) {
        console.log('error: ', error);
        return null;
    }
};
// ==================== DEXTOOLS ====================
export const getTokenDetails_DEXTOOLS = async (token) => {
    console.log('token: ', token);
    console.log('DEXTOOLS');
    try {
        const res = await fetch(`https://www.dextools.io/shared/search/pair?query=${token}&strict=true`, {
            headers: {
                accept: 'application/json',
                'accept-language': 'en-GB,en-NG;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/json',
                priority: 'u=1, i',
                'sec-fetch-dest': 'empty',
                'sec-fetch-site': 'same-origin',
            },
            method: 'GET',
        });
        const _data = await res.json();
        let data;
        if (_data.data) {
            data = _data.data[0];
        }
        else if (_data.results) {
            data = _data.results[0];
        }
        else {
            // Try direct pair query
            const res2 = await fetch(`https://www.dextools.io/shared/data/pair?address=${token}&chain=solana&audit=false&locks=true`, {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                },
                method: 'GET',
            });
            const _data2 = await res2.json();
            if (_data2.data) {
                data = _data2.data[0];
            }
            else if (_data2.results) {
                data = _data2.results[0];
            }
            else {
                return null;
            }
        }
        if (!data)
            return null;
        const priceInSol = (data.periodStats?.['1h']?.price?.chain?.last * data.price) /
            (data.periodStats?.['1h']?.price?.usd?.last || 1);
        const result = {
            name: data.name || 'Unknown',
            symbol: data.symbol || 'UNKNOWN',
            address: data.id?.token || token,
            priceUsd: data.price || 0,
            priceNative: priceInSol || 0,
            mc: data.price * Number(data.token?.totalSupply || 0),
            liquidityInUsd: data.metrics?.liquidity || 0,
            telegramUrl: data.token?.links?.telegram || '',
            twitterUrl: data.token?.links?.twitter || '',
            websiteUrl: data.token?.links?.website || '',
            volume: {
                m5: data.periodStats?.['5m']?.volume?.buys || 0,
                h1: data.periodStats?.['1h']?.volume?.buys || 0,
                h24: data.price24h?.buys || 0,
            },
            change: {
                m5: calculatePercentageChange(data.periodStats?.['5m']?.price?.usd?.last || 0, data.price),
                h1: calculatePercentageChange(data.periodStats?.['1h']?.price?.usd?.last || 0, data.price),
                h24: calculatePercentageChange(data.periodStats?.['24h']?.price?.usd?.last || 0, data.price),
            },
            chain: data.id?.chain || 'unknown',
        };
        return result;
    }
    catch (error) {
        console.log('error: ', error);
        return null;
    }
};
// ==================== 0G CHAIN SPECIFIC ====================
const KNOWN_TOKEN_DETAILS = {
    '0x59ef6f3943bbdfe2fb19565037ac85071223e94c': {
        socials: {
            telegramUrl: 'https://t.me/PANDAI0N0G',
            websiteUrl: '',
            twitterUrl: 'https://x.com/pandaion0G',
        },
    },
};
export const getCustomTokenDataForEvmChainUsingUniSwapV30g = async (tokenAddress, chain) => {
    try {
        const provider = new JsonRpcProvider(chain.rpcUrl);
        const tokenDetails = await getTokenDataFromChain(tokenAddress, provider);
        console.log('Token details from chain:', {
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            totalSupply: tokenDetails.totalSupply,
        });
        // Fetch from token screener API
        const screenerUrl = `https://screener.deserialize.xyz/tokens/${tokenAddress}`;
        console.log('Fetching from screener:', screenerUrl);
        const res = await fetch(screenerUrl);
        if (!res.ok) {
            console.error('Screener API request failed:', res.status);
            return null;
        }
        const screenerResponse = await res.json();
        if (!screenerResponse.success) {
            console.error('Invalid screener response:', screenerResponse);
            return null;
        }
        const data = screenerResponse.data;
        console.log('Screener data:', {
            price: data.price,
            liquidity: data.liquidity,
            marketCap: data.marketCap,
            volume24h: data.volume24h,
            volume1h: data.volume1h,
            volume5m: data.volume5m,
        });
        // Get native token USD price for priceNative calculation
        const nativeAddress = '0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c';
        let priceNative = 0;
        try {
            const nativeRes = await fetch(`https://screener.deserialize.xyz/tokens/${nativeAddress}`);
            if (nativeRes.ok) {
                const nativeResponse = await nativeRes.json();
                if (nativeResponse.success) {
                    const nativeUsdPrice = nativeResponse.data.price;
                    priceNative = data.price / nativeUsdPrice;
                    console.log('Calculated priceNative:', priceNative);
                }
            }
        }
        catch (nativeError) {
            console.error('Failed to fetch native token price:', nativeError);
        }
        // Function to fetch chart and calculate change for a period
        const calculateChangeForInterval = async (interval, timeMs) => {
            try {
                const chartUrl = `https://screener.deserialize.xyz/tokens/${tokenAddress}/chart?interval=${interval}`;
                const chartRes = await fetch(chartUrl);
                if (!chartRes.ok)
                    return 0;
                const chartResponse = await chartRes.json();
                if (!chartResponse.success ||
                    !chartResponse.data.prices ||
                    chartResponse.data.prices.length < 2) {
                    return 0;
                }
                const prices = chartResponse.data.prices;
                const lastPrice = prices[prices.length - 1].price;
                const now = Date.now();
                let oldPrice = 0;
                for (let i = prices.length - 2; i >= 0; i--) {
                    if (now - prices[i].timestamp >= timeMs) {
                        oldPrice = prices[i].price;
                        break;
                    }
                }
                if (oldPrice > 0 && lastPrice > 0) {
                    return ((lastPrice - oldPrice) / oldPrice) * 100;
                }
            }
            catch (chartError) {
                console.error(`Failed to calculate ${interval} change:`, chartError);
            }
            return 0;
        };
        // Calculate changes
        const [m5Change, h1Change, h24Change] = await Promise.all([
            calculateChangeForInterval('5m', 5 * 60 * 1000),
            calculateChangeForInterval('1h', 60 * 60 * 1000),
            calculateChangeForInterval('1d', 24 * 60 * 60 * 1000),
        ]);
        console.log('Calculated changes:', {
            m5: m5Change,
            h1: h1Change,
            h24: h24Change,
        });
        // Get socials from known if available
        const tokenLower = tokenAddress.toLowerCase();
        const knownSocials = KNOWN_TOKEN_DETAILS[tokenLower]?.socials || {
            telegramUrl: '',
            twitterUrl: '',
            websiteUrl: '',
        };
        const result = {
            name: data.name || tokenDetails.name,
            symbol: data.symbol || tokenDetails.symbol,
            address: tokenAddress,
            priceUsd: data.price,
            priceNative: priceNative,
            mc: data.marketCap,
            telegramUrl: knownSocials.telegramUrl,
            twitterUrl: knownSocials.twitterUrl,
            websiteUrl: knownSocials.websiteUrl,
            volume: {
                m5: data.volume5m || 0,
                h1: data.volume1h || 0,
                h24: data.volume24h || 0,
            },
            change: {
                m5: m5Change,
                h1: h1Change,
                h24: h24Change,
            },
            chain: chain.name,
            liquidityInUsd: data.liquidity || 0,
        };
        console.log('Final result:', result);
        return result;
    }
    catch (error) {
        console.error('Error in getCustomTokenDataForEvmChainUsingUniSwapV30g:', error);
        return null;
    }
};
//# sourceMappingURL=token.service.js.map