import type { CollectionConfig } from 'payload'

export const Database: CollectionConfig = {
  slug: 'database',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
   {
    name: 'title',
    type: 'text'
   },
   {
    name: 'author',
    type: 'relationship',
    relationTo: 'users'
   },
   {
    name: 'created',
    type: 'date'
   },
   {
    name: 'content',
    type: 'json'
   },
    {
    name: 'links',
    type: 'json'
   }
  ],
}
