import { unzipSync } from 'fflate'

function decodeUtf8(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

function parseRelationships(xml) {
  const map = {}
  const re = /Id="([^"]+)"[^>]*Target="([^"]+)"/g
  let m
  while ((m = re.exec(xml))) {
    map[m[1]] = m[2].replace(/\\/g, '/')
  }
  return map
}

function resolveZipPath(fromPath, target) {
  if (target.startsWith('/')) return target.slice(1)
  const parts = fromPath.split('/').slice(0, -1)
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

function bytesToDataUrl(bytes, mime) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

function mimeFor(path) {
  const p = path.toLowerCase()
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg'
  if (p.endsWith('.gif')) return 'image/gif'
  if (p.endsWith('.webp')) return 'image/webp'
  return null
}

function worksheetPathForSheet(files, sheetName) {
  const wbXml = files['xl/workbook.xml']
  const relsFile = files['xl/_rels/workbook.xml.rels']
  if (!wbXml || !relsFile) return null
  const rels = parseRelationships(decodeUtf8(relsFile))
  const xml = decodeUtf8(wbXml)
  const re = /<sheet\b[^>]*>/g
  let m
  while ((m = re.exec(xml))) {
    const tag = m[0]
    const name = /name="([^"]+)"/.exec(tag)?.[1]
    const rid = /r:id="([^"]+)"/.exec(tag)?.[1]
    if (name === sheetName && rid && rels[rid]) {
      return resolveZipPath('xl/workbook.xml', rels[rid])
    }
  }
  return null
}

function imageFromWorksheet(files, worksheetPath) {
  if (!worksheetPath) return null
  const relsPath = worksheetPath.replace('xl/worksheets/', 'xl/worksheets/_rels/') + '.rels'
  if (!files[relsPath]) return null
  const rels = parseRelationships(decodeUtf8(files[relsPath]))
  const drawingTarget = Object.values(rels).find((t) => t.includes('drawings/'))
  if (!drawingTarget) return null
  const drawingPath = resolveZipPath(relsPath, drawingTarget)
  const drawingRelsPath = drawingPath.replace('xl/drawings/', 'xl/drawings/_rels/') + '.rels'
  if (!files[drawingRelsPath]) return null
  const imgRels = parseRelationships(decodeUtf8(files[drawingRelsPath]))
  const targets = Object.values(imgRels).filter((t) => /image/i.test(t))
  const preferred =
    targets.find((t) => /\.jpe?g$/i.test(t)) ||
    targets.find((t) => /\.png$/i.test(t)) ||
    targets[0]
  if (!preferred) return null
  return resolveZipPath(drawingRelsPath, preferred)
}

/**
 * Extract the property photograph from the OLIVE workbook ZIP (xlsx).
 * Prefers the raster image anchored on Property Summary; falls back to the
 * largest raster in xl/media. EMF/WMF drawings are ignored.
 */
export function extractPropertyImage(arrayBuffer) {
  const files = unzipSync(new Uint8Array(arrayBuffer))
  const names = Object.keys(files)
  const preferredMedia = imageFromWorksheet(
    files,
    worksheetPathForSheet(files, 'Property Summary')
  )

  const tryPath = (path) => {
    if (!path || !files[path]) return null
    const mime = mimeFor(path)
    if (!mime) return null
    return { dataUrl: bytesToDataUrl(files[path], mime), path }
  }

  const preferred = tryPath(preferredMedia)
  if (preferred) return preferred

  let best = null
  let bestSize = 0
  for (const name of names) {
    if (!name.startsWith('xl/media/')) continue
    const mime = mimeFor(name)
    if (!mime) continue
    const size = files[name].length
    if (size > bestSize) {
      bestSize = size
      best = tryPath(name)
    }
  }
  return best
}
