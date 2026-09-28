import { Product, CustomerCart, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Essentials Oversized Street Shirt',
    cat: 'shirts',
    price: 35000,
    img: '/images/essentials polo.jpg',
    altImg: '/images/essentials shirt 2.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Heavyweight drop-shoulder silhouette cut from 260 GSM organic combed cotton with raw architectural seams.',
    composition: '100% Combed Heavy Cotton. Pre-shrunk finish. Machine wash cold inside out.',
    tag: 'NEW',
    inStock: true
  },
  {
    id: 2,
    name: 'Balenciaga Camo Slim Jean',
    cat: 'trousers',
    price: 120000,
    img: '/images/balenciaga camo pants.jpg',
    altImg: '/images/balenciaga camo 2.jpg',
    sizes: ['30', '32', '34', '36'],
    description: 'Sculptural Japanese selvedge denim featuring hand-distressed military wash accents and signature branded matte hardware.',
    composition: '98% Cotton, 2% Elastane Selvedge Denim. Hand-wash or specialist dry clean only.',
    tag: 'CAPSULE',
    inStock: true
  },
  {
    id: 3,
    name: 'BAPE Shark Full-Zip Fleece Hoodie',
    cat: 'hoodies',
    price: 95000,
    img: '/images/shark hoodie.jpg',
    altImg: '/images/bape shark hoodie 2.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Iconic double-hood full-zip statement piece engineered with high-density jacquard patches and fleece backing.',
    composition: '100% French Terry Loopback Cotton. Metal dual zipper.',
    tag: 'LIMITED',
    inStock: true
  },
  {
    id: 4,
    name: "Nike Air Force 1 '07 Luxe White",
    cat: 'shoes',
    price: 75000,
    img: "/images/white nike airforce 1 '07.jpg",
    altImg: "/images/white nike airforce 1 '07 2.jpg",
    sizes: ['40', '41', '42', '43', '44', '45'],
    description: 'Pristine triple-white tumbled calfskin leather with encapsulated Air sole cushioning and perforated vamp.',
    composition: 'Full-grain tumbled leather upper, solid rubber cupsole.',
    tag: 'BESTSELLER',
    inStock: true
  },
  {
    id: 5,
    name: 'Ralph Lauren Custom Slim Polo',
    cat: 'shirts',
    price: 45000,
    img: '/images/ralph and lauren.jpg',
    altImg: '/images/ralph and lauren 2.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Heritage breathable cotton mesh polo with mother-of-pearl buttons and signature tonal embroidery.',
    composition: '100% Pima Cotton Mesh. Gentle cycle.',
    inStock: true
  },
  {
    id: 6,
    name: 'Numeris Handcrafted Leather Brogue',
    cat: 'shoes',
    price: 85000,
    img: '/images/numeris.jpg',
    altImg: '/images/numeris white.jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Goodyear welted Italian crust leather dress shoes with burnished toe box and waxed laces.',
    composition: '100% Hand-burnished Calf Leather. Stacked wooden and rubber heel.',
    tag: 'NEW',
    inStock: true
  },
  {
    id: 7,
    name: 'Stone Island Raw Linen Overshirt',
    cat: 'shirts',
    price: 60000,
    img: '/images/stone island overshirt.jpg',
    altImg: '/images/stone island overshirt 2.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Garment-dyed structured utility shirt featuring chest bellow pockets and detachable signature compass badge.',
    composition: '100% Belgian Washed Linen. Mild detergent wash.',
    tag: 'CAPSULE',
    inStock: true
  },
  {
    id: 8,
    name: 'Gucci GG Supreme Monogram Canvas Cap',
    cat: 'caps',
    price: 65000,
    img: '/images/gucci cap.jpg',
    altImg: '/images/gucci cap 2.jpg',
    sizes: ['One Size'],
    description: 'Classic baseball hat in beige/ebony GG Supreme canvas with adjustable calfskin hook-and-loop closure.',
    composition: '68% Polyurethane canvas, 32% Cotton lining, 100% Calf Leather trim.',
    tag: 'NEW',
    inStock: true
  },
  {
    id: 9,
    name: 'Amiri Paint-Splatter Cargo Trouser',
    cat: 'trousers',
    price: 95000,
    img: '/images/Amiri complete.jpg',
    altImg: '/images/amiri 2.jpg',
    sizes: ['30', '32', '34'],
    description: 'Multi-pocket utilitarian trousers with hand-applied artisanal paint details and toggle cuff adjusters.',
    composition: '100% Heavy Twill Cotton.',
    inStock: true
  },
  {
    id: 10,
    name: 'Air Jordan 4 Retro Military Black',
    cat: 'shoes',
    price: 110000,
    img: '/images/air jordan 4 retro.jpg',
    altImg: '/images/air jordan 4 retro 2.jpg',
    sizes: ['41', '42', '43', '44'],
    description: 'High top court classic rendered in smooth white leather with neutral grey suede forefoot overlays.',
    composition: 'Smooth leather, suede, TPU eyelet wings.',
    tag: 'LIMITED',
    inStock: true
  },
  {
    id: 11,
    name: 'Nike Tech Fleece Tactical Short',
    cat: 'shorts',
    price: 32000,
    img: '/images/nike shorts.jpg',
    altImg: '/images/nike shorts (2).jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Lightweight double-sided spacer fleece designed for premium warmth without added bulk.',
    composition: '66% Cotton, 34% Polyester Tech Fleece.',
    inStock: true
  },
  {
    id: 12,
    name: 'Ferragamo Gancini Reversible Leather Belt',
    cat: 'belts',
    price: 42000,
    img: '/images/ferragamo belt.jpg',
    altImg: '/images/ferragamo belt 2.jpg',
    sizes: ['One Size (110cm)', 'One Size (120cm)'],
    description: 'Dual-tone reversible calfskin belt fastened by an antique palladium-finish iconic double Gancini buckle.',
    composition: '100% Full-grain Calf Leather with brushed palladium hardware.',
    inStock: true
  },
  {
    id: 13,
    name: 'Louis Vuitton Keepall Bandoulière 50',
    cat: 'bags',
    price: 180000,
    img: '/images/luois vuitton duffel bag.jpg',
    altImg: '/images/louis vuitton keepall bag.jpg',
    sizes: ['One Size (50cm)'],
    description: 'Monogram Eclipse coated canvas travel duffle bag with black cowhide leather trim and silver padlock.',
    composition: 'Coated Canvas, Textile Lining, Cowhide Leather Trim.',
    tag: 'LIMITED',
    inStock: true
  },
  {
    id: 14,
    name: 'Adidas Adilette Comfort Slides Black',
    cat: 'slides',
    price: 18000,
    img: '/images/nike pool slides.jpg',
    altImg: '/images/nike pool slides 2.jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Contoured Cloudfoam Plus footbed for superior pillow-soft cushioning with 3-Stripes bandage upper.',
    composition: 'Synthetic single-bandage upper with EVA outsole.',
    inStock: true
  },
  {
    id: 15,
    name: 'Essentials Pullover Hoodie',
    cat: 'hoodies',
    price: 85000,
    img: '/images/essentials hoodie.jpg',
    altImg: '/images/essentials hoodie 2.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Minimal heavyweight fleece hoodie with a relaxed streetwear silhouette.',
    composition: '100% Cotton Fleece.',
    tag: 'NEW',
    inStock: true
  },
  {
    id: 16,
    name: 'Adidas Statement Hoodie',
    cat: 'hoodies',
    price: 70000,
    img: '/images/adidas hoodie.jpg',
    altImg: '/images/adidas hoodie 2.png',
    sizes: ['M', 'L', 'XL'],
    description: 'Sport-inspired hooded layer with a clean everyday fit.',
    composition: 'Cotton blend fleece.',
    inStock: true
  },
  {
    id: 17,
    name: 'Balenciaga Tailored Trouser',
    cat: 'trousers',
    price: 110000,
    img: '/images/balenciaga pants.jpg',
    altImg: '/images/balenciaga pants 2.jpg',
    sizes: ['30', '32', '34', '36'],
    description: 'Relaxed luxury trouser with a structured drape and refined finish.',
    composition: 'Premium cotton blend.',
    tag: 'CAPSULE',
    inStock: true
  },
  {
    id: 18,
    name: 'Balenciaga Court Sneaker',
    cat: 'shoes',
    price: 105000,
    img: '/images/balenciaga shoe.jpg',
    altImg: '/images/balenciaga shoe2 .jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Low-profile statement sneaker with layered panel construction.',
    composition: 'Leather and textile upper with rubber sole.',
    inStock: true
  },
  {
    id: 19,
    name: 'Balenciaga Logo Slides',
    cat: 'slides',
    price: 38000,
    img: '/images/balenciaga slide.jpg',
    altImg: '/images/balenciaga slide 2.jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Luxury everyday slides with a sculpted comfort footbed.',
    composition: 'Moulded synthetic upper and EVA sole.',
    inStock: true
  },
  {
    id: 20,
    name: 'Dior Leather Belt',
    cat: 'belts',
    price: 50000,
    img: '/images/dior belt.jpg',
    altImg: '/images/dior belt 2.jpg',
    sizes: ['One Size (110cm)', 'One Size (120cm)'],
    description: 'Polished leather belt finished with a signature fashion-house buckle.',
    composition: 'Full-grain leather with metal hardware.',
    inStock: true
  },
  {
    id: 21,
    name: 'Gucci Reversible Leather Belt',
    cat: 'belts',
    price: 48000,
    img: '/images/gucci belt.jpg',
    altImg: '/images/gucci belt 2.jpg',
    sizes: ['One Size (110cm)', 'One Size (120cm)'],
    description: 'Reversible leather belt with a refined branded buckle.',
    composition: 'Full-grain leather.',
    inStock: true
  },
  {
    id: 22,
    name: 'Gucci Crossbody Bag',
    cat: 'bags',
    price: 125000,
    img: '/images/gucci cross bag.jpg',
    altImg: '/images/gucci cross bag 2.jpg',
    sizes: ['One Size'],
    description: 'Compact crossbody bag designed for hands-free daily carry.',
    composition: 'Coated canvas with leather trim.',
    inStock: true
  },
  {
    id: 23,
    name: 'Louis Vuitton Backpack',
    cat: 'bags',
    price: 195000,
    img: '/images/lv backbag.jpg',
    altImg: '/images/lv backbag 2.jpg',
    sizes: ['One Size'],
    description: 'Structured monogram backpack with practical multi-pocket storage.',
    composition: 'Coated canvas with leather trim.',
    tag: 'LIMITED',
    inStock: true
  },
  {
    id: 24,
    name: 'New Balance 550',
    cat: 'shoes',
    price: 80000,
    img: '/images/new balance 550.jpg',
    altImg: '/images/new balance 550 2.jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Classic low-top basketball silhouette with clean retro detailing.',
    composition: 'Leather upper with rubber cupsole.',
    tag: 'BESTSELLER',
    inStock: true
  },
  {
    id: 25,
    name: 'Nike SB Dunk Low Pro',
    cat: 'shoes',
    price: 72000,
    img: '/images/nike sb.jpg',
    altImg: '/images/nike sb 2.jpg',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Versatile Nike trainer built for everyday movement.',
    composition: 'Textile and synthetic upper with rubber sole.',
    inStock: true
  },
  {
    id: 26,
    name: 'Palm Angels Signature Short',
    cat: 'shorts',
    price: 45000,
    img: '/images/palm angels shorts.jpg',
    altImg: '/images/palm angels short.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Relaxed graphic short with a premium streetwear finish.',
    composition: 'Cotton jersey.',
    inStock: true
  },
  {
    id: 27,
    name: 'Adidas Samba Classic',
    cat: 'shoes',
    price: 65000,
    img: '/images/adidas samba.jpg',
    altImg: '/images/adidas samba 2.png',
    sizes: ['40', '41', '42', '43', '44'],
    description: 'Timeless low-profile terrace sneaker with a gum sole.',
    composition: 'Leather upper with rubber sole.',
    inStock: true
  },
  {
    id: 28,
    name: 'Supreme Signature Cap',
    cat: 'caps',
    price: 35000,
    img: '/images/supreme cap.jpg',
    altImg: '/images/supreme cap 2.jpg',
    sizes: ['One Size'],
    description: 'Structured six-panel cap with an unmistakable streetwear identity.',
    composition: 'Cotton twill.',
    inStock: true
  },
  {
    id: 29,
    name: 'Zara Chino Trouser',
    cat: 'trousers',
    price: 30000,
    img: '/images/zara chino.jpg',
    altImg: '/images/zara chino 2.jpg',
    sizes: ['30', '32', '34', '36'],
    description: 'Clean-cut chino trouser for polished everyday dressing.',
    composition: 'Cotton stretch twill.',
    inStock: true
  },
  {
    id: 30,
    name: 'Lacoste Structured Bag',
    cat: 'bags',
    price: 75000,
    img: '/images/lacoste bag.jpg',
    altImg: '/images/lacoste bag 2.jpg',
    sizes: ['One Size'],
    description: 'Compact structured bag with a refined sport-luxury profile.',
    composition: 'Textured synthetic leather.',
    inStock: true
  },
  {
    id: 31,
    name: 'Essentials Logo Cap',
    cat: 'caps',
    price: 28000,
    img: '/images/essentials cap.jpg',
    altImg: '/images/essentials cap 2.jpg',
    sizes: ['One Size'],
    description: 'Minimal six-panel cap with a versatile everyday fit.',
    composition: 'Cotton twill.',
    inStock: true
  },
  {
    id: 32,
    name: 'Essentials Logo Jogger',
    cat: 'trousers',
    price: 55000,
    img: '/images/essentials joggers.jpg',
    altImg: '/images/essentials joggers 2.jpg',
    sizes: ['M', 'L', 'XL'],
    description: 'Comfort-first jogger with a clean tapered silhouette.',
    composition: 'Cotton fleece.',
    inStock: true
  },
  {
    id: 33,
    name: 'Lacoste Bross-body Bag',
    cat: 'bags',
    price: 45000,
    img: '/images/lacoste cross bag.jpg',
    altImg: '/images/lacoste cross bag 2.jpg',
    sizes: ['One Size'],
    description: 'Compact structured bag with a refined sport-luxury profile.',
    composition: 'Textured synthetic leather.',
    inStock: true
  },
  {
    id: 34,
    name: 'Louis Vuitton Back Bag',
    cat: 'bags',
    price: 85000,
    img: '/images/lv backbag 3.jpg',
    altImg: '/images/lv backbag 4.jpg',
    sizes: ['One Size'],
    description: 'Compact structured bag with a refined sport-luxury profile.',
    composition: 'Textured synthetic leather.',
    inStock: true
  }
];

export const INITIAL_CARTS: CustomerCart[] = [
  {
    id: 'cart-1',
    name: 'Oloro Idris',
    phone: '0803 210 4456',
    items: [
      { name: 'BAPE Shark Full-Zip Hoodie (L)', qty: 1, price: 95000 },
      { name: 'Gucci GG Supreme Canvas Cap', qty: 1, price: 65000 }
    ],
    active: '2 mins ago',
    date: 'Today, 09:42'
  },
  {
    id: 'cart-2',
    name: 'Bidex',
    phone: '0805 990 1123',
    items: [
      { name: 'Balenciaga Camo Slim Jean (32)', qty: 1, price: 120000 },
      { name: "Nike Air Force 1 '07 Luxe White (42)", qty: 1, price: 75000 }
    ],
    active: '14 mins ago',
    date: 'Today, 09:30'
  },
  {
    id: 'cart-3',
    name: 'Karen Imhana',
    phone: '0706 442 7781',
    items: [
      { name: 'Air Jordan 4 Retro Military Black (43)', qty: 1, price: 110000 }
    ],
    active: '1 hour ago',
    date: 'Today, 08:15'
  },
  {
    id: 'cart-4',
    name: 'Voltage',
    phone: '0813 554 9900',
    items: [
      { name: 'Louis Vuitton Keepall Bandoulière 50', qty: 1, price: 180000 },
      { name: 'Ferragamo Gancini Belt', qty: 1, price: 42000 }
    ],
    active: '3 hours ago',
    date: 'Yesterday, 18:40'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#IB1012',
    customer: 'Oloro Idris',
    phone: '0803 210 4456',
    date: '2026-08-26',
    amount: 95000,
    status: 'completed',
    items: 'BAPE Shark Full-Zip Hoodie (L)'
  },
  {
    id: '#IB1011',
    customer: 'Bidex',
    phone: '0805 990 1123',
    date: '2026-08-25',
    amount: 195000,
    status: 'completed',
    items: 'Balenciaga Slim Jean + Air Force 1'
  },
  {
    id: '#IB1010',
    customer: 'Karen Imhana',
    phone: '0706 442 7781',
    date: '2026-08-25',
    amount: 75000,
    status: 'pending',
    items: "Nike Air Force 1 '07 Luxe White"
  },
  {
    id: '#IB1009',
    customer: 'Eberechi Eze',
    phone: '0812 884 1290',
    date: '2026-08-24',
    amount: 240000,
    status: 'completed',
    items: 'Louis Vuitton Keepall 50 + Stone Island Overshirt'
  },
  {
    id: '#IB1008',
    customer: 'Davido Adeleke',
    phone: '0901 332 9901',
    date: '2026-08-24',
    amount: 60000,
    status: 'completed',
    items: 'Stone Island Raw Linen Overshirt'
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Dress like it matters.',
    subtitle: 'Luxury Only.',
    lede: 'Hand-picked tailored shirts, sculptural hoodies, luxury denim, and exclusive footwear for those who demand distinction.',
    bg: '/images/esentials.jpg',
    tag: 'COLLECTION 2026 / AUCHI EXCLUSIVE'
  },
  {
    id: 2,
    title: 'Architectural streetwear.',
    subtitle: 'Sculpted in Detail.',
    lede: 'Curated premium garments direct from global fashion houses, available for immediate nationwide pickup or delivery.',
    bg: '/images/778d5529564feaf39ca5ff6453fc8f8a.jpg',
    tag: 'SUMMER CAPSULE DROPS WEEKLY'
  },
  {
    id: 3,
    title: 'Exclusive Footwear.',
    subtitle: 'Step into Precision.',
    lede: 'Limited edition sneakers, handcrafted Italian calfskin shoes, and luxury leather slides.',
    bg: '/images/shoe banner.jpg',
    tag: 'HANDCRAFTED & VERIFIED AUTHENTIC'
  }
];

export const formatNaira = (amount: number): string => {
  return String.fromCharCode(0x20a6) + Number(amount || 0).toLocaleString('en-NG');
};

export const DELIVERY_FEE_NGN = 7000;

export const CURRENCY = 'NGN';
