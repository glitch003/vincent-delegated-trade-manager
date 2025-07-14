export type AddressSet = {
  ETH_USD_CHAINLINK_FEED?: string;
  SPENDING_LIMIT_ADDRESS?: string;
  UNISWAP_V3_QUOTER?: string;
  UNISWAP_V3_ROUTER?: string;
  WETH_ADDRESS?: string;
};

const addressMap: Record<string, AddressSet> = {
  '1': {
    /**
     * Source:
     * https://docs.chain.link/data-feeds/price-feeds/addresses/?network=ethereum&page=1&search=ETH%2FUSD
     */
    ETH_USD_CHAINLINK_FEED: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    UNISWAP_V3_QUOTER: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    UNISWAP_V3_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    WETH_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  '8453': {
    UNISWAP_V3_QUOTER: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    UNISWAP_V3_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481',
    WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
  },
  '42161': {
    UNISWAP_V3_QUOTER: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    UNISWAP_V3_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    WETH_ADDRESS: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  '175188': {
    SPENDING_LIMIT_ADDRESS: '0x2d043f8c6b80ea6396a51dc6333027fbdb8343a3',
  },
};

export const getAddressesByChainId = (chainId: string): AddressSet => {
  const addresses = addressMap[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
};
