const path = require("path");
const withSass = require("@zeit/next-sass");

module.exports = withSass({
  // scss modules
  cssModules: true,
  cssLoaderOptions: {
    importLoaders: 1,
    localIdentName: "[local]___[hash:base64:5]"
  },
  // sassLoaderOptions: {
  //   data: "@import "global";",
  //   includePaths: [path.resolve(__dirname, "styles")]
  // },

  // static site export config
  exportPathMap: () => ({
    "/": { page: "/" },
    "/contact": { page: "/contact" }
  })
});
