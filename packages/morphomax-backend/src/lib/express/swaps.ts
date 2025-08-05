import { Response } from 'express';

import { VincentAuthenticatedRequest } from './types';
import { MorphoSwap } from '../mongo/models/MorphoSwap';

export const handleListSwapsRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const walletAddress = req.user.decodedJWT.payload.pkpInfo.ethAddress;

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
