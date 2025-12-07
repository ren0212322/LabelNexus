"use server";

import { createPublicClient, http, parseAbi } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { aeneid, StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import axios from 'axios';
import FormData from 'form-data';

const publicClient = createPublicClient({
    chain: aeneid as any,
    transport: http()
});

const SPG_NFT_ABI = parseAbi([
    'function totalSupply() view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    // Registry specific (ERC721Enumberable)
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
]);

export interface GalleryItem {
    id: string;
    tokenId: string;
    image: string;
    title: string;
    description: string;
    owner: string;
    contract: string;
}

export async function fetchCollectionItems(collectionAddress: string, limit: number = 20): Promise<{ items: GalleryItem[], error?: string }> {
    try {
        if (!collectionAddress || !collectionAddress.startsWith('0x')) {
            return { items: [], error: "Invalid address" };
        }

        const isWallet = await isEOA(collectionAddress);

        let targetContract: `0x${string}` = collectionAddress as `0x${string}`;
        let isRegistrySearch = false;

        if (isWallet) {
            return {
                items: [],
                error: "Wallet Indexing Unavailable: Please search by your SPG Collection Address instead. Browsing by wallet requires an external Indexer (e.g. The Graph) which isn't currently integrated."
            };
        } else {

            // Verify it is a valid contract if it's not a wallet
            const code = await publicClient.getBytecode({ address: collectionAddress as `0x${string}` });
            if (!code) return { items: [], error: "Invalid contract address." };
        }

        let totalItems = 0;
        try {
            if (isRegistrySearch) {
                const bal = await publicClient.readContract({
                    address: targetContract,
                    abi: SPG_NFT_ABI,
                    functionName: 'balanceOf',
                    args: [collectionAddress as `0x${string}`] // User address
                });
                totalItems = Number(bal);
            } else {
                const supply = await publicClient.readContract({
                    address: targetContract,
                    abi: SPG_NFT_ABI,
                    functionName: 'totalSupply'
                });
                totalItems = Number(supply);
            }
        } catch (e) {
            console.error("Error reading contract:", e);
            return { items: [], error: "Contract read failed. Ensure it is a valid SPG Collection or Wallet." };
        }

        if (totalItems === 0) return { items: [] };

        const promises = [];
        // Cap limit
        const fetchCount = Math.min(totalItems, limit);

        // For Registry: iterate 0 to fetchCount-1 (indices of owner)
        // For Collection: iterate totalSupply down to totalSupply-fetchCount (tokenIds)

        if (isRegistrySearch) {
            for (let i = 0; i < fetchCount; i++) {
                promises.push(fetchRegistryItem(targetContract, collectionAddress as `0x${string}`, i));
            }
        } else {
            const start = Math.max(1, totalItems - fetchCount + 1);
            for (let i = totalItems; i >= start; i--) {
                promises.push(fetchCollectionItem(targetContract, BigInt(i)));
            }
        }

        const results = await Promise.all(promises);
        return { items: results.filter(i => i !== null) as GalleryItem[] };

    } catch (e: any) {
        console.error("Error fetching items:", e);
        return { items: [], error: e.message || "Failed to fetch items" };
    }
}

async function isEOA(address: string): Promise<boolean> {
    const code = await publicClient.getBytecode({ address: address as `0x${string}` });
    return !code || code === '0x';
}

async function fetchRegistryItem(registryAddress: `0x${string}`, owner: `0x${string}`, index: number): Promise<GalleryItem | null> {
    try {
        const tokenId = await publicClient.readContract({
            address: registryAddress,
            abi: SPG_NFT_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [owner, BigInt(index)]
        });

        // The tokenId in Registry IS the IP ID (address as big int) usually, or it has metadata.
        // Let's get TokenURI
        const tokenUri = await publicClient.readContract({
            address: registryAddress,
            abi: SPG_NFT_ABI,
            functionName: 'tokenURI',
            args: [tokenId]
        });

        const metadata = await resolveMetadata(tokenUri);

        return {
            id: `ip-${tokenId}`,
            tokenId: tokenId.toString(),
            image: metadata.image || "",
            title: metadata.name || `IP Asset #${tokenId}`,
            description: metadata.description || "Registered IP Asset",
            owner: owner,
            contract: registryAddress // Showing Registry as contract
        };
    } catch (e) {
        console.error("Fetch registry item fail:", e);
        return null;
    }
}

async function fetchCollectionItem(contract: `0x${string}`, tokenId: bigint): Promise<GalleryItem | null> {
    try {
        const [tokenUri, owner] = await Promise.all([
            publicClient.readContract({ address: contract, abi: SPG_NFT_ABI, functionName: 'tokenURI', args: [tokenId] }),
            publicClient.readContract({ address: contract, abi: SPG_NFT_ABI, functionName: 'ownerOf', args: [tokenId] })
        ]);

        const metadata = await resolveMetadata(tokenUri);

        return {
            id: `${contract}-${tokenId}`,
            tokenId: tokenId.toString(),
            image: metadata.image || "",
            title: metadata.name || `Meme #${tokenId}`,
            description: metadata.description || "",
            owner: owner,
            contract: contract
        };
    } catch (e) {
        return null;
    }
}

async function resolveMetadata(uri: string): Promise<any> {
    if (!uri) return {};
    // Use a public gateway that is more reliable, or fallback
    let httpUri = uri;
    if (uri.startsWith('ipfs://')) {
        httpUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    try {
        const res = await axios.get(httpUri, { timeout: 5000 });
        const data = res.data;
        console.log("Resolved metadata:", data);

        let imageUrl = data.image || data.image_url || "";
        if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        data.image = imageUrl;

        return data;
    } catch (e) {
        console.error("Metadata fetch error:", e);
        return {};
    }
}

// Helper to upload to Pinata
// Accepts Buffer or Base64 string
export async function uploadToPinata(fileData: Buffer | string, filename: string): Promise<string> {
    const formData = new FormData();

    let buffer: Buffer;
    if (typeof fileData === 'string') {
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, 'base64');
    } else {
        buffer = fileData;
    }

    formData.append('file', buffer, { filename });

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
    });
    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
}

export async function uploadJSONToPinata(json: any): Promise<string> {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
        headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
    });
    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
}

