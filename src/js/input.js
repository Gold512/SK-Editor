export const input = {
    /**
     * Ask for file
     * @param {String|String[]} ext comma-separated list or array of unique file type specifiers
     * @return {Promise} resolves with array of selected files or rejects if no files are selected
     */
    file(multiselect, ext) {
        if(ext && typeof Object.prototype.toString.call(ext) == '[object Array]') ext = ext.join(',');
        let e = document.createElement('input');
        e.setAttribute('type', 'file');

        if(multiselect) 
        if(ext) e.setAttribute('accept', ext);

        e.click();

        return new Promise(function(resolve, reject) {
            e.addEventListener('input', ev => {
                if(e.files) {
                    resolve(e.files);
                    return;
                }

                reject('no file selected');
            })
        })
    }
}