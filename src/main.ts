import * as core from '@actions/core'
import * as fs from 'fs/promises'
import * as path from 'path'

async function getAllFilenames(
  dirPath: string,
  fileArr: string[]
): Promise<string[]> {
  const files = await fs.readdir(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = await fs.stat(filePath)
    if (stats.isDirectory() && !filePath.endsWith('node_modules')) {
      await getAllFilenames(filePath, fileArr)
    } else {
      fileArr.push(filePath)
    }
  }
  return fileArr
}

function countByExtension(filenames: string[]): {[key: string]: number} {
  return filenames.reduce((counts: {[x: string]: number}, filename: string) => {
    const extension = path.extname(filename)
    return {...counts, [extension]: (counts[extension] || 0) + 1}
  }, {})
}

function sumValues(
  counts: {[key: string]: number},
  extensions: string[]
): number {
  let sum = 0
  for (const extension of extensions) {
    if (counts[extension]) {
      sum += counts[extension]
    }
  }
  return sum
}

async function run(): Promise<void> {
  try {
    const arrayOfFiles: string[] = []
    await getAllFilenames(process.env.GITHUB_WORKSPACE || '/', arrayOfFiles)
    const counts = countByExtension(arrayOfFiles)
    core.setOutput('files-by-extension', counts)
    const tsCount = sumValues(counts, ['.ts', '.tsx'])
    const jsCount = sumValues(counts, ['.js', '.jsx'])
    const total = tsCount + jsCount
    core.setOutput('ts-percent', Math.floor((tsCount / total) * 100))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
