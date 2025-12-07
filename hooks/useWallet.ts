import { useAccount, useWalletClient } from "wagmi";

export function useWallet() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    // Shim connect/isConnecting for backward compat if needed, 
    // but RainbowKit handles connection UI now.
    const connect = () => {
        // No-op or open RainbowKit modal if possible (via useConnectModal), 
        // but easier to rely on ConnectButton in UI.
        console.log("Use RainbowKit Connect Button");
    };

    return {
        address,
        isConnected,
        connect,
        isConnecting: false,
        client: walletClient
    };
}
