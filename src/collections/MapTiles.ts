import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const MapTiles: CollectionConfig = {
  slug: 'maptiles',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'info',
  },
  fields: [
    {
      name: 'info',
      type: 'text',
      required: true
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users'
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
    },
    {
      name: 'visible',
      type: 'checkbox'
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'hexImages',
    },
    {
      name: 'icons',
      type: 'text',
      maxLength: 3
    },
    {
      name: 'color',
      type: 'select',
      options: [
        { label: 'Gelb', value: 'yellow' },
        { label: 'Rot', value: 'red' },
        { label: 'Weiß', value: 'white' },
      ],
    },
    {
      name: 'description',
      type: 'richText'
    },
    lexicalHTMLField({
      htmlFieldName: 'description_html',
      lexicalFieldName: 'description',
    }),
  ],
}
