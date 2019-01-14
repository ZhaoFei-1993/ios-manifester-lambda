import url from 'url'
import { Readable } from 'stream'
import { manifest } from './manifest'

class Manifester {
  bundleOptions

  constructor (bundleOptions) {
    this.bundleOptions = bundleOptions
  }

  create = urls => {
    return manifest(this.bundleOptions, urls)
  }

  serve = (req, res) => {
    const stream = new Readable()
    stream.push(this.create(url.parse(req.url, true).query))
    stream.push(null)
    res.setHeader('content-type', 'text/xml')
    stream.pipe(res)
  }
}

export { Manifester }
