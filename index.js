const sessionname = ('session.data')
const { default: LordHyuuraConnect, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@adiwajshing/baileys")
const { state, saveState } = useSingleFileAuthState(`./${sessionname}.json`)
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const PhoneNumber = require('awesome-phonenumber')
const moment = require('moment-timezone')


global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

// save database every 30seconds
if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)

async function startLordHyuura() {
    const LordHyuura = LordHyuuraConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['By Al?Offc','Safari','1.0.0'],
        auth: state
    })
    //Setting\\
    LordHyuura.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    LordHyuura.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update	    
        if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); LordHyuura.logout(); }
            else if (reason === DisconnectReason.connectionClosed) { console.log("🦄Connection closed, reconnecting...."); startLordHyuura(); }
            else if (reason === DisconnectReason.connectionLost) { console.log("🦄Connection Lost from Server, reconnecting..."); startLordHyuura(); }
            else if (reason === DisconnectReason.connectionReplaced) { console.log("🦄Connection Replaced, Another New Session Opened, Please Close Current Session First"); LordHyuura.logout(); }
            else if (reason === DisconnectReason.loggedOut) { console.log(`🦄Device Logged Out, Please Scan Again And Run.`); LordHyuura.logout(); }
            else if (reason === DisconnectReason.restartRequired) { console.log("🦄Restart Required, Restarting..."); startLordHyuura(); }
            else if (reason === DisconnectReason.timedOut) { console.log("🦄Connection TimedOut, Reconnecting..."); startLordHyuura(); }
            else LordHyuura.end(`🦄Unknown DisconnectReason: ${reason}|${connection}`)
        }
        console.log('Connected...', update)
    })

    LordHyuura.ev.on('creds.update', saveState)

    return LordHyuura
}

startLordHyuura()


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
} )