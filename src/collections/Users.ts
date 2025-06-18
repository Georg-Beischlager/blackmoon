import { headersWithCors, type CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'short',
      type: 'text',
      access: {
        read: () => true
      }
    }
  ],
  endpoints: [
    {
      path: '/shorts',
      method: 'get',
      handler: async (req) => {
        const data = await req.payload.find({
          collection: 'users',
          select: {
            id: true,
            short: true
          }
        })
        return Response.json(data, { headers: headersWithCors({ headers: new Headers(), req })})
      },
    }
  ],
}
