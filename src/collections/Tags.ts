import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'tag',
  },
  fields: [
   {
    name: 'tag',
    type: 'text'
   },
  ],
}
