import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
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
    name: 'content',
   type: 'richText'
   },
    lexicalHTMLField({
      htmlFieldName: 'content_html',
      lexicalFieldName: 'content',
    }),
   {
    name: 'related',
    type: 'array',
    fields: [
      {
        name: "to",
        type: 'relationship',
        relationTo: 'database'
      },
      {
        name: 'alias',
        type: 'text'
      }
    ]
   },
   {
    name: 'tags',
    type: 'array',
    fields: [
      {
        name: 'tag',
        type: 'relationship',
        relationTo: 'tags',
      }
    ]
   },
     {
      name: 'coordinates',
      type: 'group',
      fields: [
        {
          name: 'row',
          type: 'number'
        },
        {
        name: 'column',
        type: 'number'
        }
      ]
    }
  ],
}
