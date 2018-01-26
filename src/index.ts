import setBeforeUpload, { BeforeUpload } from './beforeUpload/src/index';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const inputEl = $('#upload');

const uploadArea = setBeforeUpload(
    '.upload-area', 
    BeforeUpload.ENABLE_CLICK | BeforeUpload.ENABLE_DRAG | BeforeUpload.ENABLE_COPY_PASTE, 
    { inputEl }
);