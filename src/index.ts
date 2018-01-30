import setBeforeUpload, { BeforeUpload } from './beforeUpload/src/index';
import Gif from './Gif';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const inputEl = $('#upload');

const uploadArea = setBeforeUpload(
    '.upload-area', 
    BeforeUpload.ENABLE_CLICK | BeforeUpload.ENABLE_DRAG | BeforeUpload.ENABLE_COPY_PASTE, 
    { inputEl }
);
const canvas: HTMLCanvasElement = $('main canvas');
const ctx = canvas.getContext('2d');
uploadArea.on('file', f => {
    f = f[0];
    const img = new Image();
    img.src = URL.createObjectURL(f);
    console.log(new Gif(f));
})