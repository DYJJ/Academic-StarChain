/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['flowbite-react', 'react-icons'],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GITHUB_API_KEY: process.env.NEXT_PUBLIC_GITHUB_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_OPENAI_API_URL: process.env.NEXT_PUBLIC_OPENAI_API_URL
  }
};

export default nextConfig; 