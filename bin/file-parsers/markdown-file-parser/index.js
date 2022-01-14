const fs = require('fs').promises;
const { cwd } = require('process');
const path = require('path');
const chalk = require('chalk-next');
const files = require('../../utils/files');

module.exports = class MarkdownFileParser {
    constructor({ options, menu, gitInfo, markdownRenderer, pageComponent }) {
        this.root = options.dst;
        this.menu = menu;
        this.gitInfo = gitInfo;
        this.renderer = markdownRenderer;
        this.component = pageComponent;
    }

    async parse(file) {
        if (!file.endsWith('.md') && !path.basename(file).startsWith('_'))
            return;

        const htmlFile = `${file.slice(0, -3)}.html`;
        console.info(chalk.green(`\t* creating ${path.relative(this.root, htmlFile)}`));

        const html = await this.#render(file);

        await fs.writeFile(htmlFile, html);

        console.info(chalk.green(`\t* deleting ${path.relative(this.root, file)}`));
        await fs.unlink(file);
    }

    async #render(file) {
        let markdown = await files.readFileAsString(file);
        markdown = `[[toc]]\n${markdown}`;

        const response = getTitle(markdown, file);

        const html = await this.renderer.render(response.markdown);
        const menuItems = await this.menu.items();
        
        let relativeRoot = path.relative(cwd(), this.root);
        if (relativeRoot !== '')
            relativeRoot += '/';

        return this.component.render({
            root: relativeRoot,
            sourceFile: path.relative(this.root, file),
            content: html,
            title: response.title,
            menu: menuItems,
            git: this.gitInfo,
        });
    }
}

getTitle = function (markdown, file) {
    const response = getTitleFromMarkdown(markdown);
    if (response != undefined)
        return response;
    
    const title = getTitleFromFile(file);
    return {
        title: formatTitle(title),
        markdown
    };
}

getTitleFromMarkdown = function (markdown) {
    const lines = markdown.split('\n');
    if (lines.length == 0) {
        lines.push(markdown);
    }

    for (const [ index, line ] of lines.entries()) {
        if (!line.trim().startsWith('# '))
            continue;

        return {
            title: line.trim().substring(2).trim(),
            markdown: lines.filter((_, i) => i != index).join('\n').trim()
        }
    }

    return null;
}

getTitleFromFile = function (file) {
    if (file.endsWith('index.md')) {
        return path.basename(path.dirname(file));
    }
    else {
        return path.basename(file);
    }
}

formatTitle = function(title) {
    if(title === "dist")
        title = "home";

    if(title.indexOf(".") > -1)
        title = title.substring(0, title.indexOf("."))

    return title.charAt(0).toUpperCase() + title.slice(1)
        .replace("-", " ");
}