$.ajax('/scripts/searchIndex.json').then(lunrConfig => {
  const idx = lunr.Index.load(lunrConfig)
  window.idx = idx
})