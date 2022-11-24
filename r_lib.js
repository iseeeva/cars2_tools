let fs = require("fs");

let scan_pos = [0, 0, 0];

function readHex(file_name, pos_id, numBytesToRead, add_pos) {
    const buf = Buffer.alloc(numBytesToRead, 0);
    let fd;

    if (scan_pos[pos_id] === undefined) {
        scan_pos[pos_id] = 0;
    }

    try {
        fd = fs.openSync(file_name, "r");
        fs.readSync(fd, buf, 0, numBytesToRead, scan_pos[pos_id]);
    } finally {
        if (fd) {
            fs.closeSync(fd);
        }
    }
    if (add_pos === true) {
        scan_pos[pos_id] += numBytesToRead;
    }
    return buf;
}

function endian(d) {
    d = d.length % 2 ? '0' + d : d;
    d = d.match(/.{1,2}/g).reverse().join('');
    d = Buffer.from(d, "hex");
    x = Buffer.alloc(d.length);
    x.fill(d, 0, d.length);
    return x;
}

function float_to_hex(float) {
    const getHex = i => ('00' + i.toString(16)).slice(-2);
    var view = new DataView(new ArrayBuffer(4)),
        result;
    view.setFloat32(0, float);
    result = Array.apply(null, {
        length: 4
    }).map((_, i) => getHex(view.getUint8(i))).join('');
    return endian(result);
}

function int_to_hex16(int) {
    const getHex = i => ('00' + i.toString(16)).slice(-2);
    var view = new DataView(new ArrayBuffer(2)),
        result;
    view.setInt16(0, int);
    result = Array.apply(null, {
        length: 2
    }).map((_, i) => getHex(view.getUint8(i))).join('');
    return endian(result);
}

function float16_to_float(h) {
    var s = (h & 0x8000) >> 15;
    var e = (h & 0x7C00) >> 10;
    var f = h & 0x03FF;

    if (e == 0) {
        return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    } else if (e == 0x1F) {
        return f ? NaN : ((s ? -1 : 1) * Infinity);
    }

    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
}

module.exports = {
	scan_pos,
	readHex,
	endian,
	float_to_hex,
	float16_to_float,
	int_to_hex16
}
