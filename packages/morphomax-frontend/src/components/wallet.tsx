import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { LogOut, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Box, BoxDescription, BoxTitle } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { JwtContext } from '@/contexts/jwt';
import { useChain } from '@/hooks/useChain';

const formatAddress = (address: string | undefined) => {
  if (!address) return 'Loading...';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const Wallet: React.FC = () => {
  const { chain, provider, usdcContract } = useChain();
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { authInfo, logOut } = useContext(JwtContext);

  // Function to fetch PKP usdcBalance directly using ethers.js
  const fetchPkpBalances = useCallback(async () => {
    if (!authInfo?.pkp.ethAddress) return;

    try {
      setIsLoadingBalance(true);
      setError(null);

      const [nativeBalance, usdcBalance] = await Promise.all([
        provider.getBalance(authInfo?.pkp.ethAddress),
        usdcContract.balanceOf(authInfo?.pkp.ethAddress),
      ]);

      // Set human-readable balances
      setNativeBalance(ethers.utils.formatEther(nativeBalance));
      setUsdcBalance(ethers.utils.formatUnits(usdcBalance, 6));

      setIsLoadingBalance(false);
    } catch (err: unknown) {
      console.error('Error fetching PKP usdcBalance:', err);
      setError(`Failed to fetch wallet balance`);
      setIsLoadingBalance(false);
    }
  }, [authInfo, provider, usdcContract]);

  useEffect(() => {
    fetchPkpBalances();
  }, [fetchPkpBalances]);

  return (
    <Card data-test-id="wallet" className="w-full bg-white p-6 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Wallet</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="text-center">
        <Box className="flex flex-row items-center justify-between">
          <BoxTitle>Wallet Address:</BoxTitle>

          <a
            href={`${chain.blockExplorerUrls[0]}/address/${authInfo?.pkp.ethAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            title={authInfo?.pkp.ethAddress}
          >
            {formatAddress(authInfo?.pkp.ethAddress)}
          </a>
        </Box>

        <Separator />

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>Network:</BoxDescription>
          <Badge>{chain.name}</Badge>
        </Box>

        <Separator />

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>USDC Balance:</BoxDescription>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {isLoadingBalance ? 'Loading...' : `${parseFloat(usdcBalance).toFixed(4)} USDC`}
          </span>
        </Box>

        <Box className="flex flex-row items-stretch justify-between">
          <BoxDescription>ETH Balance:</BoxDescription>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {isLoadingBalance
              ? 'Loading...'
              : `${parseFloat(nativeBalance).toFixed(4)} ${chain.symbol}`}
          </span>
        </Box>

        {error && (
          <div
            style={{
              backgroundColor: '#fff1f0',
              color: '#ff4d4f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span role="img" aria-label="Error">
              ⚠️
            </span>{' '}
            {error}
          </div>
        )}

        <Button className="w-full" disabled={isLoadingBalance} onClick={fetchPkpBalances}>
          {isLoadingBalance ? (
            <>
              <Spinner variant="destructive" size="sm" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCcw /> Refresh Balance
            </>
          )}
        </Button>
        <Button className="w-full my-1" variant="destructive" onClick={logOut}>
          <LogOut /> Log Out
        </Button>
      </CardContent>
    </Card>
  );
};
