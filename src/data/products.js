import { Package, FlaskConical, Settings, FileText, Flame, Soup, Gift, Truck, Pill } from 'lucide-react';

export const KITS_DATA = [
  {
    id: 101,
    name: 'Kit Iniciante Premium',
    desc: 'Tudo o que você precisa em uma caixinha discreta. Inclui seda extra fina, cuia de silicone e isqueiro recarregável.',
    price: 49.90,
    oldPrice: 62.00,
    icon: 'gift',
  },
  {
    id: 102,
    name: 'Kit Degustação Double Glass',
    desc: 'Para quem aprecia a pureza. Conta com duas sedas de vidro borossilicato e limpadores anatômicos inclusos.',
    price: 32.00,
    oldPrice: 39.90,
    icon: 'flask',
  },
  {
    id: 103,
    name: 'Kit Heavy Grind',
    desc: 'Triturador de policarbonato reforçado de 3 fases emparelhado com os melhores livretos King Size do mercado.',
    price: 55.00,
    oldPrice: 69.00,
    icon: 'settings',
  },
];

export const PRODUCT_ICONS = {
  gift: Gift,
  flask: FlaskConical,
  settings: Settings,
  'file-text': FileText,
  flame: Flame,
  bowl: Soup,
  package: Package,
  truck: Truck,
  pill: Pill,
};

export function formatApiProduct(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category || '',
    price: p.price / 100,
    oldPrice: p.oldPrice ? p.oldPrice / 100 : null,
    stock: p.stock,
    badge: p.badge,
    image: p.images?.[0]?.url || null,
    description: p.description,
  };
}
