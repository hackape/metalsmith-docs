// @ts-check
// process.env.DEBUG = 'metalsmith-layouts'
// process.env.DEBUG='metalsmith-layouts'
const MetalSmith = require("metalsmith");
const path = require('path')
const markdown = require("metalsmith-markdown-remarkable");
const layouts = require("metalsmith-layouts");
const sass = require('metalsmith-sass');
const fs = require('fs-extra')
const readdir = require('recursive-readdir')
const lunrPlugin = require('./lib/lunrPlugin2');
const summaryPlugin = require('./lib/summaryPlugin')

const ROOT = __dirname

function setStyles(files, metalsmith) {
  files['../layouts/styles.scss'] = {
    contents: fs.readFileSync(path.resolve(ROOT, 'layouts/styles.scss'))
  }

  return files
}

async function addAssets(files, __, done) {
  const assetsDir = path.resolve(ROOT, 'assets')
  const assetFiles = await readdir(assetsDir)

  const assetEntries = await Promise.all(assetFiles.map(fpath => {
    return fs.readFile(fpath).then(contents => [path.relative(assetsDir, fpath), { isAsset: true, contents }])
  }))

  assetEntries.forEach(([key, value]) => {
    files[key] = value
  })

  done()
}

function markAsLunrIndexablePlugin(files, metalsmith) {
  const keys = Object.keys(files)
  keys.forEach(key => {
    if (key.endsWith('.md')) {
      files[key].lunr = true
    }
  })
  return files
}

MetalSmith(ROOT)
  .metadata({
    sitename: "第四范式"
  })
  .concurrency(Infinity)
  .ignore(['.git'])
  .source(path.resolve(ROOT, './src'))
  .destination("./dist")
  .clean(true)
  .use(addAssets)
  .use(summaryPlugin)
  .use(markAsLunrIndexablePlugin)
  .use(lunrPlugin)
  .use(markdown("full", {}))
  .use(layouts({ pattern: "**/*.html", directory: "layouts", engineOptions: {}, suppressNoFilesError: false, default: 'layout.pug' }))
  .use(setStyles)
  .use(sass({
    outputStyle: "expanded",
    outputDir: './'
  }))
  .build(err => {
    if (err) throw err;
  });
