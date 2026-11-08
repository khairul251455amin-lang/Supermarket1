/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { WelcomeView } from './components/views/WelcomeView';
import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { CategoryView } from './components/views/CategoryView';
import { ProductDetailView } from './components/views/ProductDetailView';
import { CartView } from './components/views/CartView';
import { CheckoutView } from './components/views/CheckoutView';
import { OrdersView } from './components/views/OrdersView';
import { FavouritesView } from './components/views/FavouritesView';
import { MessagesView } from './components/views/MessagesView';
import { NotificationsView } from './components/views/NotificationsView';
import { ProfileView } from './components/views/ProfileView';
import { AuthView } from './components/views/AuthView';
import { PublicShopView } from './components/views/PublicShopView';
import { SellerRegistrationView } from './components/seller/SellerRegistrationView';
import { SellerDashboard } from './components/seller/SellerDashboard';

const MainRouter: React.FC = () => {
  const { currentView } = useMarketplace();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeView />;
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'category':
        return <CategoryView />;
      case 'product':
        return <ProductDetailView />;
      case 'cart':
        return <CartView />;
      case 'checkout':
        return <CheckoutView />;
      case 'orders':
        return <OrdersView />;
      case 'favourites':
        return <FavouritesView />;
      case 'messages':
        return <MessagesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      case 'auth':
        return <AuthView />;
      case 'shop':
        return <PublicShopView />;
      case 'seller-register':
        return <SellerRegistrationView />;
      case 'seller-dashboard':
        return <SellerDashboard />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-10">
        {renderCurrentView()}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <MainRouter />
    </MarketplaceProvider>
  );
}
