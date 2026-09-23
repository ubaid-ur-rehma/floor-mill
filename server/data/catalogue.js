// ============================================================================
// Product catalogue + shop configuration.
// This is the single source of truth for prices, so the front end never
// hard-codes them. Editing this file updates the whole site + checkout.
// ============================================================================

export const SHOP = {
    name: "Nazir Atta Chakki",
    tagline: "Fresh · Pure · Traditionally Ground",
    phone: "03494043371",
    whatsapp: "923297466292", // international format, no +
    whatsappDisplay: "0329 7466292",
    email: "munawarhussein60@gmail.com",
    address: "196 Allama Iqbal Road, Mustafabad, Lahore",
    currency: "PKR",
    currencySymbol: "Rs",
};

export const PAYMENT_ACCOUNTS = {
    easypaisa: { label: "Easypaisa", number: "0316 4395007", holder: "Nazir Atta Chakki" },
    jazzcash: { label: "JazzCash", number: "0316 4395007", holder: "Nazir Atta Chakki" },
};

export const PRODUCTS = [
    {
        id: "desi-gandum-atta",
        name: "Desi Gandum ke Atta",
        description: "Stone-ground whole wheat flour, milled fresh every day for authentic taste and nutrition.",
        price: 180,
        unit: "kg",
        image: "atta2.jpeg",
        tag: "Bestseller",
        category: "Atta",
    },
    {
        id: "narala-supreme-chawal",
        name: "Narala Supreme Chawal",
        description: "Premium long-grain rice, hand-sorted for purity. Perfect for biryani and daily meals.",
        price: 415,
        priceMax: 430,
        unit: "kg",
        image: "atta3.jpeg",
        tag: "Premium",
        category: "Rice",
    },
    {
        id: "white-atta",
        name: "White Atta",
        description: "Finely milled white flour for soft rotis, naan and baking. Clean and fresh.",
        price: 180,
        unit: "kg",
        image: "atta4.jpeg",
        tag: "Daily",
        category: "Atta",
    },
    {
        id: "makai-ka-atta",
        name: "Makai ka Atta",
        description: "Fresh ground corn (maize) flour \u2014 perfect for makai ki roti and traditional dishes.",
        price: 210,
        unit: "kg",
        image: "atta4.jpeg",
        tag: "Fresh",
        category: "Atta",
    },
    {
        id: "jo-ka-atta",
        name: "Jo ka Atta",
        description: "Wholesome barley (jo) flour, rich in fibre \u2014 healthy and traditionally ground.",
        price: 280,
        unit: "kg",
        image: "atta2.jpeg",
        tag: "Healthy",
        category: "Atta",
    },
    {
        id: "chawal-ka-atta",
        name: "Chawal ka Atta",
        description: "Fine rice flour (chawal ka atta) for baking, traditional sweets and crispy snacks.",
        price: 300,
        unit: "kg",
        image: "atta3.jpeg",
        tag: "Special",
        category: "Flour",
    },
    {
        id: "gandum-ka-dalia",
        name: "Gandum ka Dalia",
        description: "Coarse-ground cracked wheat dalia \u2014 a wholesome, fibre-rich breakfast choice.",
        price: 220,
        unit: "kg",
        image: "atta2.jpeg",
        tag: "Healthy",
        category: "Dalia",
    },
    {
        id: "jo-ka-dalia",
        name: "Jo ka Dalia",
        description: "Cracked barley dalia, full of fibre and nutrition \u2014 traditionally ground and pure.",
        price: 360,
        unit: "kg",
        image: "atta2.jpeg",
        tag: "Premium",
        category: "Dalia",
    },
    {
        id: "bajre-ka-atta",
        name: "Bajre ka Atta",
        description: "Pearl millet (bajra) flour \u2014 a healthy, warming choice for bajra roti in winter.",
        price: 200,
        unit: "kg",
        image: "atta4.jpeg",
        tag: "Winter Favourite",
        category: "Atta",
    },
];

export function findProduct(id) {
    return PRODUCTS.find((p) => p.id === id) || null;
}
