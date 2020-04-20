import { join, resolve, extname, basename } from 'path'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'
import { readdir, lstat, readFile, existsSync, mkdir, remove, writeFile } from 'fs-extra'

async function* recursiveRead(dir: string): AsyncGenerator<string> {
  const dirStat = await lstat(dir)
  if (!dirStat.isDirectory()) {
    return [ dir ]
  }
  const files = await readdir(dir)
  for (const filename of files) {
    const path = join(dir, filename)
    const stats = await lstat(path)
    if (stats.isDirectory()) {
      yield* await recursiveRead(path)
    } else {
      yield path
    }
  }
}

export const uploadProject = async (name: string, version: string, dir: string) => {
  console.log(name, version)
  dir = resolve(dir)
  let mainPath: string
  try {
    mainPath = require.resolve(dir)
  } catch {
    mainPath = require.resolve(resolve(dir, 'main.js'))
  }
  console.log(mainPath)
  const allowedExtensions = [ '.js' ]

  const files: { [key: string]: { file: string, newName: string } } = {}

  for await (const file of recursiveRead(dir)) {
    if (!allowedExtensions.includes(extname(file))) {
      console.warn(`Ignoring ${ file } because it does not end with any of the following: ${ allowedExtensions.join(', ') }`)
      continue
    }
    files[file] = {
      file: await readFile(file, 'utf-8'),
      newName: file === mainPath ? `${ name }` : `${ name }${ file.replace(dir, '') }`
    }
  }
  const tempDir = join(tmpdir(), randomBytes(12).toString('hex'))
  if (!existsSync(tempDir)) {
    await mkdir(tempDir)
  }
  for (let [ path, file ] of Object.entries(files)) {
    const cwd = path.replace(basename(path), '')
    for (const matchResult of file.file.matchAll(/require\(['"`](.\/|..\/).+?['"`]\);?/)) {
      const [ match ] = matchResult
      const { index } = matchResult
      const [ , requirePath ] = match.split(/['"`]/)
      const requireFullPath = require.resolve(join(cwd, requirePath))
      const requireNewName = files[requireFullPath]?.newName
      if (!requireNewName) {
        throw new Error(`File doesn't exist: ${ requireFullPath }`)
      }
      file.file = file.file.substring(0, index) +
        `(await z.pkg.require('${ requireNewName }', '${ version }'))${ match.endsWith(';') ? ';' : '' }` +
        file.file.substring(index as number + match.length)
    }
    const tempFile = join(tempDir, path.replace(dir, ''))
    const tempFileDir = tempFile.replace(basename(tempFile), '')
    if (!existsSync(tempFileDir)) {
      await mkdir(tempFileDir)
    }
    await writeFile(tempFile, file.file, 'utf8')
    console.log(`Uploading ${ path } as ${ file.newName }`)
    await z.pkg.uploadPackage(name, version, tempFile)
  }
  await remove(tempDir)
  console.log(`Uploaded ${ name }@${ version }`)
}
