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
      name: 'gms',
      type: 'text'
    },
    {
      name: 'players',
      type: 'array',
      fields: [
        {
        name: 'player',
        type: 'text'
        }
      ]
    },
    {
      name: 'when',
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
      name: 'sort',
      type: 'number',
      label: 'Sortierung (absteigend)'
    },
    {
      name: 'pinned',
      type: 'checkbox'
    }
  ],
}
