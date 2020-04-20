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

module.exports = isNode ? z.pkg.require('z.js-node', z.meta.version) : z.pkg.require('z.js-web', z.meta.version)
