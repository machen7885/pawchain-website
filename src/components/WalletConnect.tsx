import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, ExternalLink, LoaderCircle, LogOut, Network, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

// Sepolia metadata is only used if the network is not already available in MetaMask.
const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

type RequestArguments = {
  method: string;
  params?: readonly unknown[] | Record<string, unknown>;
};

type ProviderRpcError = Error & { code?: number };

interface EthereumProvider {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request<T = unknown>(args: RequestArguments): Promise<T>;
  on(event: "accountsChanged", listener: (accounts: string[]) => void): void;
  on(event: "chainChanged", listener: (chainId: string) => void): void;
  removeListener(event: "accountsChanged", listener: (accounts: string[]) => void): void;
  removeListener(event: "chainChanged", listener: (chainId: string) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function getMetaMaskProvider(): EthereumProvider | null {
  const injectedProvider = window.ethereum;
  if (!injectedProvider) return null;

  // Some browsers expose several injected wallets; choose MetaMask explicitly.
  if (injectedProvider.providers?.length) {
    return injectedProvider.providers.find((provider) => provider.isMetaMask) ?? null;
  }

  return injectedProvider.isMetaMask ? injectedProvider : null;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function rpcErrorCode(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? Number((error as ProviderRpcError).code)
    : undefined;
}

function walletErrorMessage(error: unknown, fallback: string): string {
  const code = rpcErrorCode(error);
  if (code === 4001) return "The request was cancelled in MetaMask.";
  if (code === -32002) return "A MetaMask request is already open. Check your wallet.";
  return fallback;
}

async function requestSepolia(provider: EthereumProvider): Promise<void> {
  try {
    // MetaMask always asks the user to approve a network switch.
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (error) {
    if (rpcErrorCode(error) !== 4902) throw error;

    // Error 4902 means Sepolia is unknown to this wallet, so add it first.
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [SEPOLIA_NETWORK],
    });
  }
}

export function WalletConnect(): JSX.Element {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshWalletState = useCallback(async (provider: EthereumProvider) => {
    // eth_accounts reads existing permission without opening a wallet popup.
    const [accounts, currentChain] = await Promise.all([
      provider.request<string[]>({ method: "eth_accounts" }),
      provider.request<string>({ method: "eth_chainId" }),
    ]);
    setAccount(accounts[0] ?? null);
    setChainId(currentChain);
  }, []);

  useEffect(() => {
    const provider = getMetaMaskProvider();
    setInstalled(Boolean(provider));
    if (!provider) return;

    void refreshWalletState(provider).catch(() => {
      setMessage("MetaMask is installed but could not be reached.");
    });

    // Keep the UI synchronized when the user changes accounts inside MetaMask.
    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] ?? null);
      setMessage(accounts.length ? null : "Wallet disconnected.");
    };

    // Keep the network badge synchronized when MetaMask changes chain.
    const handleChainChanged = (nextChainId: string) => {
      setChainId(nextChainId);
      setMessage(nextChainId === SEPOLIA_CHAIN_ID ? null : "Switch to Sepolia to continue.");
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    // Remove provider listeners when this component leaves the page.
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [refreshWalletState]);

  const connect = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      setInstalled(false);
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      // Account access always requires an explicit approval inside MetaMask.
      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      setAccount(accounts[0] ?? null);

      // Ask MetaMask to switch to the test network required by PawChain.
      await requestSepolia(provider);
      await refreshWalletState(provider);
    } catch (error) {
      setMessage(walletErrorMessage(error, "Unable to connect MetaMask. Please try again."));
      await refreshWalletState(provider).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const switchToSepolia = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) return;

    setBusy(true);
    setMessage(null);
    try {
      await requestSepolia(provider);
      await refreshWalletState(provider);
    } catch (error) {
      setMessage(walletErrorMessage(error, "Could not switch to Sepolia."));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) return;

    setBusy(true);
    setMessage(null);
    try {
      // Revoke this site's account permission when the injected wallet supports it.
      await provider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
      setAccount(null);
      setMessage("Wallet disconnected.");
    } catch (error) {
      const code = rpcErrorCode(error);
      if (code === 4200 || code === -32601) {
        // Older providers cannot revoke permissions; clear only this page's session state.
        setAccount(null);
        setMessage("Disconnected from this page. Remove site access in MetaMask if needed.");
      } else {
        setMessage(walletErrorMessage(error, "Could not disconnect MetaMask."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (installed === false) {
    return <div className="relative flex items-center gap-2">
      <Button size="sm" variant="outline" asChild>
        <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
          <Wallet className="h-4 w-4" /> Install MetaMask <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
      <p className="wallet-message" role="status">MetaMask is not installed.</p>
    </div>;
  }

  if (!account) {
    return <div className="relative">
      <Button size="sm" onClick={connect} disabled={busy || installed === null}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {busy ? "Connecting…" : "Connect wallet"}
      </Button>
      {message && <p className="wallet-message" role="status"><AlertCircle className="h-3.5 w-3.5" />{message}</p>}
    </div>;
  }

  const onSepolia = chainId === SEPOLIA_CHAIN_ID;
  return <div className="relative flex items-center gap-2">
    {!onSepolia && <Button size="sm" variant="outline" onClick={switchToSepolia} disabled={busy}>
      <Network className="h-4 w-4" /> Switch to Sepolia
    </Button>}
    <Button
      size="sm"
      variant="outline"
      onClick={disconnect}
      disabled={busy}
      title={`${account} — click to disconnect`}
      aria-label={`Connected wallet ${account}. Disconnect wallet.`}
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : onSepolia ? <Check className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-amber-300" />}
      <span className="font-mono text-[11px]">{shortAddress(account)}</span>
      <LogOut className="h-3.5 w-3.5 opacity-45" />
    </Button>
    {message && <p className="wallet-message" role="status">{message}</p>}
  </div>;
}
