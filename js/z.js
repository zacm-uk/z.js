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

const get = url => {
  if (isNode) {
    const fn = require(url.startsWith('https') ? 'https' : 'http').get
    return new Promise((resolve, reject) => {
      fn(url, response => {
        let data = ''
        response.on('data', chunk => data += chunk)
        response.on('end', () => resolve(data))
      })
        .on('error', reject)
    })
  }
  return fetch(url)
    .then(res => res.text())
}

const empireLoaded = get('https://raw.githubusercontent.com/zacm-uk/z-empire/master/z-empire-client.js')
  .then(script => {
    const module = { exports: {} }
    eval(script)
    if (isNode) {
      Object.assign(global, module.exports)
    }
  })

const getMeta = (metaKey, client) => client.getData(metaKey).then(({ value }) => (value ? JSON.parse(value) : { keyMap: {} }))

const setMeta = (meta, metaKey, client) => client.updateData(metaKey, JSON.stringify(meta))

const toHex = isNode ? str => Buffer.from(str).toString('hex') : str => {
  str = unescape(encodeURIComponent(str))
  let hex = ''
  for (let i = 0; i < str.length; ++i) {
  hex += str.charCodeAt(i).toString(16)
}
return hex
}

const fromHex = isNode ? hex => Buffer.from(hex, 'hex').toString() : hex => {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return decodeURIComponent(escape(str))
}

const getPackage = async (name, version, metaKey, client) => {
  const { keyMap } = await getMeta(metaKey, client)
  const storageKey = keyMap[`${ name }~${ version }`]
  const { value } = await client.getData(storageKey)
  return value ? fromHex(value) : null
}

const uploadPackage = async (name, version, buffer, metaKey, client) => {
  const data = toHex(buffer)
  const { storageKey } = await client.setData(`${ name }~${ version }`, data)
  const meta = await getMeta(metaKey, client)
  meta.keyMap[`${ name }~${ version }`] = storageKey
  await setMeta(meta, metaKey, client)
}

class PackageContext {
  constructor({ nodeList, packageMetaKey } = {
    nodeList: [ 'https://empire.zacm.uk' ],
    packageMetaKey: 'e4dfa4869929ac25b16da3c9aa9e7ce8db66a522a9ebf34478d33ea15ab18984'
  }) {
    this.autoInstallMissing = true
    this.store = {}
    this.client = empireLoaded.then(() => new EmpireClient({ nodeList, storageDriver: 'memory' }))
    this.metaKey = packageMetaKey
  }

  async remove(name, version) {
    delete this.store[`${ name }~${ version }`]
  }

  async install(name, version) {
    this.store[`${ name }~${ version }`] = await getPackage(name, version, this.metaKey, await this.client)
  }

  async execute(str) {
    return PackageContext._runScript(str)
  }

  async require(name, version) {
    if (!this.store[`${ name }~${ version }`]) {
      if (!this.autoInstallMissing) {
        throw new Error(`Package "${ name }@${ version }" is not installed and "autoInstallMissing" is not enabled`)
      }
      await this.install(name, version)
    }
    return PackageContext._runScript(this.store[`${ name }~${ version }`])
  }

  async uploadPackage(name, version, str) {
    await uploadPackage(name, version, str, this.metaKey, await this.client)
  }

  static _runScript(script) {
    const z = createNewGlobalContext()
    const fn = eval(`(async () => {
      ${ script }
    })`)
    return fn()
  }
}

const createNewGlobalContext = () => ({
  pkg: new PackageContext()
})

Object.defineProperty(isNode ? module.exports : window, 'z', {
  value: createNewGlobalContext(),
  enumerable: true,
  configurable: true
})
