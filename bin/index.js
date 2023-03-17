#! /usr/bin/env node

import chalk from 'chalk'
import fs from 'fs-extra'
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).slice(0, -1)

const appPackage = `${__dirname}/../package.json`
const templatePath = `${__dirname}/src`.replace('/bin', '')


const convertToPascalCase = (s) => {
  const r = s.replace(
    /\w+/g,
    (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()
  )
  return r.split(' ').join('')
}

const readConfig = () => {
  const cfg = JSON.parse(fs.readFileSync(appPackage, 'utf8'))
  return [
    cfg.name,
    convertToPascalCase(cfg.name.replace('-', ' ')),
    cfg.version,
    cfg.author,
    cfg.files.src
  ]
}

const [appName, appBanner, appVersion, appAuthor, templateRep] = readConfig()

const showCopyright = () => {
  console.log(`\n💥 ${appName} v${appVersion} © ${appAuthor}`)
}

const error = (msg) => {
  console.log(chalk.red(`💀 ${msg}`))
  process.exit(1)
}

const success = (msg) => {
  console.log(chalk.greenBright(`🤙 ${msg}`))
}

const usage = () => {
  const msg =`USAGE: npx ${appName} <destination dir>`
   console.log(chalk.greenBright(`🤙 ${msg}`))
   process.exit(2)
}

const args = process.argv.slice(2)
if (args.length < 1) {
  usage()
} else {
  const currentDir = `./${ args[0].replace('./', '') }`
  try {
    fs.ensureDir(currentDir)
    fs.copySync(templatePath, currentDir, { overwrite: true })
    success(`Resources installed in ${currentDir}/resources`)
    showCopyright()
  } catch (err) {
    error(err.message)
  }
}

