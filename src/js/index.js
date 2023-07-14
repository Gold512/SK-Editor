import { JSONEditor } from "vanilla-jsoneditor";
import { input } from './input.js';

const origIV = [0x41, 0x68, 0x62, 0x6f, 0x6f, 0x6c, 0x0, 0x0];

function decrypt(origCipher, origKey) {
	let key = CryptoJS.lib.WordArray.create(new Uint8Array(origKey));
	var iv = CryptoJS.lib.WordArray.create(new Uint8Array(origIV));

	let plain = CryptoJS.DES.decrypt(origCipher, key, { iv: iv });
	return plain.toString(CryptoJS.enc.Utf8);
}

function encrypt(origCipher, origKey) {
	let key = CryptoJS.lib.WordArray.create(new Uint8Array(origKey));
	var iv = CryptoJS.lib.WordArray.create(new Uint8Array(origIV));

	let cipher = CryptoJS.enc.Utf8.parse(origCipher);
	var encrypted = CryptoJS.DES.encrypt(cipher, key, {
		iv: iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	});
	return encrypted.toString();
}

function escapeJSONStr(s) {
    return s.replaceAll('\x01', '\\u0001')
}

function unescapeJSONStr(s) {
    return s.replaceAll('\\u0001','\x01');
    
}

let statistic = [0x63, 0x72, 0x73, 0x74, 0x31, 0x0, 0x0, 0x0]; // crst1
let otherKey = [0x69, 0x61, 0x6d, 0x62, 0x6f, 0x0, 0x0, 0x0]; // iambo

let content = undefined

let key;
let openedFileName;

const editor = new JSONEditor({
	target: document.getElementById("jsoneditor"),
	props: {
		content,
		onChange: (
			updatedContent,
			previousContent,
			{ contentErrors, patchResult }
		) => {
			// content is an object { json: JSONValue } | { text: string }
			console.log("onChange", {
				updatedContent,
				previousContent,
				contentErrors,
				patchResult,
			});
			content = updatedContent;
		},
        onRenderMenu: (mode, items) => {
            console.log(items)
            items.pop();
            return [...items,
                {
                    separator: true
                },
                {
                    onClick: async () => {
                        let files = await input.file(false);
                        const file = files[0];
                        console.log(file)
                        let text = await (new Blob([file])).text();
                        openedFileName = file.name;

                        if(file.name.includes('statistic')) {
                            key = statistic;
                        } else if(file.name.includes('battles')) {
                            editor.set({
                                text: undefined,
                                json: JSON.parse(text)
                            });
                            return;
                        } else {
                            key = otherKey;
                        }
                        
                        let s = decrypt(text, key);
                        s = escapeJSONStr(s);
                        s = JSON.parse(s);
                        editor.set({
                            text: undefined,
                            json: s
                        })
                    },
                    icon: {
                        iconName: 'jsoneditor-import',
                        prefix: 'fas',
                        icon: [512, 512, [], null, 'M402.05,7.498l-95.175,0.004c-0.073-0.004-0.146-0.004-0.22-0.004H116.767c-10.028,0-18.188,8.158-18.188,18.188V78.25   H17.543C7.855,78.25,0,86.105,0,95.793v299.404c0,9.688,7.854,17.543,17.543,17.543h299.402c9.688,0,17.543-7.855,17.543-17.543   V204.015h67.562c10.029,0,18.188-8.16,18.188-18.188V25.685C420.238,15.656,412.079,7.498,402.05,7.498z M35.086,377.654V113.336   H98.58v72.492c0,10.027,8.159,18.188,18.188,18.188h73.979v20.191l-45.196,33.266l-15.817-21.487   c-1.589-2.158-4.207-3.306-6.87-3.009s-4.966,1.992-6.04,4.445l-38.639,88.268c-0.423,0.966-0.63,1.988-0.63,3.009   c0,1.573,0.495,3.137,1.46,4.446c1.588,2.156,4.207,3.304,6.87,3.009l95.764-10.66c2.663-0.297,4.966-1.99,6.04-4.445   c1.073-2.456,0.758-5.297-0.83-7.452l-15.816-21.49l59.651-43.908c1.92-1.414,3.054-3.656,3.054-6.041v-38.139h65.655v173.639   H35.086V377.654z']
                    },
                    title: 'Import file',
                    className: 'jse-button'
                },
                {
                    onClick: () => {
                        let json = unescapeJSONStr(JSON.stringify(editor.get().json));
                        let key;
                        if(openedFileName.includes('statistic')) {
                            key = statistic;
                        } else if(openedFileName.includes('battles')) {
                            download(openedFileName, json)
                            return;
                        } else {
                            key = otherKey;
                        }

                        download(openedFileName, encrypt(json, key));
                    },
                    title: 'Download file',
                    icon: {
                        iconName: 'jsoneditor-download',
                        prefix: 'fas',
                        icon: [24, 24, [], null, 'M4,20H20a1,1,0,0,1,0,2H4a1,1,0,0,1,0-2ZM12,2a1,1,0,0,0-1,1V14.586L8.707,12.293a1,1,0,1,0-1.414,1.414l4,4a1,1,0,0,0,.325.216.986.986,0,0,0,.764,0,1,1,0,0,0,.325-.216l4-4a1,1,0,0,0-1.414-1.414L13,14.586V3A1,1,0,0,0,12,2Z']
                        
                    }
                },
                {
                    space: true
                }
            ]
        }
	},
});

window.editor = editor;

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}