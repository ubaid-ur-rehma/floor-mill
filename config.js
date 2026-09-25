// ============================================================================
//  NAZIR ATTA CHAKKI — SITE CONFIGURATION
//  ---------------------------------------------------------------------------
//  THIS IS THE ONE FILE TO EDIT when you want to change:
//    • the brand name, tagline, phone, WhatsApp, email, address, hours
//    • product names, descriptions, prices, pack sizes
//    • which payment account numbers are shown
//    • social media links
//
//  Everything on the website reads from here, so you never have to hunt
//  through the HTML again.
// ============================================================================

window.NAC_CONFIG = {

    /* ---------------------------------------------------------------- BRAND */
    brand: {
        name: "NAZIR ATTA CHAKKI",
        shortName: "Nazir Atta Chakki",
        tagline: "Since 1975 · Lahore",
        // Replace with your own tagline if you like:
        heroTitle: "Fresh Atta & Quality Grains,<br>Ground the Traditional Way",
        heroKicker: "Trusted for Over 5 Decades",
        // The file name of your logo (put the file next to index.html):
        logo: "favicon.jpeg",
    },

    /* -------------------------------------------------------------- CONTACT */
    contact: {
        phoneDisplay: "0349 4043371, 0329 7466292",
        phoneDial: "+923494043371",
        // WhatsApp must be in international form, digits only (no + or spaces)
        whatsapp: "923297466292",
        whatsappDisplay: "0329 7466292",
        email: "munawarhussein60@gmail.com",
        address: "196 Allama Iqbal Road, Mustafabad, Lahore",
        hours: "Open Daily · 8:00 AM – 9:00 PM",
        mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3400.0091118701816!2d74.36278937574!3d31.551364545610436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919050e07e629b9%3A0xa7e4e0967d641b3a!2sNazir%20atta%20chakki!5e0!3m2!1sen!2s!4v1783076491895!5m2!1sen!2s",
    },

    /* ------------------------------------------------------------- PAYMENTS */
    payments: {
        easypaisa: { label: "Easypaisa", number: "0316 4395007" },
        jazzcash: { label: "JazzCash", number: "0316 4395007" },
    },

    /* ------------------------------------------------------------- SOCIALS */
    social: {
        whatsapp: "https://wa.me/923297466292",
        phone: "tel:+923494043371",
        email: "mailto:munawarhussein60@gmail.com",
        // Add your real pages here when you have them:
        facebook: "",
        instagram: "",
        tiktok: "",
    },

    /* -------------------------------------------------------------- SIZES */
    // The pack sizes offered. `multiplier` is applied to the per-kg price.
    // 1 KG = base price · 5 KG = 5× the kilo price (priced fairly, not discounted).
    sizes: [
        { kg: 1, label: "1 KG", multiplier: 1 },
        { kg: 2, label: "2 KG", multiplier: 2 },
        { kg: 5, label: "5 KG", multiplier: 5 },
        { kg: 10, label: "10 KG", multiplier: 10 },
    ],

    /* ------------------------------------------------------------ PRODUCTS */
    // `image` — either a file in the folder, or a file in img/ (e.g. "img/jo-atta.svg")
    // `price`  — rupees per KILO. The size multiplier is applied automatically.
    products: [
        {
            id: "desi-gandum-atta",
            name: "Desi Gandum ke Atta",
            tag: "Bestseller",
            category: "Atta",
            price: 180,
            unit: "kg",
            image: "atta2.jpeg",
            description: "Whole-wheat desi atta, traditionally ground for a rich, natural taste and full nutrition.",
        },
        {
            id: "narala-supreme-chawal",
            name: "Narala Supreme Chawal",
            tag: "Premium",
            category: "Rice",
            price: 415,
            priceMax: 430,
            unit: "kg",
            image: "atta3.jpeg",
            description: "Premium long-grain rice with a delicate aroma — perfect for biryani and everyday meals.",
        },
        {
            id: "white-atta",
            name: "White Atta",
            tag: "Daily",
            category: "Atta",
            price: 180,
            unit: "kg",
            image: "atta4.jpeg",
            description: "Fine, soft white atta that gives perfect rotis, naan and bakery at home.",
        },
        {
            id: "makai-ka-atta",
            name: "Makai ka Atta",
            tag: "Fresh",
            category: "Atta",
            price: 210,
            unit: "kg",
            image: "img/makai-atta.svg",
            description: "Fresh ground corn (maize) flour — perfect for makai ki roti and traditional dishes.",
        },
        {
            id: "jo-ka-atta",
            name: "Jo ka Atta",
            tag: "Healthy",
            category: "Atta",
            price: 280,
            unit: "kg",
            image: "img/jo-atta.svg",
            description: "Wholesome barley (jo) flour, rich in fibre — healthy and traditionally ground.",
        },
        {
            id: "chawal-ka-atta",
            name: "Chawal ka Atta",
            tag: "Special",
            category: "Flour",
            price: 300,
            unit: "kg",
            image: "img/chawal-atta.svg",
            description: "Fine rice flour (chawal ka atta) for baking, traditional sweets and crispy snacks.",
        },
        {
            id: "gandum-ka-dalia",
            name: "Gandum ka Dalia",
            tag: "Healthy",
            category: "Dalia",
            price: 220,
            unit: "kg",
            image: "img/gandum-dalia.svg",
            description: "Coarse-ground cracked wheat dalia — a wholesome, fibre-rich breakfast choice.",
        },
        {
            id: "jo-ka-dalia",
            name: "Jo ka Dalia",
            tag: "Premium",
            category: "Dalia",
            price: 360,
            unit: "kg",
            image: "img/jo-dalia.svg",
            description: "Cracked barley dalia, full of fibre and nutrition — traditionally ground and pure.",
        },
        {
            id: "bajre-ka-atta",
            name: "Bajre ka Atta",
            tag: "Winter Favourite",
            category: "Atta",
            price: 200,
            unit: "kg",
            image: "img/bajra-atta.svg",
            description: "Pearl millet (bajra) flour — a healthy, warming choice for bajra roti in winter.",
        },
    ],

    /* -------------------------------------------------------------- FORMAT */
    currency: "Rs",
};