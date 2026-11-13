/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { ProductStatus } from '../../../types';
import { formatPrice } from '../../../config/marketplaceConfig';
import { EmptyState } from '../../common/EmptyState';

export const ProductsTab: React.FC = () => {
  const {
    currentSeller,
    sellerProducts,
    categories,
    deleteSellerProduct,
    toggleProductAvailability,
    updateSellerProduct,
    setSellerDashboardTab,
    setEditingProductId,
    navigateTo,
  } = useMarketplace();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return sellerProducts.filter((p) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (
          !p.name.toLowerCase().includes(query) &&
          !p.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [sellerProducts, searchTerm, selectedCategory, statusFilter]);

  if (!currentSeller) return null;

  const handleConfirmDelete = async (productId: string) => {
    setBusyId(productId);
    try {
      await deleteSellerProduct(productId);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleStockUpdateCommit = async (productId: string) => {
    const qty = parseInt(newStockVal, 10);
    if (!isNaN(qty) && qty >= 0) {
      setBusyId(productId);
      await updateSellerProduct(productId, {
        stock: qty,
        stockQuantity: qty,
        status: qty > 0 ? 'published' : 'out_of_stock',
        isAvailable: qty > 0,
      });
      setBusyId(null);
    }
    setEditingStockId(null);
    setNewStockVal('');
  };

  const handleToggleStatus = async (productId: string) => {
    setBusyId(productId);
    try {
      await toggleProductAvailability(productId);
    } finally {
      setBusyId(null);
    }
  };

  const getStatusBadge = (status: ProductStatus, qty: number) => {
    if (status === 'published' && qty > 0) {
      return { label: 'Published (Live)', cls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' };
    }
    if (status === 'draft') {
      return { label: 'Draft', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' };
    }
    if (status === 'paused') {
      return { label: 'Paused', cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200' };
    }
    if (status === 'out_of_stock' || qty <= 0) {
      return { label: 'Out of Stock', cls: 'bg-rose-50 text-rose-700 hover:bg-rose-100' };
    }
    return { label: 'Removed', cls: 'bg-slate-100 text-slate-500' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            My Product Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage published, draft, paused, and out-of-stock products ({sellerProducts.length} total)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProductId(null);
            setSellerDashboardTab('add-product');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white font-medium text-[#0F172A]"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white font-medium text-[#0F172A]"
          >
            <option value="all">All Statuses ({sellerProducts.length})</option>
            <option value="published">
              Published ({sellerProducts.filter((p) => p.status === 'published').length})
            </option>
            <option value="draft">
              Draft ({sellerProducts.filter((p) => p.status === 'draft').length})
            </option>
            <option value="paused">
              Paused ({sellerProducts.filter((p) => p.status === 'paused').length})
            </option>
            <option value="out_of_stock">
              Out of Stock ({sellerProducts.filter((p) => p.status === 'out_of_stock').length})
            </option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Stock</th>
                  <th className="py-3.5 px-3">Status (Tap to Toggle)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {filteredProducts.map((p) => {
                  const hasDiscount =
                    typeof p.discountedPrice === 'number' && p.discountedPrice < p.originalPrice;
                  const currentPrice = hasDiscount ? p.discountedPrice! : p.originalPrice;
                  const qty = p.stockQuantity ?? p.stock;
                  const badge = getStatusBadge(p.status, qty);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center -space-x-3 shrink-0">
                            {p.images && p.images.length > 0 ? (
                              p.images.slice(0, 2).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`${p.name} photo ${i + 1}`}
                                  className="w-11 h-11 rounded-xl object-cover bg-slate-100 ring-2 ring-white shadow-xs"
                                  title={`Photo ${i + 1}`}
                                />
                              ))
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-semibold text-slate-900 truncate">{p.name}</h4>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              ID: {p.id} {p.subcategory ? `· ${p.subcategory}` : ''}
                            </div>
                            <div className="text-[10px] text-blue-600 font-medium">
                              {p.images?.length || 0} photos attached
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 font-medium text-slate-800">{p.category}</td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatPrice(currentPrice)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-slate-400 line-through tabular-nums">
                            {formatPrice(p.originalPrice)} ({p.discountPercentage}% off)
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-3">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(e.target.value)}
                              className="w-16 px-1.5 py-1 border border-blue-500 rounded text-xs font-bold"
                              autoFocus
                            />
                            <button
                              disabled={busyId === p.id}
                              onClick={() => void handleStockUpdateCommit(p.id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded font-bold cursor-pointer"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="px-1.5 py-1 bg-slate-200 text-slate-700 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingStockId(p.id);
                              setNewStockVal(qty.toString());
                            }}
                            className="cursor-pointer group inline-flex items-center gap-1 hover:text-blue-600"
                            title="Click to update stock"
                          >
                            <span
                              className={`font-semibold tabular-nums ${
                                qty <= 0
                                  ? 'text-rose-600'
                                  : qty <= 5
                                  ? 'text-amber-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {qty} units
                            </span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <button
                          disabled={busyId === p.id}
                          onClick={() => void handleToggleStatus(p.id)}
                          title={
                            p.status === 'published'
                              ? 'Click to pause visibility'
                              : 'Click to publish live'
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50 ${badge.cls}`}
                        >
                          {busyId === p.id ? 'Updating...' : badge.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {confirmDeleteId === p.id ? (
                          <div className="inline-flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                            <span className="text-[11px] font-semibold text-rose-800">Delete?</span>
                            <button
                              disabled={busyId === p.id}
                              onClick={() => void handleConfirmDelete(p.id)}
                              className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-md cursor-pointer"
                            >
                              {busyId === p.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingProductId(p.id);
                                setSellerDashboardTab('add-product');
                              }}
                              title="Edit Product"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => navigateTo('product', { productId: p.id })}
                              title="Preview on Marketplace"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              title="Delete Product"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={
            sellerProducts.length === 0
              ? 'You have not added any products yet'
              : 'No products match your filter'
          }
          description={
            sellerProducts.length === 0
              ? 'Publish your first product. Published items immediately appear in the live marketplace for all shoppers and visitors.'
              : 'Try clearing your search term or adjusting category/status filters.'
          }
          actionLabel="Add New Product"
          onAction={() => {
            setEditingProductId(null);
            setSellerDashboardTab('add-product');
          }}
        />
      )}
    </div>
  );
};
