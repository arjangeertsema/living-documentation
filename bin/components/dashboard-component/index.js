const pug = require('pug');
const files = require('../../utils/files');

module.exports = class FeatureComponent {
    constructor(options) {
        this.renderFn = pug.compile(options?.template ?? files.readFileAsStringSync(`${__dirname}/template.pug`));
    }
    
    render(data) {
        return this.renderFn(data);
    }
}