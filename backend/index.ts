import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatEther,
  http,
  parseEther,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { LOCK_CBTC_ADDRESS, ReleaseSepETH_ADDRESS } from "./constant/contract";
import { LockCBTCAbi, ReleaseSepETHAbi } from "./constant/abi";
import { sepolia } from "viem/chains";
import dotenv, { parse } from "dotenv";

dotenv.config({
  path: "./.env",
});

console.log(process.env.PRIVATE_KEY);
if (!process.env.PRIVATE_KEY) {
  console.log("please set PRIVATE_KEY in.env");
  process.exit(1);
}

const operatorAccount = privateKeyToAccount(
  process.env.PRIVATE_KEY as `0x${string}`
);

const citreaDevnet: Chain = defineChain({
  id: 62298,
  name: "Citrea Devnet",
  nativeCurrency: { name: "Citrea BTC", symbol: "cBTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.devnet.citrea.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Citrea Explorer",
      url: "https://explorer.devnet.citrea.xyz",
    },
  },
  testnet: true,
});

const citreaDevnetPublicClient = createPublicClient({
  chain: citreaDevnet,
  transport: http("https://rpc.devnet.citrea.xyz"),
});

const citreaDevnetClient = createWalletClient({
  account: operatorAccount,
  chain: citreaDevnet,
  transport: http("https://rpc.devnet.citrea.xyz"),
});

const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(""),
});

const sepoliaClient = createWalletClient({
  account: operatorAccount,
  chain: sepolia,
  transport: http(""),
});

async function main() {
  try {
    // listner on the citrea devnet for the cBTC cdeposit / lock event
    const unwatchCitrea = citreaDevnetPublicClient.watchContractEvent({
      address: LOCK_CBTC_ADDRESS,
      abi: LockCBTCAbi,
      eventName: "CBTCLocked",
      onLogs: (logs) => {
        logs.forEach((log) => {
          console.log("Event logged on citrea devnet", log);
          if (log.args.amount && log.args.user && log.args.lockId) {
            handleReleaseETH({
              user: log.args.user,
              amount: log.args.amount,
              lockId: log.args.lockId,
            });
          } else {
            console.log("invalid event");
          }
        });
      },
    });

    console.log("listening to events on citrea devnet...");
  } catch (e) {
    console.log("error", e);
  }
}

async function handleReleaseETH({
  user,
  amount,
  lockId,
}: {
  user: `0x${string}`;
  amount: bigint;
  lockId: `0x${string}`;
}) {
  // take the amount in cBTC
  const amountIncBTC = formatEther(amount);

  // use some oracle like binance API to get the conversion from BTC  -> ETH
  const result = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=ETHBTC"
  );
  const btcPrice = ((await result.json()) as any).price;
  console.log("btcPrice", btcPrice);

  const amountInETH: number = Number(amountIncBTC) / Number(btcPrice);
  console.log("amountInETH", amountInETH);

  // release ETH for the use
  const data = await sepoliaPublicClient.simulateContract({
    account: operatorAccount,
    address: ReleaseSepETH_ADDRESS,
    abi: ReleaseSepETHAbi,
    functionName: "releaseETH",
    args: [user, parseEther(amountInETH.toString())],
  });

  const hash = await sepoliaClient.writeContract(data.request);

  const tx = await sepoliaPublicClient.waitForTransactionReceipt({
    hash,
  });
  console.log("tx for releasing sepETH", tx);

  // mark processLock
  const data2 = await citreaDevnetPublicClient.simulateContract({
    account: operatorAccount,
    address: LOCK_CBTC_ADDRESS,
    abi: LockCBTCAbi,
    functionName: "processLock",
    args: [lockId],
  });

  const hash2 = await citreaDevnetClient.writeContract(data2.request);

  const tx2 = await citreaDevnetPublicClient.waitForTransactionReceipt({
    hash: hash2,
  });

  console.log("tx for marking processLock", tx2);
}

main();
