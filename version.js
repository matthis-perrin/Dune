const { readFile, writeFile } = require('fs/promises')
const {join} = require('path')

async function run() {
    // PACKAGE.JSON
    const packageJsonPath = join('./client-main/package.json')
    const packageJsonContent = (await readFile(packageJsonPath)).toString();
    const packageJsonVersionMatch = packageJsonContent.match(/"version": "([0-9\.]+)"/);
    if (packageJsonVersionMatch === null || typeof packageJsonVersionMatch[1] !== 'string') {
        throw new Error(`Could not find version in ${packageJsonPath}`)
    }
    const packageJsonVersion = packageJsonVersionMatch[1];
    const newPackageJsonVersionFrag = packageJsonVersion.split('.');
    const newPackageJsonVersion = [...newPackageJsonVersionFrag.slice(0, -1), parseFloat(newPackageJsonVersionFrag.at(-1)) + 1].join('.')
    const newPackageJsonContent = packageJsonContent.replace(`"version": "${packageJsonVersion}"`, `"version": "${newPackageJsonVersion}"`);
    
    // INDEX.HBS
    const indexHbsPath = join('./client-renderer/src/index.hbs')
    const indexHbsContent = (await readFile(indexHbsPath)).toString();
    const indexHbsVersionMatch = indexHbsContent.match(/<title>Hérisson ([0-9\.]+)<\/title>/);
    if (indexHbsVersionMatch === null || typeof indexHbsVersionMatch[1] !== 'string') {
        throw new Error(`Could not find version in ${indexHbsPath}`)
    }
    const indexHbsVersion = indexHbsVersionMatch[1];
    const newIndexHbsVersionFrag = indexHbsVersion.split('.');
    const newIndexHbsVersion = [...newIndexHbsVersionFrag.slice(0, -1), parseFloat(newIndexHbsVersionFrag.at(-1)) + 1].join('.')
    const newIndexHbsContent = indexHbsContent.replace(`<title>Hérisson ${indexHbsVersion}</title>`, `<title>Hérisson ${newIndexHbsVersion}</title>`);

    if (packageJsonVersion !== indexHbsVersion) {
        throw new Error(`Different version in ${packageJsonPath} (${packageJsonVersion}) and ${indexHbsPath} (${indexHbsVersion})`)
    }

    await writeFile(packageJsonPath, newPackageJsonContent)
    await writeFile(indexHbsPath, newIndexHbsContent)
}

run().catch(console.error);
