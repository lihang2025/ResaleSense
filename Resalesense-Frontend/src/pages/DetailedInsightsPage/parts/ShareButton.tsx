import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const ShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // This effect resets the "Copied!" message after 2 seconds.
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    setCopied(true);
  };

  return (
    <CopyToClipboard text={window.location.href} onCopy={handleCopy}>
      <button className="button" style={{ backgroundColor: copied ? '#16a34a' : '#4b5563', padding: '0.5rem 1rem', transition: 'background-color 0.3s ease' }}>
        {copied ? 'Copied! ✔' : 'Share 🔗'}
      </button>
    </CopyToClipboard>
  );
};

export default ShareButton;