# Citrea to Sepolia Bridge

## Project Overview

This project is a one-way bridge that allows users to transfer cBTC (Citrea Bitcoin) to Sepolia ETH. It's a simple demonstration of cross-chain functionality between the Citrea devnet and the Sepolia testnet.

## How It Works

1. Users lock their cBTC on the Citrea network.
2. A bridge operator monitors these lock events.
3. The operator then releases an equivalent amount of ETH on the Sepolia network.

## Main Components

1. **LockCBTC Contract (on Citrea)**

   - Allows users to lock their cBTC.
   - Emits an event when cBTC is locked.

2. **ReleaseSepETH Contract (on Sepolia)**

   - Releases ETH to users after their cBTC is locked on Citrea.

3. **Bridge Operator**

   - Monitors events on Citrea.
   - Triggers ETH release on Sepolia.

4. **User Interface**
   - A simple web app for users to lock their cBTC.

## How to Use

1. Connect your wallet to the Citrea network.
2. Enter the amount of cBTC you want to bridge.
3. Click "Bridge" button and confirm the transaction.
4. Wait for the bridge operator to process your transaction.
5. Receive your ETH on the Sepolia network.

## Technical Details

- Built with Next.js and TypeScript
- Uses wagmi for blockchain interactions
- Smart contracts written in Solidity deployed on Citrea and Seploia testnets

## Future Improvements

- Add reverse bridging (Sepolia to Citrea)
- Implement better security measures
