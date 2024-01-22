import {generateKeyPairSync} from 'crypto'
import fs from 'fs'
import {fileURLToPath} from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


function generateKeypair(type){
    const {privateKey, publicKey} = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem"
        }
    })
    fs.writeFileSync(__dirname + `/${type}_public_key.pem`, publicKey)
    fs.writeFileSync(__dirname + `/${type}_private_key.pem`, privateKey)
    
}
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
// const pathToPublicKey = join(__dirname, "../utils", "accessToken_public_key.pem")
// const public_key = fs.readFileSync(pathToPublicKey, "utf8")

function getKey(obj={keyType:"", tokenType:""}){
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const {keyType, tokenType} = obj
    if (keyType === "" && tokenType === ""){
        throw new Error('KeyType or tokenType is missing')
    }
    
    const path = join(__dirname, `./${tokenType}_${keyType}.pem`)
    const key = fs.readFileSync(path, 'utf8')
    return key
    
}
export  {generateKeypair, getKey}