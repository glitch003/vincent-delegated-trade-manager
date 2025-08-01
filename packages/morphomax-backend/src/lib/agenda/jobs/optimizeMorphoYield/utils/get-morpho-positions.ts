import { getUsersPositions, type UserPositionItem } from '../morphoLoader';

export async function getMorphoPositions({
  chainId,
  walletAddress,
}: {
  chainId: number;
  walletAddress: string;
}): Promise<UserPositionItem | undefined> {
  const usersPositions = await getUsersPositions({
    where: {
      chainId_in: [chainId],
      shares_gte: 1, // Only consider vaults with more than 1 share. This field is an integer so it is basically asking for more than 0
      userAddress_in: [walletAddress],
    },
  });
  const userPositions = usersPositions[0]; // Applying the userAddress_in filter should return only one user

  return userPositions;
}
