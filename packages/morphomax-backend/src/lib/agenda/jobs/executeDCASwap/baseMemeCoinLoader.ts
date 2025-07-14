import consola from 'consola';
import DataLoader from 'dataloader';
import Cache from 'node-cache';

import { wrapNodeCacheForDataloader } from './dataLoaderCache';
import { env } from '../../../env';

const cache = new Cache({ checkperiod: 0, stdTTL: 60 * 10, useClones: false }); // 10 minute cache

const { COINRANKING_API_KEY } = env;

const logger = consola.withTag('CoinRankingLoader');

export interface Coin {
  coinAddress: string;
  name: string;
  price: string;
  symbol: string;
}

export function assertIsCoin(value: unknown): asserts value is Coin {
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as Coin).coinAddress !== 'string' ||
    typeof (value as Coin).name !== 'string' ||
    typeof (value as Coin).price !== 'string' ||
    typeof (value as Coin).symbol !== 'string'
  ) {
    throw new Error('Value is not a valid Coin object');
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function batchLoadFn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  keys: readonly string[]
): Promise<{ coins: ArrayLike<Coin | Error> }[]> {
  logger.debug('batchLoadFn()');

  const url = new URL('https://api.coinranking.com/v2/coins');
  url.searchParams.append('blockchains[]', 'base');
  url.searchParams.append('tags[]', 'meme');

  logger.info(`Fetching top coins from CoinRanking API: ${url.toString()}`);
  const response = await fetch(url, {
    headers: {
      'x-access-token': COINRANKING_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const { data, status } = (await response.json()) as {
    data: {
      coins: Array<{
        contractAddresses: string[];
        name: string;
        price: string;
        symbol: string;
      }>;
    };
    status: string;
  };

  if (status !== 'success') {
    throw new Error('API returned unsuccessful status');
  }

  const coins = data.coins.map((coin) => {
    const baseAddress = coin.contractAddresses.find((addr) =>
      addr.toLowerCase().startsWith('base/')
    );

    if (!baseAddress) {
      throw new Error(`No Base network address found for coin ${coin.symbol}`);
    }

    return {
      coinAddress: baseAddress.replace('base/', ''),
      name: coin.name,
      price: coin.price,
      symbol: coin.symbol,
    };
  });

  return [{ coins }];
}

const loader = new DataLoader(batchLoadFn, {
  cacheMap: wrapNodeCacheForDataloader<{ coins: Coin[] }>(cache),
});

export const getTopBaseMemeCoin = async () => {
  logger.debug(`getTopBaseMemeCoin()`);

  const topCoins = (await loader.load('topCoins')).coins;
  logger.debug(
    `Loaded ${topCoins.length} coins from CoinRanking API - top coin is ${topCoins[0].name}`
  );
  assertIsCoin(topCoins[0]);
  return topCoins[0];
};
