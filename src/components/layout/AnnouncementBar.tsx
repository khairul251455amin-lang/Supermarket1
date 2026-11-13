/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { marketplaceConfig } from '../../config/marketplaceConfig';

export const AnnouncementBar: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (!marketplaceConfig.announcementBar.enabled || dismissed) {
    return null;
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 border-b border-blue-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-3 text-[11px] sm:text-xs font-medium">
        <div className="w-4 hidden sm:block" aria-hidden="true" />
        <p className="truncate text-center flex-1 text-slate-200 tracking-wide">
          {marketplaceConfig.announcementBar.text}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="text-slate-400 hover:text-white transition-colors p-1 rounded cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
