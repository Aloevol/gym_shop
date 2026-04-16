export interface DeliveryArea {
  name: string;
  price: number;
  deliveryTime: string;
  districts: string[];
}

export const FREE_SHIPPING_THRESHOLD = 2000;
export const ORDER_TAX_RATE = 0.05;

export const DELIVERY_AREAS: DeliveryArea[] = [
  {
    name: "Dhaka Metropolitan",
    price: 60,
    deliveryTime: "1-2 days",
    districts: ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Narsingdi", "Savar", "Tangail"],
  },
  {
    name: "Major City Express",
    price: 100,
    deliveryTime: "2-3 days",
    districts: ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", "Rajshahi", "Khulna", "Sylhet"],
  },
  {
    name: "Remote Area Delivery",
    price: 150,
    deliveryTime: "4-6 days",
    districts: ["Bandarban", "Bhola", "Khagrachari", "Kurigram", "Rangamati", "Sunamganj"],
  },
  {
    name: "Standard District Delivery",
    price: 120,
    deliveryTime: "3-4 days",
    districts: [
      "Bagerhat",
      "Bandarban",
      "Barguna",
      "Barishal",
      "Bhola",
      "Bogura",
      "Chandpur",
      "Chapainawabganj",
      "Chuadanga",
      "Cumilla",
      "Dinajpur",
      "Faridpur",
      "Gaibandha",
      "Gopalganj",
      "Habiganj",
      "Jamalpur",
      "Jashore",
      "Jhalokathi",
      "Jhenaidah",
      "Joypurhat",
      "Kishoreganj",
      "Kushtia",
      "Lakshmipur",
      "Lalmonirhat",
      "Madaripur",
      "Magura",
      "Meherpur",
      "Moulvibazar",
      "Mymensingh",
      "Naogaon",
      "Narail",
      "Natore",
      "Netrokona",
      "Nilphamari",
      "Noakhali",
      "Pabna",
      "Panchagarh",
      "Patuakhali",
      "Pirojpur",
      "Rajbari",
      "Rangpur",
      "Satkhira",
      "Shariatpur",
      "Sherpur",
      "Sirajganj",
      "Thakurgaon",
    ],
  },
];

const DISTRICT_ALIASES: Record<string, string> = {
  Barisal: "Barishal",
  Chittagong: "Chattogram",
  Comilla: "Cumilla",
  Jessore: "Jashore",
  Pabnaa: "Pabna",
};

export function normalizeDistrictName(district: string) {
  const trimmed = district.trim();
  return DISTRICT_ALIASES[trimmed] || trimmed;
}

export function getDeliveryAreaForDistrict(district: string) {
  const normalizedDistrict = normalizeDistrictName(district);
  return DELIVERY_AREAS.find((area) => area.districts.includes(normalizedDistrict)) || DELIVERY_AREAS[0];
}

export function getAllDistricts() {
  return [...new Set(DELIVERY_AREAS.flatMap((area) => area.districts))].sort((a, b) => a.localeCompare(b));
}

export function calculateShippingFee(subtotal: number, district: string) {
  if (!district) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return getDeliveryAreaForDistrict(district).price;
}

export function calculateTax(subtotal: number) {
  return subtotal * ORDER_TAX_RATE;
}

export function calculateOrderTotals(subtotal: number, district: string) {
  const shipping = calculateShippingFee(subtotal, district);
  const tax = calculateTax(subtotal);
  return {
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
  };
}
