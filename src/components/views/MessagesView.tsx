/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Store,
  Tag,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { EmptyState } from '../common/EmptyState';

export const MessagesView: React.FC = () => {
  const {
    conversations,
    messages,
    selectedConversationId,
    sendMessage,
    navigateTo,
  } = useMarketplace();

  const [activeConvId, setActiveConvId] = useState<string | null>(
    selectedConversationId || (conversations[0]?.id ?? null)
  );
  const [inputText, setInputText] = useState('');

  const currentConv = conversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConvId ? messages[activeConvId] || [] : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;
    sendMessage(activeConvId, inputText);
    setInputText('');
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Conversations Yet"
        description="Your message inbox starts completely empty. When you click 'Contact Seller' on any product detail page, a direct inquiry will open here."
        actionLabel="Browse Products"
        onAction={() => navigateTo('home')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Seller Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Communicate directly with independent multi-vendor merchants
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden min-h-[550px]">
        {/* Left Column: Conversation List */}
        <div className="md:col-span-4 border-r border-slate-200/90 divide-y divide-slate-100 flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Conversations ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map((conv) => {
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
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    {conv.sellerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {conv.sellerName}
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

        {/* Right Column: Active Chat Area */}
        <div className="md:col-span-8 flex flex-col justify-between">
          {currentConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    {currentConv.sellerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentConv.sellerName}
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>Seller ID: {currentConv.sellerId}</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Verified Merchant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Reference Card if linked */}
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
                        Inquiry about: {currentConv.productRef.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ${currentConv.productRef.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigateTo('product', { productId: currentConv.productRef!.id })
                    }
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message History Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px]">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    Start your simulated seller inquiry below.
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isCustomer = msg.sender === 'customer';
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                            isCustomer
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{timeStr}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Simulation Notice */}
              <div className="px-4 py-1.5 bg-blue-50/60 border-t border-blue-100 text-[11px] text-blue-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Simulated message exchange in prototype mode. Ready for Cloud Firestore messaging.</span>
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Write your inquiry to the seller..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select a conversation to read messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
