/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shirt,
  Watch,
  Smartphone,
  Apple,
  Tv,
  Cake,
  CupSoda,
  Glasses,
  Package,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name.toLowerCase()) {
    case 'clothing':
    case 'shirt':
      return <Shirt {...props} />;
    case 'watches':
    case 'watch':
      return <Watch {...props} />;
    case 'devices':
    case 'smartphone':
      return <Smartphone {...props} />;
    case 'fruits':
    case 'apple':
      return <Apple {...props} />;
    case 'electronics':
    case 'tv':
      return <Tv {...props} />;
    case 'cakes':
    case 'cake':
      return <Cake {...props} />;
    case 'juice':
    case 'cupsoda':
      return <CupSoda {...props} />;
    case 'accessories':
    case 'glasses':
      return <Glasses {...props} />;
    case 'other products':
    case 'other':
    case 'package':
    default:
      return <Package {...props} />;
  }
};
