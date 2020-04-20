const isNode = (() => {
  try {
    const isNode = eval('(process.release.name === "node") && (Object.prototype.toString.call(process) === "[object process]")')
    if (isNode) {
      return true
    }
  } catch {
  }
  return false
})()

if (isNode && !global.z) {
  const { get } = require('https')
  const promiseGet = url => new Promise((resolve, reject) => {
    get(url, response => {
      let data = ''
      response.on('data', chunk => data += chunk)
      response.on('end', () => {
        resolve(data)
      })
    })
      .on('error', reject)
  })
  const loaded = promiseGet('https://raw.githubusercontent.com/zacm-uk/z.js/master/js/z.js')
    .then(script => eval(`(async () => {
      ${ script }
    })()`))
    .then(() => {
      global.z = module.exports.z
    })
  global.zLoaded = loaded
  module.exports = loaded
} else if (!isNode && !window.z) {
  const loaded = fetch('https://raw.githubusercontent.com/zacm-uk/z.js/master/js/z.js')
    .then(res => res.text())
    .then(script => eval(`(async () => {
      ${ script }
    })()`))
  try {
    return loaded
  } catch {
    window.zLoaded = loaded
  }
} else {
  module.exports = isNode ? z.pkg.require('z.js', z.meta.version) : z.pkg.require('z.js', z.meta.version)
  const G = isNode ? global : window
  G.zLoaded = module.exports
  module.exports.then(z => {
    G.z = z
  })
}
