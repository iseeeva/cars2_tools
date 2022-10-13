let fs = require("fs"),
    path = require("path"),
    xml_convert = require('xml-js');

if (process.argv[2] === "--help" || process.argv[2] === undefined) {
    console.log(`\nCars 2 PS3 Model Converter v1.4\nby iseeeva \n\ncars2_buffer.exe blabla.xml`);
    process.exit()
}

////

let scan_pos = [0,0,0];
function readHex(file_name, pos_id, numBytesToRead, add_pos) {
    const buf = Buffer.alloc(numBytesToRead, 0);
    let fd;
    
	if(scan_pos[pos_id] === undefined){scan_pos[pos_id]=0;}
	
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

function float_to_hex(float){
const getHex = i => ('00' + i.toString(16)).slice(-2);
var view = new DataView(new ArrayBuffer(4)),result;
view.setFloat32(0, float);
result = Array.apply(null, { length: 4 }).map((_, i) => getHex(view.getUint8(i))).join('');	
return endian(result); 
}

function float16_to_float(h) {
    var s = (h & 0x8000) >> 15;
    var e = (h & 0x7C00) >> 10;
    var f = h & 0x03FF;

    if(e == 0) {
        return (s?-1:1) * Math.pow(2,-14) * (f/Math.pow(2, 10));
    } else if (e == 0x1F) {
        return f?NaN:((s?-1:1)*Infinity);
    }

    return (s?-1:1) * Math.pow(2, e-15) * (1+(f/Math.pow(2, 10)));
}

////////////////////////////////////
	
const oct = xml_convert.xml2js(fs.readFileSync(path.resolve(process.cwd(), process.argv[2])), {compact: true});

let vbuf0_fname = oct["root_node"]["VertexBufferPool"]["VertexBuffer"][0]["FileName"]["_text"],
    vbuf1_fname = oct["root_node"]["VertexBufferPool"]["VertexBuffer"][1]["FileName"]["_text"],
    ibuf0_fname = oct["root_node"]["IndexBufferPool"]["IndexBuffer"][0]["FileName"]["_text"];

let ibuf_build_name = `${ibuf0_fname.substr(0, ibuf0_fname.lastIndexOf('.'))}.pc_ibuf`,
    vbuf_build_name = `${vbuf0_fname.substr(0, vbuf0_fname.lastIndexOf('.'))}.pc_vbuf`;
	
let vbuf_array = [];

for(var i in oct["root_node"]["VertexStreamPool"]["VertexStream"]){
    vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["Length"]["_text"]));
    vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["VertexBufferOffset"]["_text"]));
}

fs.writeFileSync(vbuf_build_name, "");
fs.writeFileSync(ibuf_build_name, "");

for(var i = 0; i < vbuf_array.length; i+=4){
	
	let vertex = [vbuf_array[i]   , vbuf_array[i+1]],
		uv     = [vbuf_array[i+2] , vbuf_array[i+3]];
		
	// console.log(vertex,uv)
	let total_scan = 0;
	scan_pos[0] = uv[1];
	scan_pos[1] = vertex[1];
	
	;(async()=>{
    while (total_scan < vertex[0]) {
		let scanned_float = Buffer.alloc(12);
		scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 0, 4);
		scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 4, 8);
		scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 8, 12);
		
		fs.appendFileSync(vbuf_build_name, float_to_hex(float16_to_float(parseInt(readHex(vbuf0_fname, 0, 2, true).toString("hex"), 16)))); //uv's
		fs.appendFileSync(vbuf_build_name, float_to_hex(float16_to_float(parseInt(readHex(vbuf0_fname, 0, 2, true).toString("hex"), 16)))); //uv's
		fs.appendFileSync(vbuf_build_name, Buffer.from("00000000","hex"));//start
		fs.appendFileSync(vbuf_build_name, scanned_float);
		fs.appendFileSync(vbuf_build_name, Buffer.from("FF000000","hex"));//end
		scan_pos[1]+=20;
		total_scan++;
    }})()
	
	console.log(`
	\rMODEL ${i/4}: 
	Length: ${vertex[0]}
	VertexBufferOffset: ${fs.readFileSync(vbuf_build_name).length - (((scan_pos[1] - vertex[1]) / 32)*28)}
	\r[vertex: %${(vertex[0] / ((scan_pos[1] - vertex[1]) / 32)) * 100} uv: %${(uv[0] / ((scan_pos[0] - uv[1]) / 4)) * 100}]`)
	
}

while (scan_pos[2] < fs.readFileSync(ibuf0_fname).length) {
	fs.appendFileSync(ibuf_build_name, endian(readHex(ibuf0_fname, 2, 2, true).toString("hex")));
}

console.log(`\n${vbuf_build_name}/${ibuf_build_name} finished`)