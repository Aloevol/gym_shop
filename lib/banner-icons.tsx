import type { ComponentType } from "react";
import {
  BadgeAlert,
  BadgePercent,
  BellRing,
  CircleDollarSign,
  Clock3,
  Dumbbell,
  Flame,
  Gem,
  Gift,
  Globe,
  HeartPulse,
  Megaphone,
  Medal,
  Package,
  Radio,
  Rocket,
  ScanBarcode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  Truck,
  Zap,
} from "lucide-react";

export interface BannerIconOption {
  label: string;
  value: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
}

export const BANNER_ICON_OPTIONS: BannerIconOption[] = [
  { label: "Live", value: "Radio", Icon: Radio },
  { label: "Alert", value: "BadgeAlert", Icon: BadgeAlert },
  { label: "Discount", value: "BadgePercent", Icon: BadgePercent },
  { label: "Bell", value: "BellRing", Icon: BellRing },
  { label: "Revenue", value: "CircleDollarSign", Icon: CircleDollarSign },
  { label: "Clock", value: "Clock3", Icon: Clock3 },
  { label: "Strength", value: "Dumbbell", Icon: Dumbbell },
  { label: "Hot", value: "Flame", Icon: Flame },
  { label: "Premium", value: "Gem", Icon: Gem },
  { label: "Gift", value: "Gift", Icon: Gift },
  { label: "Global", value: "Globe", Icon: Globe },
  { label: "Recovery", value: "HeartPulse", Icon: HeartPulse },
  { label: "Broadcast", value: "Megaphone", Icon: Megaphone },
  { label: "Medal", value: "Medal", Icon: Medal },
  { label: "Package", value: "Package", Icon: Package },
  { label: "Rocket", value: "Rocket", Icon: Rocket },
  { label: "Barcode", value: "ScanBarcode", Icon: ScanBarcode },
  { label: "Shield", value: "ShieldCheck", Icon: ShieldCheck },
  { label: "Bag", value: "ShoppingBag", Icon: ShoppingBag },
  { label: "Spark", value: "Sparkles", Icon: Sparkles },
  { label: "Star", value: "Star", Icon: Star },
  { label: "Target", value: "Target", Icon: Target },
  { label: "Trophy", value: "Trophy", Icon: Trophy },
  { label: "Delivery", value: "Truck", Icon: Truck },
  { label: "Energy", value: "Zap", Icon: Zap },
];

export function getBannerIconOption(value?: string) {
  return BANNER_ICON_OPTIONS.find((option) => option.value === value) || BANNER_ICON_OPTIONS[0];
}
