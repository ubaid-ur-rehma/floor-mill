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
    easypaisa: { label: "Easypaisa", number: "0329 7466292", holder: "Nazir Atta Chakki" },
    jazzcash: { label: "JazzCash", number: "0349 4043371", holder: "Nazir Atta Chakki" },
    bank: {
        label: "Bank Transfer",
        bankName: "Meezan Bank",
        accountTitle: "Nazir Atta Chakki",
        accountNumber: "PK00MEZN0000",
        iban: "PK00MEZN0000",
    },
    cod: { label: "Cash on Delivery", note: "Pay in cash when you collect your order." },
};

export const PRODUCTS = [
    {
        id: "desi-gandum-atta",
        name: "Desi Gandum ke Atta",
        description: "Stone-ground whole wheat flour, milled fresh every day for authentic taste and nutrition.",
        price: 170,
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
        price: 160,
        unit: "kg",
        image: "atta4.jpeg",
        tag: "Daily",
        category: "Atta",
    },
];

export function findProduct(id) {
    return PRODUCTS.find((p) => p.id === id) || null;
}
