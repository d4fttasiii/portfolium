const fs = require('fs');
const path = require('path');


async function main() {
    const files = fs.readdirSync('build/contracts');
    if (!fs.existsSync('abis')) {
        fs.mkdirSync('abis');
    }
    files.filter(f => !f.startsWith('I')).forEach(filename => {
        const raw = fs.readFileSync(`build/contracts/${filename}`);
        const data = JSON.parse(raw);
        const abi = data.abi;
        const woExt = filename.replace(path.extname(filename), '');
        const content = 
`import { AbiItem } from 'web3-utils';

export const ${woExt.toUpperCase()}: AbiItem[] = ${JSON.stringify(abi)};
`
        fs.writeFileSync(`abis/${woExt.toLocaleLowerCase()}.ts`, content);
    })
}

main().then(() => console.log('Generator started'));