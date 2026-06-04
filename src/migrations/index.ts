import * as migration_20260523_124715_add_media_collection from './20260523_124715_add_media_collection';
import * as migration_20260523_193000_add_products_collection from './20260523_193000_add_products_collection';
import * as migration_20260523_200000_add_carts_collection from './20260523_200000_add_carts_collection';
import * as migration_20260523_210000_add_wishlists_collection from './20260523_210000_add_wishlists_collection';
import * as migration_20260524_000000_add_coupons_collection from './20260524_000000_add_coupons_collection';
import * as migration_20260524_010000_add_orders_collection from './20260524_010000_add_orders_collection';
import * as migration_20260524_020000_add_reviews_collection from './20260524_020000_add_reviews_collection';
import * as migration_20260524_030000_add_shippingzones_collection from './20260524_030000_add_shippingzones_collection';
import * as migration_20260524_040000_add_blogposts_collection from './20260524_040000_add_blogposts_collection';
import * as migration_20260524_050000_add_pages_collection from './20260524_050000_add_pages_collection';
import * as migration_20260524_060000_add_contactmessages_collection from './20260524_060000_add_contactmessages_collection';
import * as migration_20260524_070000_add_emaillogs_collection from './20260524_070000_add_emaillogs_collection';
import * as migration_20260524_203510_seed_updates from './20260524_203510_seed_updates';
import * as migration_20260603_202126_add_product_fields from './20260603_202126_add_product_fields';

export const migrations = [
  {
    up: migration_20260523_124715_add_media_collection.up,
    down: migration_20260523_124715_add_media_collection.down,
    name: '20260523_124715_add_media_collection',
  },
  {
    up: migration_20260523_193000_add_products_collection.up,
    down: migration_20260523_193000_add_products_collection.down,
    name: '20260523_193000_add_products_collection',
  },
  {
    up: migration_20260523_200000_add_carts_collection.up,
    down: migration_20260523_200000_add_carts_collection.down,
    name: '20260523_200000_add_carts_collection',
  },
  {
    up: migration_20260523_210000_add_wishlists_collection.up,
    down: migration_20260523_210000_add_wishlists_collection.down,
    name: '20260523_210000_add_wishlists_collection',
  },
  {
    up: migration_20260524_000000_add_coupons_collection.up,
    down: migration_20260524_000000_add_coupons_collection.down,
    name: '20260524_000000_add_coupons_collection',
  },
  {
    up: migration_20260524_010000_add_orders_collection.up,
    down: migration_20260524_010000_add_orders_collection.down,
    name: '20260524_010000_add_orders_collection',
  },
  {
    up: migration_20260524_020000_add_reviews_collection.up,
    down: migration_20260524_020000_add_reviews_collection.down,
    name: '20260524_020000_add_reviews_collection',
  },
  {
    up: migration_20260524_030000_add_shippingzones_collection.up,
    down: migration_20260524_030000_add_shippingzones_collection.down,
    name: '20260524_030000_add_shippingzones_collection',
  },
  {
    up: migration_20260524_040000_add_blogposts_collection.up,
    down: migration_20260524_040000_add_blogposts_collection.down,
    name: '20260524_040000_add_blogposts_collection',
  },
  {
    up: migration_20260524_050000_add_pages_collection.up,
    down: migration_20260524_050000_add_pages_collection.down,
    name: '20260524_050000_add_pages_collection',
  },
  {
    up: migration_20260524_060000_add_contactmessages_collection.up,
    down: migration_20260524_060000_add_contactmessages_collection.down,
    name: '20260524_060000_add_contactmessages_collection',
  },
  {
    up: migration_20260524_070000_add_emaillogs_collection.up,
    down: migration_20260524_070000_add_emaillogs_collection.down,
    name: '20260524_070000_add_emaillogs_collection',
  },
  {
    up: migration_20260524_203510_seed_updates.up,
    down: migration_20260524_203510_seed_updates.down,
    name: '20260524_203510_seed_updates',
  },
  {
    up: migration_20260603_202126_add_product_fields.up,
    down: migration_20260603_202126_add_product_fields.down,
    name: '20260603_202126_add_product_fields'
  },
];
