import * as Lucide from 'lucide-react';

const SIZES = { sm: 14, md: 18, lg: 22, xl: 28 };

export default function Icon({ name, size = 'md', className = '', ...props }) {
  const Comp = Lucide[name];
  if (!Comp) return null;
  const px = typeof size === 'number' ? size : SIZES[size] || 18;
  return <Comp size={px} className={className} aria-hidden="true" {...props} />;
}
