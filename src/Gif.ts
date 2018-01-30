import { EventEmitter } from 'events';

function dvSlice(dv, start, end): Uint8Array {
    const arr = new Uint8Array(end - 1);
    for (let i = start; i < end; i++) {
        arr[i] = dv.getUint8(i);
    }
    return arr;
}

function arrEqual (arr1: Uint8Array, arr2: Uint8Array) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const l = arr1.length;
    return arr1.every((v, i) => v === arr2[i]);
}

function getGifSize (num: Uint8Array) {
    const width = num.slice(0, 2).reverse().reduce((a, b) => a + b, 0);
    const height = num.slice(2, 4).reverse().reduce((a, b) => a + b, 0);
    return {
        width, height
    }
}

const GIF_HEADER = new Uint8Array([0x47, 0x49, 0x46]);

export default class Gifer extends EventEmitter {
    private fReader = new FileReader();
    private data: DataView;
    public meta = {
        header: null,
        logicalScreenDescriptor: null,
        size: null,
        hasGlobalColorTable: null,
        colorRes: null
    }
    private slice;
    constructor (gif: File) {
        super();
        this.fReader.readAsArrayBuffer(gif as File);
        this.fReader.addEventListener('loadend', (e) => {
            this.data = new DataView(this.fReader.result);
            this.fReader = null;
            this.process();
        });
    }

    private process () {
        this.slice = dvSlice.bind(this, this.data);
        this.meta.header = this.slice(0, 6);

        const headerSliced: Uint8Array = this.meta.header.slice(0, 3); 
        if (!arrEqual(headerSliced, GIF_HEADER)) {
            throw new Error('This is not a gif file.');
        }
    }

    private setMeta () {
        this.meta.header = this.slice(0, 6);
        this.meta.logicalScreenDescriptor = this.slice(6, 13);
        this.meta.size = getGifSize(this.meta.logicalScreenDescriptor.slice(0, 4));
        
        const compressedBit = this.meta.logicalScreenDescriptor.slice(4, 5);
        this.meta.hasGlobalColorTable = !!(compressedBit & 0x80);
        if (this.meta.hasGlobalColorTable) {
            this.meta.colorRes = compressedBit & 0x70;
        }
    }
}