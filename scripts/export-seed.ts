/**
 * Exports the bundled demo catalogue + orders into a backend seed file.
 *
 * Run:  npm run seed:export   (uses tsx)
 * Output: seed/seed.json
 *
 * The demo products are UI-shaped, so they are mapped through toApiProduct()
 * (contract §2.2: snake_case fields, variants[], images[], category/status)
 * before being written. Order drafts follow contract §2.3.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../src/data/initialData';
import { toApiProduct } from '../src/lib/normalizers';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedDir = join(rootDir, 'seed');

const products = INITIAL_PRODUCTS.map((product) => {
  const api = toApiProduct(product);
  return {
    ...api,
    id: product.id,
    status: (product.status && product.status !== 'draft' ? product.status : 'active') as 'active',
    variants: api.variants.map((variant) => ({
      ...variant,
      stock: variant.stock > 0 ? variant.stock : product.inStock === false ? 0 : 10
    }))
  };
});

const orders = INITIAL_ORDERS.map((order) => ({
  order_number: order.orderNumber,
  customer: { name: order.customer, email: order.email ?? null, phone: order.phone ?? null },
  delivery: order.shippingAddress
    ? { ...order.shippingAddress }
    : { label: 'Home', line1: '', city: '', state: '', country: 'Nigeria' },
  items: [],
  subtotal: order.subtotal ?? 0,
  delivery_fee: order.deliveryFee ?? 0,
  total: order.amount,
  currency: 'NGN',
  payment_status: order.paymentStatus ?? (order.status === 'completed' ? 'paid' : 'pending'),
  order_status: order.orderStatus ?? 'pending',
  payment_reference: order.paymentReference ?? null,
  created_at: order.date ? new Date(order.date).toISOString() : new Date().toISOString(),
  updated_at: order.updatedAt ?? null
}));

mkdirSync(seedDir, { recursive: true });
writeFileSync(
  join(seedDir, 'seed.json'),
  JSON.stringify(
    { products, orders },
    null,
    2
  )
);

console.log(`[seed] wrote seed/seed.json (${products.length} products, ${orders.length} orders).`);
console.log('[seed] import seed.json into your database, or POST each product via /api/products.');