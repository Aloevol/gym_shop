export interface StorefrontNavLink {
  name: string;
  href: string;
  isActive?: boolean;
}

export const ALLOWED_STOREFRONT_ROUTES = ["/", "/shop", "/contact", "/cart"] as const;
export const ALLOWED_STOREFRONT_PREFIXES = ["/product/"] as const;

export const DEFAULT_STOREFRONT_NAV_LINKS: StorefrontNavLink[] = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Contact", href: "/contact" },
];

export function isAllowedStorefrontPath(path: string) {
  if (ALLOWED_STOREFRONT_ROUTES.includes(path as (typeof ALLOWED_STOREFRONT_ROUTES)[number])) {
    return true;
  }

  return ALLOWED_STOREFRONT_PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

export function filterStorefrontNavLinks<T extends StorefrontNavLink>(links: T[]) {
  return links.filter((link) => isAllowedStorefrontPath(link.href) && link.isActive !== false);
}
