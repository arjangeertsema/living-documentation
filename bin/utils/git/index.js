const chalk = require('chalk-next');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.info = async function () {
    console.info();
    console.info(chalk.yellow(`downloading git information:`));
    const info = {};

    try {
        const branch = await __exec(`git rev-parse --abbrev-ref HEAD`);
        const repository = await parseGitRepository();
        const remote = await parseRemoteOrigin();

        const localBranches = (await __exec(`git branch -a`))
            .split(`\n`)
            .map(b => b.replace('*', '').trim());
        
        const branches = remote.branches.concat(localBranches.filter(b => !remote.branches.includes(b)))            
            .filter(b => !b.includes('remotes/'))
            .map(b => ({
                name: b,
                repository: repository,
                url: `https://github.com/${repository}/tree/${b}`,
                feature: b != remote.mainBranch,
            }))
            .sort((a, b) => `${a.feature ? 'z' : 'a'}${a.name}`.localeCompare(`${b.feature ? 'z' : 'a'}${b.name}`));

        info.branch = branches.find(b => b.name === branch);
        info.branches = branches;
    }
    catch (ex) {
        if (!ex?.message?.includes('fatal: not a git repository')) {     
            throw ex;
        }

        console.warn(chalk.yellowBright(`\t* directory is not a git repository, falling back to default.`));
        
        const branch = {
            name: 'main',
            repository: 'undefined',
            url: `https://github.com/undefined/undefined/tree/main`,
            feature: false
        };

        info.branch = branch;
        info.branches = [branch];
    }

    console.info(chalk.green(`\t* repository: ${info.branch.repository}`));
    console.info(chalk.green(`\t* ${info.branch.feature ? 'feature ' : ''}branch: ${info.branch.name}`));

    return info;
}

async function __exec(command) {
    const { stdout, stderr } = await exec(command, { timeout: 5000 });

    if (stderr.trim() != '')
        throw stderr.trim();

    return stdout.trim();
}

async function parseGitRepository() {
    const originUrl = await __exec(`git config --get remote.origin.url`);
    const parts = originUrl.trim().split('/');
    let repository = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    if (repository.endsWith('.git'))
        repository = repository.substring(0, repository.length - 4);

    const index = repository.indexOf(':');
    if (index > -1)
        repository = repository.substring(index + 1);

    return repository;
}

async function parseRemoteOrigin() {
    const name = await __exec(`git remote`);
    const lines = parseGitReponse((await __exec(`git remote show ${name}`)));

    const response = {
        mainBranch: lines
            .filter(l => l.key == 'HEAD branch')
            .map(l => l.value)
        [0],
        branches: lines
            .filter(l => l.key.startsWith('Remote branch'))
            .map(l => l.value.map(l => l.substr(0, l.indexOf(' '))))
        [0]
    };

    return response;
}

function parseGitReponse(response) {
    const lines = response.split(`\n`);
    const parsed = [];

    lines.forEach(line => {
        const index = line.indexOf(':');
        if (index == -1) {
            if (parsed.length === 0)
                return;

            const last = parsed[parsed.length - 1];
            if (last.value == '') {
                last.value = [];
            }

            last.value.push(line.trim());
            return;
        }

        const key = line.substr(0, index).trim();
        const value = line.substr(index + 1).trim();

        parsed.push({ key, value });
    });

    return parsed;

}