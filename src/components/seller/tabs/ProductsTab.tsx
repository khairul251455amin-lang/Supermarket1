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
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { Product } from '../../../types';
import { EmptyState } from '../../common/EmptyState';

export const ProductsTab: React.FC = () => {
  const {
    currentSeller,
    products,
    categories,
    deleteSellerProduct,
    toggleProductAvailability,
    updateSellerProduct,
    setSellerDashboardTab,
    navigateTo,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<string>('');

  // Seller's own products
  const sellerProducts = useMemo(() => {
    return products.filter((p) => p.sellerId === currentSeller.id);
  }, [products, currentSeller.id]);

  const filteredProducts = useMemo(() => {
    return sellerProducts.filter((p) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (stockFilter === 'in-stock' && p.stock <= 0) return false;
      if (stockFilter === 'low-stock' && (p.stock <= 0 || p.stock > 5)) return false;
      if (stockFilter === 'out-of-stock' && p.stock > 0) return false;
      return true;
    });
  }, [sellerProducts, searchTerm, selectedCategory, stockFilter]);

  const handleDelete = (productId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the marketplace? This action cannot be undone.`)) {
      deleteSellerProduct(productId);
    }
  };

  const handleStockUpdateCommit = (productId: string) => {
    const qty = parseInt(newStockVal, 10);
    if (!isNaN(qty) && qty >= 0) {
      updateSellerProduct(productId, { stock: qty });
    }
    setEditingStockId(null);
    setNewStockVal('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Product Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your published items ({sellerProducts.length} total)
          </p>
        </div>

        <button
          onClick={() => setSellerDashboardTab('add-product')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock ({sellerProducts.filter((p) => p.stock > 0).length})</option>
            <option value="low-stock">Low Stock (≤ 5)</option>
            <option value="out-of-stock">Out of Stock ({sellerProducts.filter((p) => p.stock <= 0).length})</option>
          </select>
        </div>
      </div>

      {/* Products Table / Cards */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Stock</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const hasDiscount = typeof p.discountedPrice === 'number' && p.discountedPrice < p.originalPrice;
                  const currentPrice = hasDiscount ? p.discountedPrice! : p.originalPrice;
                  const isAvailable = p.isAvailable !== false && !p.isRemovedByModeration;

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
                                  referrerPolicy="no-referrer"
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
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {p.id} {p.subcategory ? `· ${p.subcategory}` : ''}
                            </div>
                            <div className="text-[10px] text-blue-600 font-medium">
                              {p.images?.length || 0} photos attached
                            </div>
                            {p.isRemovedByModeration && (
                              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                Prohibited: {p.moderationReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {p.category}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 tabular-nums">
                          ${currentPrice.toFixed(2)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-slate-400 line-through tabular-nums">
                            ${p.originalPrice.toFixed(2)} ({p.discountPercentage}% off)
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
                              onClick={() => handleStockUpdateCommit(p.id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded font-bold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="px-1.5 py-1 bg-slate-200 text-slate-700 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingStockId(p.id);
                              setNewStockVal(p.stock.toString());
                            }}
                            className="cursor-pointer group inline-flex items-center gap-1 hover:text-blue-600"
                            title="Click to update stock"
                          >
                            <span
                              className={`font-semibold tabular-nums ${
                                p.stock <= 0
                                  ? 'text-rose-600'
                                  : p.stock <= 5
                                  ? 'text-amber-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {p.stock} units
                            </span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => toggleProductAvailability(p.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            !isAvailable
                              ? 'bg-slate-100 text-slate-500'
                              : p.stock <= 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.isRemovedByModeration ? (
                            'Hidden'
                          ) : !isAvailable ? (
                            'Unavailable'
                          ) : p.stock <= 0 ? (
                            'Out of Stock'
                          ) : (
                            'Live on Website'
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview in Customer Web */}
                          <button
                            onClick={() => navigateTo('product', { productId: p.id })}
                            title="Preview on Customer Website"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              ? 'Publish your first merchandise item. Products will immediately become available to customers across all categories.'
              : 'Try clearing your search term or adjusting category/stock filters.'
          }
          actionLabel="Add New Product"
          onAction={() => setSellerDashboardTab('add-product')}
        />
      )}
    </div>
  );
};
