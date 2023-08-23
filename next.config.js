/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack:(config) => {
        config.module.rules.push({
            test: /\.worker\.js$/,
            loader: 'worker-loader',
            options: {
                name: 'static/[hash].worker.js',
                publicPath: '/_next/'
            }
        })
        // Overcome Webpack referencing `window` in chunks
        // config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`
        return config
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: "require-corp",
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    }
                ],
            }
        ]
    }
}

module.exports = nextConfig
