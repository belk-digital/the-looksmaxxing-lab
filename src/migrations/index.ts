import * as migration_20260523_124715_add_media_collection from './20260523_124715_add_media_collection'
import * as migration_20260523_134655_add_categories_collection from './20260523_134655_add_categories_collection'

export const migrations = [
  {
    up: migration_20260523_124715_add_media_collection.up,
    down: migration_20260523_124715_add_media_collection.down,
    name: '20260523_124715_add_media_collection',
  },
  {
    up: migration_20260523_134655_add_categories_collection.up,
    down: migration_20260523_134655_add_categories_collection.down,
    name: '20260523_134655_add_categories_collection',
  },
]
