/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Store,
  Tag,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatPrice } from '../../config/marketplaceConfig';
import { EmptyState } from '../common/EmptyState';

export const MessagesView: React.FC = () => {
  const {
    user,
    currentSeller,
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
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (selectedConversationId) {
      setActiveConvId(selectedConversationId);
    } else if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [selectedConversationId, conversations, activeConvId]);

  if (!user && !currentSeller) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Sign In to Message Sellers</h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Please sign in or create an account to send inquiries and view seller replies.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('auth', { authMode: 'login' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer min-h-[42px]"
          >
            Sign In
          </button>
          <button
            onClick={() => navigateTo('auth', { authMode: 'register' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-xl cursor-pointer min-h-[42px]"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const currentConv = conversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConvId ? messages[activeConvId] || [] : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || isSending) return;
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);
    try {
      await sendMessage(activeConvId, textToSend);
    } finally {
      setIsSending(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Conversations Yet"
        description="When you tap 'Message Shop' or 'Contact Seller' on any product or shop page, your conversation will appear here."
        actionLabel="Browse Products"
        onAction={() => navigateTo('home')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Seller Messages
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Communicate directly with independent multi-vendor merchants
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden min-h-[550px]">
        {/* Left Column: Conversation List */}
        <div className="md:col-span-4 border-r border-[#E2E8F0] divide-y divide-[#E2E8F0] flex flex-col">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Conversations ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
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
                    isActive ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                    {conv.sellerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#0F172A] truncate">
                        {conv.sellerName}
                      </span>
                      <span className="text-[10px] text-[#64748B] shrink-0 tabular-nums">{timeStr}</span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{conv.lastMessageText}</p>
                    {conv.productRef && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#2563EB] truncate font-medium">
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
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold">
                    {currentConv.sellerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      {currentConv.sellerName}
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>Shop ID: {currentConv.sellerId}</span>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => navigateTo('shop', { sellerId: currentConv.sellerId })}
                        className="text-blue-600 font-medium hover:underline cursor-pointer"
                      >
                        Visit Shop
                      </button>
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
                        {formatPrice(currentConv.productRef.price)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigateTo('product', { productId: currentConv.productRef!.id })
                    }
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message History Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px]">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-xs text-[#64748B] py-12">
                    Start your inquiry with the shop below.
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
                              ? 'bg-[#2563EB] text-white rounded-br-xs'
                              : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-[#64748B] mt-1 px-1 tabular-nums">{timeStr}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-[#E2E8F0] bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Write your inquiry to the seller..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
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
