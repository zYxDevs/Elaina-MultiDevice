import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import { createInterface } from 'readline'
import cfonts from 'cfonts'
import yargs from 'yargs'
import './config.js'
import checkUpdate from './lib/system.js'


const __dirname = dirname(fileURLToPath(import.meta.url))
const { say } = cfonts
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
})

/**
 * Fungsi update
 */
async function runUpdater() {
    if (!global.config?.cekupdate) return
    
    console.log('Checking for updates...')
    try {
        await checkUpdate()
    } catch (e) {
        console.error(`[UPDATE ERROR] ${e.message}`)
    }
}

/**
 * UI
 */
function displayHeader() {
    say(global.config.namebot || 'BOT', {
        font: 'pallet',
        align: 'center',
        colors: ['white']
    })
    say(`⧻ ${global.config.namebot} by ${global.config.author}`, { 
        font: 'console',
        align: 'center',
        colors: ['cyan']
    })
}

let isRunning = false

/**
 * Fungsi Utama Bot
 */
async function start(file) {
    if (isRunning) return
    isRunning = true

    const args = [join(__dirname, file), ...process.argv.slice(2)]
    
    say('⸙ INITIALIZING SOURCE...', { font: 'console', align: 'center', colors: ['magenta'] })

    setupMaster({
        exec: args[0],
        args: args.slice(1),
    })

    const p = fork()

    // Event Handling
    p.on('message', data => {
        console.log(`[SYSTEM] Received: ${data}`)
        switch (data) {
            case 'reset':
                p.kill()
                isRunning = false
                start(file)
                break
            case 'uptime':
                p.send(process.uptime())
                break
        }
    })

    p.on('exit', (code) => {
        isRunning = false
        console.error(`[!] Process exited with code: ${code}`)

        if (code === 0) return 
        watchFile(args[0], () => {
            unwatchFile(args[0])
            start(file)
        })
    })

    const opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
    if (!opts.test && rl.listenerCount('line') === 0) {
        rl.on('line', line => {
            p.emit('message', line.trim())
        })
    }
}


displayHeader()
runUpdater().then(() => start('main.js'))
