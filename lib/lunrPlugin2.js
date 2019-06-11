const lunr = require('lunr');

module.exports = function(files, metalsmith, done) {
  const fileEntries = Object.entries(files)
  const idx = lunr(function () {
    this.ref('id')
    this.field('contents')
    fileEntries.forEach(([key, file]) => {
      if (!file.lunr) return 
      file.id = key
      this.add(file)
    })
  })

  addJSONtoMetalsmith(idx, files, done);
}

function addJSONtoMetalsmith(idx, files, done) {
  files['scripts/searchIndex.json'] = { contents: Buffer.from(JSON.stringify(idx)) };
  done();
}
