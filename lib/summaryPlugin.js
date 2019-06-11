// @ts-check
const fs = require('fs-extra')
const path = require('path')
const isDirectory = fpath => fs.statSync(fpath).isDirectory()
const SUMMARY_MD = 'SUMMARY.md'
const Remarkable = require('remarkable')
const cheerio = require('cheerio')

const summaryOrder = [
  'getstarted',
  'pdms',
  'modelide',
  'appide',
  'modelcenter',
  'appcenter',
  'middleware',
  'Manage Platform',
  'new word',
  'developer document',
  'runtimeSDK',
  'PAS',
  'PWS',
  'PMS',
  'IAM',
  'console',
  'best practice'
].map(dirname => dirname.toLowerCase())

const sortByFixedOrder = (a, b) => {
  const subdir_a = a.slice(a.lastIndexOf('/')+1)
  const subdir_b = b.slice(b.lastIndexOf('/')+1)
  const order_a = summaryOrder.indexOf(subdir_a.toLowerCase())
  const order_b = summaryOrder.indexOf(subdir_b.toLowerCase())
  return order_a - order_b
}

const md = new Remarkable()
function summaryPlugin(files, metasmith) {
  const source = metasmith._source
  const subdirs = fs.readdirSync(source).map(file => {
    const fpath = path.resolve(source, file)
    return fpath
  })
  .filter(fpath => isDirectory(fpath))
  .sort(sortByFixedOrder)
  .map(fpath => path.relative(source, fpath))
  
  const aggregatedSummaryText = subdirs.reduce((summary, subdir) => {
    const fpath = `${subdir}/${SUMMARY_MD}`
    if (files[fpath]) {
      const rawText = files[fpath].contents.toString()
      delete files[fpath]
      const lines = rawText.trim().split('\n').map(line => line.trimRight()).filter(x => x)

      const normalizeLink = (str) => {
        if (str.length === 2) return '(#)'
        const link = str.slice(1, str.length - 1)
        
        let linkSplitted = link.split('/')
        const firstSeg = linkSplitted[0]
        if (firstSeg === '.') {
          linkSplitted[0] = subdir
          linkSplitted = [''].concat(linkSplitted)
        } else if (firstSeg === '..') {
          linkSplitted[0] = ''
        } else {
          linkSplitted = ['', subdir].concat(linkSplitted)
        }
        const linkJoin = /*encodeURI*/(linkSplitted.join('/').replace(/.md$/, '.html'))

        return `(${linkJoin.replace(' ', '%20')})`
      }

      const summaryText = lines.map(line => {
        return line.replace(/^(\s*)([\*\-\+]\ +)(\[.+\])(\(.*\)){0,1}/g, (__, $1, $2, $3, $4) => {
          return $1 + '* ' + $3 + ($4 ? normalizeLink($4) : '(#)')
        })
      })
      .filter(line => line)
      .join('\n')
      .trimLeft()

      return summary + summaryText + '\n'
    }
    return summary
  }, '')

  const summaryHtml = md.render(aggregatedSummaryText)
  const $ = cheerio.load(summaryHtml)
  const $ul = $('body > ul')

  const traverseSummary = ($ul, level="1") => {
    const $lis = $ul.children('li')
    const levelSplit = level.split('.')
    $lis.each((i, element) => {
      const index = i + 1
      const curLevel = levelSplit.concat(index).join('.')
      const $li = $(element)
      $li.addClass('chapter')
      $li.attr('data-level', curLevel)
      const $as = $li.children('a')
      const $a = $as.first()
      $a.append($('<i class="fa exc-trigger"></i>'))
      const href = $a.attr('href')
      $li.attr('data-path', href)
      const $uls = $li.children('ul')
      if ($uls.length) {
        const $ul = $uls.first()
        $ul.addClass('articles')
        traverseSummary($ul, curLevel)
      }
    })
  }

  $ul.addClass('summary')
  traverseSummary($ul)

  metasmith._metadata.summary = $('body').html()
  return files
}

module.exports = summaryPlugin