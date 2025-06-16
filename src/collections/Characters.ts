import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Characters: CollectionConfig = {
  slug: 'characters',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    {
      name: 'player(s)',
      type: 'text'
    },
    {
      name: 'partOfCrew',
      type: 'checkbox'
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'biography',
      type: 'richText'
    },
    lexicalHTMLField({
      htmlFieldName: 'biography_html',
      lexicalFieldName: 'biography',
    }),
    {
      name: 'sort',
      type: 'number',
      label: 'Sortierung (absteigend)'
    },
  ],
}
