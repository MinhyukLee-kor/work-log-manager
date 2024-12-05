const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/worklog',
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  }
}

module.exports = withPWA(nextConfig) 