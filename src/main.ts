import './z-mods'

process.stdin.resume()
process.stdin.on('data', chunk => console.log(eval(`(${ chunk.toString() })`)))
