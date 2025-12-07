"use server";

import axios from 'axios';
import FormData from 'form-data';

// Helper to upload to Pinata
// Accepts Buffer or Base64 string
export async function uploadToPinata(fileData: Buffer | string, filename: string): Promise<string> {
    const formData = new FormData();

    let buffer: Buffer;
    if (typeof fileData === 'string') {
        // If it's a base64 data URI, strip prefix
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
