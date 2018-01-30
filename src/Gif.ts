import { EventEmitter } from 'events';

function dvSlice(dv: DataView, start, end): Uint8Array {
    const arr = new Uint8Array(end - start);
    let arrIndex = 0;
    for (let i = start; i < end; i++) {
        arr[arrIndex++] = dv.getUint8(i);
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
const gifBinIndex = {
    header: [0, 6],
    logicalScreenDescriptor: [6, 13],
    colorTable: [13]
}

export default class Gifer extends EventEmitter {
    private file: File;
    private fReader = new FileReader();
    private data: DataView;
    public meta = {
        header: null,
        logicalScreenDescriptor: null,
        size: null,
        hasGlobalColorTable: null,
        colorRes: null,
        sort: null,
        globalColorTableSize: null,
        backgroundColorIndex: null,
        pixelAspectRatio: null,
        colorTable: [],
        graphicsControlExtension: null,
        gceSize: null,
        gcePacked: null,
        gceDelayTime: null,
        gceTransparentColorIndex: null
    }
    private slice;
    constructor (gif: File) {
        super();
        this.file = gif;
        this.fReader.readAsArrayBuffer(gif as File);
        this.fReader.addEventListener('loadend', (e) => {
            this.data = new DataView(this.fReader.result);
            this.fReader = null;
            this.process();
        });
    }

    private process () {
        this.slice = dvSlice.bind(this, this.data);
        
        this.setMeta();

        const headerSliced: Uint8Array = this.meta.header.slice(0, 3); 
        if (!arrEqual(headerSliced, GIF_HEADER)) {
            throw new Error('This is not a gif file.');
        }
    }

    private setMeta () {
        this.meta.header = this.slice(gifBinIndex.header[0], gifBinIndex.header[1]);
        this.meta.logicalScreenDescriptor = this.slice(
            gifBinIndex.logicalScreenDescriptor[0], 
            gifBinIndex.logicalScreenDescriptor[1]
        );
        this.meta.size = getGifSize(this.meta.logicalScreenDescriptor.slice(0, 4));
        
        const compressedBit = this.meta.logicalScreenDescriptor.slice(4, 5);
        this.meta.hasGlobalColorTable = !!(compressedBit >>> 7 & 0x1);
        if (this.meta.hasGlobalColorTable) {
            this.meta.colorRes = compressedBit >>> 4 & 0x7;
        }
        this.meta.sort = (compressedBit >>> 3 & 0x1) ? 'dec' : 'asc';
        this.meta.globalColorTableSize = 2 ** ((compressedBit & 0x7) + 1);

        this.meta.backgroundColorIndex = this.meta.logicalScreenDescriptor.slice(5, 6);
        this.meta.pixelAspectRatio = this.meta.logicalScreenDescriptor.slice(6);

        const colorTableEnd =  gifBinIndex.colorTable[0] + this.meta.globalColorTableSize * 3;
        const allColor = this.slice(gifBinIndex.colorTable[0], colorTableEnd);
        for (let i = 0; i < allColor.length; i += 3) {
            this.meta.colorTable.push([
                allColor[i],
                allColor[i + 1],
                allColor[i + 2]
            ]);
        }

        this.meta.graphicsControlExtension = this.slice(colorTableEnd, colorTableEnd + 8 + 1);
        this.meta.gceSize = this.meta.graphicsControlExtension.slice(2, 3);
        this.meta.gcePacked = this.meta.graphicsControlExtension.slice(3, 4);
        this.meta.gceDelayTime = this.meta.graphicsControlExtension.slice(4, 6);
        this.meta.gceTransparentColorIndex = this.meta.graphicsControlExtension.slice(6, 7);
    }
}