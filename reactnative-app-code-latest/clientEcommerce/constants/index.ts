export const COLORS = {
    primary: "#111111",
    secondary: "#666666",
    background: "#FFFFFF",
    surface: "#F7F7F7",
    accent: "#FF4C3B",
    border: "#EEEEEE",
    error: "#FF4444",
};

// Currency symbol + delivery fee mirror the web frontend (currency '$', delivery_fee 10).
export const CURRENCY = "$";
export const DELIVERY_FEE = 10;

// Category / sub-category values MUST match what the web backend stores on a product,
// otherwise filtering returns nothing. Web uses exactly these.
export const CATEGORIES = [
    { id: 1, name: "Men", icon: "man-outline" },
    { id: 2, name: "Women", icon: "woman-outline" },
    { id: 3, name: "Kids", icon: "happy-outline" },
];

export const SUBCATEGORIES = ["Topwear", "Bottomwear", "Winterwear"];

export const PROFILE_MENU = [
    { id: 1, title: "My Orders", icon: "receipt-outline", route: "/orders" },
    { id: 6, title: "Admin Panel", icon: "shield-checkmark-outline", route: "/admin" },
];

export const getStatusColor = (status: string) => {
    switch (status) {
        case "placed":
            return "bg-yellow-50 text-yellow-900";
        case "processing":
            return "bg-indigo-50 text-indigo-900";
        case "shipped":
            return "bg-purple-50 text-purple-900";
        case "delivered":
            return "bg-green-50 text-green-900";
        case "cancelled":
            return "bg-red-50 text-red-900";
        default:
            return "bg-gray-50 text-gray-900";
    }
};
