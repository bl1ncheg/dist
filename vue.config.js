module.exports = {
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://217.114.2.103',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
}