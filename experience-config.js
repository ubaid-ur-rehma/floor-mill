// Replaceable experience data. Keep scene logic independent from brand assets.
window.NAC_EXPERIENCE = {
    brand: {
        name: "Nazir Atta Chakki",
        logo: "assets/products/nazir-logo.png",
        font: "assets/fonts/brand.woff2",
    },
    assets: {
        packageModel: "assets/models/nazir-atta-pack.glb",
        wheatModel: "assets/models/wheat-head.glb",
        chakkiModel: "assets/models/traditional-chakki.glb",
        wheatTexture: "assets/textures/wheat-normal.webp",
        flourTexture: "assets/textures/flour-detail.webp",
        windAudio: "assets/audio/wind.ogg",
        chakkiAudio: "assets/audio/chakki.ogg",
    },
    products: [
        { id: "desi-gandum-atta", name: "Desi Gandum ke Atta", price: 180, unit: "kg", image: "atta2.jpeg", tag: "Bestseller", description: "Whole-wheat desi atta, traditionally ground for a rich, natural taste and full nutrition." },
        { id: "narala-supreme-chawal", name: "Narala Supreme Chawal", price: 415, priceMax: 430, unit: "kg", image: "atta3.jpeg", tag: "Premium", description: "Premium long-grain rice with a delicate aroma - perfect for biryani and everyday meals." },
        { id: "white-atta", name: "White Atta", price: 180, unit: "kg", image: "atta4.jpeg", tag: "Daily", description: "Fine, soft white atta that gives perfect rotis, naan and bakery at home." },
        { id: "makai-atta", name: "Makai ka Atta", price: 210, unit: "kg", image: "img/makai-atta.svg", tag: "Fresh", description: "Fresh ground corn (maize) flour - perfect for makai ki roti and traditional dishes." },
        { id: "jo-atta", name: "Jo ka Atta", price: 280, unit: "kg", image: "img/jo-atta.svg", tag: "Healthy", description: "Wholesome barley (jo) flour, rich in fibre - healthy and traditionally ground." },
        { id: "chawal-atta", name: "Chawal ka Atta", price: 300, unit: "kg", image: "img/chawal-atta.svg", tag: "Special", description: "Fine rice flour (chawal ka atta) for baking, traditional sweets and crispy snacks." },
        { id: "gandum-dalia", name: "Gandum ka Dalia", price: 220, unit: "kg", image: "img/gandum-dalia.svg", tag: "Healthy", description: "Coarse-ground cracked wheat dalia - a wholesome, fibre-rich breakfast choice." },
        { id: "jo-dalia", name: "Jo ka Dalia", price: 360, unit: "kg", image: "img/jo-dalia.svg", tag: "Premium", description: "Cracked barley dalia, full of fibre and nutrition - traditionally ground and pure." },
        { id: "bajra-atta", name: "Bajre ka Atta", price: 200, unit: "kg", image: "img/bajra-atta.svg", tag: "Winter Favourite", description: "Pearl millet (bajra) flour - a healthy, warming choice for bajra roti in winter." }
    ],
    sizes: ["1 KG", "2 KG", "5 KG", "10 KG"]
};
window.NAC_PRODUCTS = window.NAC_EXPERIENCE.products;
