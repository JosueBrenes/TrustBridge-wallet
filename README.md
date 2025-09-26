# TrustBridge Wallet

A secure and modern Stellar wallet built with Next.js, featuring passkey authentication and comprehensive DeFi capabilities.

## Overview

TrustBridge Wallet is a web-based cryptocurrency wallet designed for the Stellar network. It provides users with a secure, intuitive interface to manage their digital assets, perform transactions, and access decentralized finance (DeFi) features. The wallet emphasizes security through modern authentication methods including passkey support and traditional secret key management.

## Features

### Core Wallet Functionality
- **Multi-Authentication Support**: Connect using passkeys, create new wallets, or import existing ones
- **Asset Management**: View and manage multiple Stellar assets including XLM and custom tokens
- **Balance Tracking**: Real-time balance updates with auto-refresh capabilities
- **Transaction History**: Complete transaction tracking and history

### Transaction Capabilities
- **Send Payments**: Send XLM and other Stellar assets to any address
- **Receive Funds**: Generate QR codes for easy payment reception
- **Asset Swapping**: Built-in swap functionality for XLM to USDC and other assets
- **Testnet Support**: Full testnet integration with friendbot funding

### DeFi Integration
- **Staking Options**: Access to staking opportunities through integrated platforms
- **Liquidity Provision**: Participate in liquidity pools
- **Market Data**: Real-time price information and market spreads
- **External DeFi Access**: Direct links to popular DeFi platforms like Aquarius

### Security Features
- **Passkey Authentication**: Modern biometric authentication support
- **Secure Key Management**: Local storage of encrypted wallet credentials
- **Network Security**: Secure communication with Stellar network
- **Testnet Environment**: Safe testing environment for development

## Technology Stack

### Frontend
- **Next.js 15.5.4**: React framework with App Router
- **React 19.1.0**: Latest React version
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library

### Stellar Integration
- **Stellar SDK**: Official Stellar JavaScript SDK
- **Freighter API**: Browser wallet integration
- **Blend Capital SDK**: DeFi protocol integration
- **Defindex SDK**: Additional DeFi capabilities

### State Management & UI
- **Zustand**: Lightweight state management
- **TanStack Query**: Data fetching and caching
- **Framer Motion**: Animation library
- **Sonner**: Toast notifications
- **QR Code Libraries**: QR code generation and scanning

## Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/TrustBridge/Trustbridge-wallet.git
   cd Trustbridge-wallet
   ```

2. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Started

1. **Connect Your Wallet**
   - Use passkey authentication for secure biometric login
   - Create a new wallet with password protection
   - Import an existing wallet using your secret key

2. **Fund Your Account** (Testnet)
   - Click "Get Test Funds" to receive testnet XLM
   - Use the friendbot integration for instant funding

3. **Manage Assets**
   - View your asset portfolio on the dashboard
   - Track balances in real-time
   - Monitor multiple Stellar assets

4. **Perform Transactions**
   - Send payments to other Stellar addresses
   - Generate QR codes for receiving payments
   - Swap between different assets
   - View transaction history

5. **Access DeFi Features**
   - Explore staking opportunities
   - Participate in liquidity pools
   - Access external DeFi platforms

### Navigation

The wallet interface includes:
- **Dashboard**: Overview of assets and balances
- **Assets**: Detailed asset management
- **Send/Receive**: Transaction functionality
- **Swap**: Asset exchange features
- **History**: Transaction records
- **Staking**: DeFi staking options
- **Liquidity**: Liquidity pool participation

## Development

### Available Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run lint`: Run ESLint for code quality

### Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── services/        # External service integrations
│   └── stores/          # Zustand state stores
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

### Key Components

- **WalletConnect**: Authentication and wallet connection
- **WalletDashboard**: Main dashboard interface
- **PasskeyModal**: Passkey authentication flow
- **Transaction Modals**: Send, receive, and swap interfaces
- **Asset Management**: Token listing and management

## Contributing

We welcome contributions to TrustBridge Wallet. Please refer to our contributing guidelines:

- [Contributing Guidelines](.github/CONTRIBUTING.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)

## Security

TrustBridge Wallet prioritizes security:
- All sensitive operations are performed client-side
- Private keys never leave your device
- Secure communication with Stellar network
- Regular security audits and updates

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review existing GitHub issues
- Create a new issue for bug reports or feature requests

## Roadmap

Future development includes:
- Additional DeFi protocol integrations
- Mobile application development
- Enhanced security features
- Multi-network support
- Advanced trading features

---

**Note**: This wallet is currently configured for Stellar testnet. Always verify network settings before performing transactions with real assets.
