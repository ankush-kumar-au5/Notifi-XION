'use client';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
  Abstraxion,
} from '@burnt-labs/abstraxion';
import { useCallback, useEffect, useState } from 'react';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import {
  NotifiCardModal,
  NotifiContextProvider,
} from '@notifi-network/notifi-react';
import '@burnt-labs/abstraxion/dist/index.css';
import '@burnt-labs/ui/dist/index.css';
import '@notifi-network/notifi-react/dist/index.css';

export const useXion = () => {
  const [walletKeys, setWalletKeys] = useState<any>(null);
  const { data: account } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const [, setShowModal]: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ] = useModal();

  const fetchAccountData = async () => {
    if (!client?.granteeAddress || !account?.bech32Address)
      return setWalletKeys(null);

    const accountData = await client.getGranteeAccountData();
    const pubKey = accountData
      ? Buffer.from(accountData.pubkey).toString('base64')
      : '';
    const walletKeys = {
      grantee: client.granteeAddress,
      bech32: account.bech32Address,
      base64: pubKey,
    };
    setWalletKeys(walletKeys);
    setShowModal(false);
  };

  useEffect(() => {
    fetchAccountData();
  }, [client?.granteeAddress, account?.bech32Address]);

  const connectWallet = async () => {
    setShowModal(true);
    return null;
  };

  const disconnectWallet = () => {
    setWalletKeys(null);
    logout?.();
    setShowModal(false);
  };

  const signArbitrary = useCallback(
    async (message: string): Promise<string | undefined> => {
      if (!signArb || !walletKeys) {
        return;
      }

      try {
        const signature = await signArb(walletKeys.grantee, message);

        return signature;
      } catch (e) {
        console.error(e);
      }
    },
    [signArb, walletKeys]
  );

  return {
    walletKeys,
    isWalletInstalled: true,
    connectWallet,
    signArbitrary,
    disconnectWallet,
  };
};

const contractsAddress =
  'xion1z70cvc08qv5764zeg3dykcyymj5z6nu4sqr7x8vl4zjef2gyp69s9mmdka';

export function Card() {
  const { walletKeys, connectWallet, signArbitrary } = useXion();
  console.log({ walletKeys });

  const walletPublicKey = walletKeys?.base64 ?? '';
  const signingAddress = walletKeys?.grantee ?? '';
  const signingPubkey = walletKeys?.bech32 ?? '';

  const signMessage = async (message: Uint8Array): Promise<string> => {
    const messageString = Buffer.from(message).toString('utf8');
    const result = await signArbitrary(messageString);
    if (!result) throw new Error('ERROR: invalid signature');

    return Buffer.from(result, 'base64') as unknown as string;
  };

  return (
    <>
      <Abstraxion
        onClose={() => {
          // setShowModal(false);
        }}
      />

      {!walletKeys ? (
        <button onClick={connectWallet}>Connect</button>
      ) : (
        <NotifiContextProvider
          tenantId={'oz8i6ad57zabbau507xi'}
          env={'Production'}
          walletBlockchain={'XION'}
          walletPublicKey={walletPublicKey}
          signingAddress={signingAddress}
          signingPubkey={signingPubkey}
          signMessage={signMessage}
          cardId={'694bb6b2990d4e5bad2049516f2c7cbf'}
          message=""
        >
          <NotifiCardModal darkMode={true} />
        </NotifiContextProvider>
      )}
    </>
  );
}

export default function Home() {
  return (
    <>
      <AbstraxionProvider
        config={{
          contracts: [contractsAddress],
        }}
      >
        <Card />
      </AbstraxionProvider>
    </>
  );
}
