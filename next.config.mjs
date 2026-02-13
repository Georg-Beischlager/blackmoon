import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: NOT using 'standalone' output because libsql native module doesn't work with it
  // Instead we copy the full node_modules in Dockerfile
  
  serverExternalPackages: ['@libsql/client', 'libsql', 'sharp'],
  
  // Your Next.js config here
  webpack: (webpackConfig, { isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    
    // Externalize native modules on server-side to prevent bundling issues
    if (isServer) {
      webpackConfig.externals = webpackConfig.externals || []
      webpackConfig.externals.push({
        'libsql': 'commonjs libsql',
        '@libsql/client': 'commonjs @libsql/client',
        'sharp': 'commonjs sharp',
      })
    }
    
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
