/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Tag,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { EmptyState } from '../../common/EmptyState';

export const MessagesTab: React.FC = () => {
  const {
    currentSeller,
    conversations,
    messages,
    sendMessage,
    navigateTo,
  } = useMarketplace();

  if (!currentSeller) return null;

  // Filter conversations specific to this seller
  const sellerConversations = conversations.filter((c) => c.sellerId === currentSeller.id);

  const [activeConvId, setActiveConvId] = useState<string | null>(
    sellerConversations[0]?.id || null
  );
  const [replyText, setReplyText] = useState('');

  const currentConv = sellerConversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConvId ? messages[activeConvId] || [] : [];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    sendMessage(activeConvId, replyText, 'seller');
    setReplyText('');
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Customer Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Respond directly to buyers inquiring about your items or order delivery
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden min-h-[520px]">
        {/* Left Column: Conversations List */}
        <div className="md:col-span-4 border-r border-slate-200/90 divide-y divide-slate-100 flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                    isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    {(conv.customerName || 'Customer').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {conv.customerName || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeStr}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessageText}</p>
                    {conv.productRef && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-700 truncate font-medium">
                        <Tag className="w-3 h-3" />
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
        <div className="md:col-span-8 flex flex-col justify-between">
          {currentConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
                    {(currentConv.customerName || 'Customer').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentConv.customerName || 'Customer'}
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Conversation ID: {currentConv.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Reference Header if attached */}
              {currentConv.productRef && (
                <div className="mx-4 mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentConv.productRef.image ? (
                      <img
                        src={currentConv.productRef.image}
                        alt={currentConv.productRef.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        Subject: {currentConv.productRef.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Listed at ${currentConv.productRef.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigateTo('product', { productId: currentConv.productRef!.id })
                    }
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Product</span>
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
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {isSeller ? 'You' : msg.senderName} · {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Simulation Notice */}
              <div className="px-4 py-1.5 bg-blue-50/60 border-t border-blue-100 text-[11px] text-blue-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Simulated vendor messaging in Phase 2. Ready for Cloud Firestore.</span>
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your reply to the customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select a conversation to reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
