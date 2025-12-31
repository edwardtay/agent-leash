import { useState } from "react";
import { getExplorerAddressUrl, DEFAULT_CHAIN_ID } from "../config/chains";

interface AddressDisplayProps {
  address: string;
  chainId?: number;
  label?: string;
  truncate?: boolean;
}

export function AddressDisplay({ address, chainId = DEFAULT_CHAIN_ID, label, truncate = true }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = getExplorerAddressUrl(chainId, address);
  const displayAddress = truncate ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-[var(--text-muted)]">{label}</span>}
      <span className="font-mono text-xs">{displayAddress}</span>
      <button
        onClick={copyToClipboard}
        className="text-[var(--text-muted)] hover:text-white transition-colors"
        title="Copy address"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        title="View on explorer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
