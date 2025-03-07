module.exports = {
  devServer: {
    proxy: {
      '^/api': {
        target: 'https://217.114.2.103',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
}
