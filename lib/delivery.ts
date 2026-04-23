export interface DeliveryArea {
  name: string;
  price: number;
  deliveryTime: string;
  districts: string[];
}

export const DHAKA_DISTRICTS = ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Narsingdi", "Savar", "Tangail"];

export const DELIVERY_AREAS: DeliveryArea[] = [
  {
    name: "Dhaka Metropolitan",
    price: 60,
    deliveryTime: "1-2 days",
    districts: DHAKA_DISTRICTS,
  },
  {
    name: "Outside Dhaka",
    price: 120,
    deliveryTime: "3-5 days",
    districts: [
      "Chattogram",
      "Cox's Bazar",
      "Cumilla",
      "Feni",
      "Brahmanbaria",
      "Rajshahi",
      "Khulna",
      "Sylhet",
      "Barishal",
      "Bogura",
      "Dinajpur",
      "Jashore",
      "Mymensingh",
      "Rangpur",
      "Bagerhat",
      "Bandarban",
      "Barguna",
      "Bhola",
      "Chandpur",
      "Chapainawabganj",
      "Chuadanga",
      "Faridpur",
      "Gaibandha",
      "Gopalganj",
      "Habiganj",
      "Jamalpur",
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
      "Satkhira",
      "Shariatpur",
      "Sherpur",
      "Sirajganj",
      "Thakurgaon",
      "Bandarban",
      "Khagrachari",
      "Kurigram",
      "Rangamati",
      "Sunamganj",
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
  return DELIVERY_AREAS.find((area) => area.districts.includes(normalizedDistrict)) || DELIVERY_AREAS[1];
}

export function getAllDistricts() {
  return [...new Set(DELIVERY_AREAS.flatMap((area) => area.districts))].sort((a, b) => a.localeCompare(b));
}

export function calculateShippingFee(subtotal: number, district: string) {
  if (!district) return 0;
  return getDeliveryAreaForDistrict(district).price;
}

export function calculateTax(subtotal: number) {
  return 0;
}

export function calculateOrderTotals(subtotal: number, district: string) {
  const shipping = calculateShippingFee(subtotal, district);
  return {
    subtotal,
    shipping,
    tax: 0,
    total: subtotal + shipping,
  };
}
