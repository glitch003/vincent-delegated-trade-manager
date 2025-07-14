import DataLoader from 'dataloader';
import Cache from 'node-cache';

import { wrapNodeCacheForDataloader } from './dataLoaderCache';

const cache = new Cache({ checkperiod: 0, stdTTL: 60, useClones: false });

export function assertEthereumPriceData(
  data: unknown
): asserts data is { ethereum: { usd: number } } {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: Expected an object');
  }

  // Check if the ethereum property exists and is an object
  const dataObj = data as Record<string, unknown>;
  if (!dataObj.ethereum || typeof dataObj.ethereum !== 'object' || dataObj.ethereum === null) {
    throw new Error('Invalid response: Missing or invalid "ethereum" property');
  }

  // Check if the usd property exists and is a number
  const ethereumObj = dataObj.ethereum as Record<string, unknown>;
  if (typeof ethereumObj.usd !== 'number') {
    throw new Error('Invalid response: Missing or invalid "ethereum.usd" property');
  }
}

// TODO: We should get a Coingecko API key for production
async function batchLoadFn(keys: readonly string[]): Promise<ArrayLike<number | Error>> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${keys}&vs_currencies=usd`
  );

  const data = await res.json();

  assertEthereumPriceData(data);

  return [data.ethereum.usd];
}

const loader = new DataLoader(batchLoadFn, {
  cacheMap: wrapNodeCacheForDataloader<number>(cache),
});

export const getEthereumPriceUsd = async (): Promise<number> => {
  const val = await loader.load('ethereum');

  if (!val || typeof val !== 'number') {
    throw new Error('Invalid response: Missing or invalid "ethereum.usd" property');
  }

  return val;
};
