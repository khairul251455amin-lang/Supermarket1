/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { formatPrice } from '../../../config/marketplaceConfig';
import { EmptyState } from '../../common/EmptyState';

export const MessagesTab: React.FC = () => {
  const {
    currentSeller,
    conversations,
    messages,
    sendMessage,
    navigateTo,
  } = useMarketplace();

  // Filter conversations specific to this seller
  const sellerConversations = currentSeller
    ? conversations.filter((c) => c.sellerId === currentSeller.id)
    : [];

  const [activeConvId, setActiveConvId] = useState<string | null>(
    sellerConversations[0]?.id || null
  );
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!activeConvId && sellerConversations.length > 0) {
      setActiveConvId(sellerConversations[0].id);
    }
  }, [activeConvId, sellerConversations]);

  if (!currentSeller) return null;

  const currentConv = sellerConversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConvId ? messages[activeConvId] || [] : [];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId || isSending) return;
    const text = replyText;
    setReplyText('');
    setIsSending(true);
    try {
      await sendMessage(activeConvId, text, 'seller');
    } finally {
      setIsSending(false);
    }
  };

  if (sellerConversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Customer Inquiries Yet"
        description="When customers click 'Contact Seller' on your product detail pages or ask questions about orders, their inquiries will appear here."
        compact
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Customer Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Respond directly to buyers inquiring about your items or order delivery
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden min-h-[520px]">
        {/* Left Column: Conversations List */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#E2E8F0] divide-y divide-[#E2E8F0] flex flex-col max-h-[280px] md:max-h-none">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider tabular-nums">
              Buyers ({sellerConversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {sellerConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const timeStr = new Date(conv.lastMessageTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    isActive ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#1D4ED8] font-bold flex items-center justify-center shrink-0">
                    {(conv.customerName || 'Customer').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#0F172A] truncate">
                        {conv.customerName || 'Customer'}
                      </span>
                      <span className="text-[10px] text-[#64748B] shrink-0 tabular-nums">{timeStr}</span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{conv.lastMessageText}</p>
                    {conv.productRef && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#2563EB] truncate font-medium">
                        <Tag className="w-3 h-3 shrink-0" />
                        <span className="truncate">{conv.productRef.name}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Feed & Reply Form */}
        <div className="md:col-span-8 flex flex-col justify-between bg-white">
          {currentConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white font-bold flex items-center justify-center shrink-0">
                    {(currentConv.customerName || 'Customer').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0F172A] truncate">
                      {currentConv.customerName || 'Customer'}
                    </h3>
                    <div className="text-[11px] text-[#64748B] font-mono truncate">
                      ID: {currentConv.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Reference Header if attached */}
              {currentConv.productRef && (
                <div className="mx-4 mt-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentConv.productRef.image ? (
                      <img
                        src={currentConv.productRef.image}
                        alt={currentConv.productRef.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0 border border-[#E2E8F0]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-[#2563EB]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F172A] truncate">
                        {currentConv.productRef.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] tabular-nums">
                        Listed at {formatPrice(currentConv.productRef.price)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigateTo('product', { productId: currentConv.productRef!.id })
                    }
                    className="shrink-0 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[280px]">
                {currentMessages.map((msg) => {
                  const isSeller = msg.sender === 'seller';
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                          isSeller
                            ? 'bg-[#2563EB] text-white rounded-br-xs'
                            : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-[#64748B] mt-1 px-1 tabular-nums">
                        {isSeller ? 'You' : msg.senderName} · {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-[#E2E8F0] bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your reply to the customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[#64748B] p-8">
              Select a conversation to reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
