/* eslint-disable */
import { ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';

export const getUniswapQuote = async (
  userRpcProvider: ethers.providers.StaticJsonRpcProvider,
  userChainId: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  tokenInDecimals: string,
  tokenOutDecimals: string
) => {
  console.log('Starting Uniswap quote calculation...');
  const { UNISWAP_V3_QUOTER } = getAddressesByChainId(userChainId);
  console.log('Using Uniswap V3 Quoter address:', UNISWAP_V3_QUOTER);

  const uniswapV3QuoterInterface = new ethers.utils.Interface([
    'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  ]);
  const FEE_TIERS = [3000, 500]; // Supported fee tiers (0.3% and 0.05%)
  console.log(
    'Supported fee tiers:',
    FEE_TIERS.map((fee) => `${fee / 10000}%`)
  );

  // Convert amountIn to wei using provided decimals
  const amountInWei = ethers.utils.parseUnits(amountIn, tokenInDecimals);
  console.log('amountIn conversion:', {
    decimals: tokenInDecimals,
    formatted: ethers.utils.formatUnits(amountInWei, tokenInDecimals),
    original: amountIn,
    wei: amountInWei.toString(),
  });

  let bestQuote = null;
  let bestFee = null;

  for (const fee of FEE_TIERS) {
    try {
      const quoteParams = {
        fee,
        amountIn: amountInWei.toString(),
        sqrtPriceLimitX96: 0,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
      };

      console.log(`Attempting quote with fee tier ${fee / 10000}%...`);
      console.log('Quote parameters:', quoteParams);

      const quote = await userRpcProvider.call({
        data: uniswapV3QuoterInterface.encodeFunctionData('quoteExactInputSingle', [quoteParams]),
        to: UNISWAP_V3_QUOTER!,
      });

      console.log('Raw quote response:', quote);

      const [amountOut] = uniswapV3QuoterInterface.decodeFunctionResult(
        'quoteExactInputSingle',
        quote
      );
      const currentQuote = ethers.BigNumber.from(amountOut);

      // Skip if quote is 0
      if (currentQuote.isZero()) {
        console.log(`Quote is 0 for fee tier ${fee / 10000}% - skipping`);
        continue;
      }

      const formattedQuote = ethers.utils.formatUnits(currentQuote, tokenOutDecimals);
      console.log(`Quote for fee tier ${fee / 10000}%:`, {
        formatted: formattedQuote,
        raw: currentQuote.toString(),
      });

      if (!bestQuote || currentQuote.gt(bestQuote)) {
        bestQuote = currentQuote;
        bestFee = fee;
        console.log(`New best quote found with fee tier ${fee / 10000}%: ${formattedQuote}`);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; reason?: string };
      if (err.reason === 'Unexpected error') {
        console.log(`No pool found for fee tier ${fee / 10000}%`);
      } else {
        console.log(`Failed to get quote for fee tier ${fee / 10000}%`, err.message);
        console.trace('Debug: Quoter call failed for fee tier:', fee, error);
        console.trace('Error details:', {
          code: err.code,
          message: err.message,
          reason: err.reason,
        });
      }
      continue;
    }
  }

  if (!bestQuote || !bestFee) {
    console.error('Failed to get any valid quotes');
    throw new Error(
      'Failed to get quote from Uniswap V3. No valid pool found for this token pair or quote returned 0.'
    );
  }

  console.log('amountOut conversion:', {
    decimals: tokenOutDecimals,
    formatted: ethers.utils.formatUnits(bestQuote, tokenOutDecimals),
    amountInSmallestUnit: ethers.utils
      .parseUnits(bestQuote.toString(), tokenOutDecimals)
      .toString(),
  });

  // Calculate minimum output with 0.5% slippage tolerance
  const slippageTolerance = 0.005;
  const amountOutMin = bestQuote.mul(1000 - slippageTolerance * 1000).div(1000);
  console.log('Final quote details:', {
    bestFee: `${bestFee / 10000}%`,
    bestQuote: {
      formatted: ethers.utils.formatUnits(bestQuote, tokenOutDecimals),
      raw: bestQuote.toString(),
    },
    minimumOutput: {
      formatted: ethers.utils.formatUnits(amountOutMin, tokenOutDecimals),
      raw: amountOutMin.toString(),
    },
    slippageTolerance: `${slippageTolerance * 100}%`,
  });

  return { amountOutMin, bestFee, bestQuote };
};
