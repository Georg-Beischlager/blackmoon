import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Logs: CollectionConfig = {
  slug: 'logs',
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
    type: 'richText'
   },
    lexicalHTMLField({
      htmlFieldName: 'content_html',
      lexicalFieldName: 'content',
    }),
  ],
}
