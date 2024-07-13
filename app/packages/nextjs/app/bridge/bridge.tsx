"use client";

import { useEffect, useState } from "react";
import { lockCBTCABI } from "./abi";
import { parseUnits } from "viem";
import { useAccount, useChains, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const LOCK_CBTC_ADDRESS = "0x431F7c3D6AD7eB1509792cC09aaA57EF220EbC90";
const ReleaseSepETH_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

export function Bridge() {
  const [amount, setAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [error, setError] = useState("");
  const [transactionInitiated, setTransactionInitiated] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract: lockContract, isPending: isLocking, error: lockDataError, data: txHash } = useWriteContract();
  // const { chain } = use();

  useEffect(() => {
    const fetchPrice = async () => {
      if (amount && !isNaN(Number(amount))) {
        try {
          const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHBTC");
          const data = await response.json();
          const btcPrice = Number(data.price);
          const ethAmount = Number(amount) / btcPrice;
          setEthAmount(ethAmount.toFixed(6));
        } catch (error) {
          console.error("Error fetching price:", error);
        }
      } else {
        setEthAmount("");
      }
    };

    fetchPrice();
  }, [amount]);

  const handleLock = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError("Please enter a valid amount");
      return;
    }

    if (!publicClient || !address) {
      setError("Please connect your wallet");
      return;
    }

    const balance = await publicClient.getBalance({
      address: address,
    });

    const convertedAmount = parseUnits(amount, 18);

    if (balance && convertedAmount > balance) {
      setError("Insufficient balance");
      return;
    }

    try {
      console.log("Initiating lockContract...");
      const tx = await lockContract({
        address: LOCK_CBTC_ADDRESS,
        abi: lockCBTCABI,
        functionName: "lockCBTC",
        args: [convertedAmount],
        value: convertedAmount,
      });

      setTransactionInitiated(true);
    } catch (err) {
      console.error("Error during transaction:", err);
      setError(`Error during transaction: ${err || "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 max-w-2xl w-[500px] mx-auto min-h-[80vh]">
      <div className="bg-white px-6 py-5 rounded-lg space-y-5 w-full shadow-xl border border-gray-300">
        <h2 className="text-lg font-semibold pb-1">Bridge cBTC to Sepolia ETH</h2>

        <div className="relative bg-inherit w-full">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount of cBTC to bridge"
            className="peer bg-transparent h-10 w-full rounded-lg text-gray-800 placeholder-transparent ring-2 px-2 ring-gray-800 focus:ring-sky-600 focus:outline-none focus:border-rose-600"
          />
          <label
            htmlFor="username"
            className="absolute cursor-text left-0 -top-3 text-sm text-gray-800 bg-inherit mx-1 px-1 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-800 peer-placeholder-shown:top-2 peer-focus:-top-3 peer-focus:text-sky-600 peer-focus:text-sm transition-all"
          >
            Amount of cBTC to bridge
          </label>
        </div>

        {ethAmount && (
          <div className="text-sm text-gray-600">You will receive approximately {ethAmount} ETH on Sepolia</div>
        )}

        <hr />
        <button onClick={handleLock} disabled={isLocking} className="relative w-full">
          <span className="absolute top-0 left-0 mt-1 ml-1 h-full w-full rounded bg-black"></span>
          <span className="fold-bold relative inline-block h-full w-full rounded border-2 border-black bg-white px-3 py-1 text-base font-bold text-black transition duration-100 hover:bg-yellow-400 hover:text-gray-900">
            {isLocking ? "Transaction in Progress..." : "Bridge cBTC"}
          </span>
        </button>
      </div>

      {transactionInitiated && (
        <div className="w-full text-sm border border-green-500 p-4 space-y-1 rounded-lg text-green-700 shadow-xl">
          <div>
            Transaction has been initiated!{" "}
            {txHash && (
              <a
                href={`https://explorer.devnet.citrea.xyz/tx/${txHash}`}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                check here
              </a>
            )}
          </div>
          <div>Please check your wallet on the Sepolia network for details.</div>
        </div>
      )}

      {error && (
        <div className="w-full border text-sm border-red-500 p-4 rounded-lg text-red-700 shadow-xl break-words">
          Error: {error}
        </div>
      )}
      {lockDataError && (
        <div className="w-full border text-sm border-red-500 p-4 rounded-lg text-red-700 shadow-xl break-words">
          Error: {lockDataError.message}
        </div>
      )}
    </div>
  );
}
