# MemeStory 🍌

MemeStory is an AI-powered platform for creating, remixing, and registering memes as IP Assets on the Story Protocol.

## Features

- **AI Generation**: Create hilarious memes instantly from text prompts using Google Gemini 2.0 Flash.
- **Canvas Editor**: Drag, drop, and edit text on your memes.
- **Story Protocol Integration**: Register your creations as IP Assets on the Aeneid Testnet.
- **RainbowKit & Wagmi**: seamless wallet connection experience.
- **Responsive Design**: Works on desktop and mobile.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **AI Model**: Gemini 2.0 Flash Experimental
- **Blockchain**: Story Protocol SDK, Viem, Wagmi, RainbowKit

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/memestory.git
    cd memestory
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    # or
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
    ```

4.  **Run the development server**:
    ```bash
    bun run dev
    # or
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

MIT
