import { Response } from 'express';

import { MorphoSwap } from '../mongo/models/MorphoSwap';

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-app-sdk';

export const handleListPurchasesRoute = async (
  req: ExpressAuthHelpers['AuthenticatedRequest'],
  res: Response
) => {
  const walletAddress = req.user.decodedJWT.payload.pkp.ethAddress;

  const swaps = await MorphoSwap.find({ walletAddress })
    .sort({
      purchasedAt: -1,
    })
    .lean();

  if (swaps.length === 0) {
    res.status(404).json({ error: `No morpho swaps found for wallet address ${walletAddress}` });
    return;
  }

  res.json({ data: swaps, success: true });
};
