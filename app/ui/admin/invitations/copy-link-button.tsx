'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { basePath } from '@/app/lib/utils';

interface CopyInvitationLinkProps {
  token: string;
}

export function CopyInvitationLink({ token }: CopyInvitationLinkProps) {
  const [copied, setCopied] = useState(false);

  const getInvitationUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}${basePath}/invite/${token}`;
  };

  const handleCopy = async () => {
    const url = getInvitationUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border p-2 hover:bg-gray-100 text-blue-600 inline-flex items-center justify-center"
      title={copied ? 'Copied!' : 'Copy Invitation Link'}
    >
      {copied ? (
        <CheckIcon className="w-5" />
      ) : (
        <ClipboardIcon className="w-5" />
      )}
    </button>
  );
}

