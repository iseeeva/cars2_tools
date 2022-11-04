let fs = require("fs"),
    path = require("path"),
    xml_convert = require('xml-js'),
	{scan_pos,readHex,endian,float_to_hex,float16_to_float} = require("./r_lib.js");

if (process.argv[2] === "--help" || process.argv[2] === undefined) {
    console.log(`\nCars 2 PS3 Model Converter v1.6\nby iseeeva \n\ncars2_buffer.exe blabla.xml [no_bone]`);
    process.exit()
}

////////////////////////////////////

const oct = xml_convert.xml2js(fs.readFileSync(path.resolve(process.cwd(), process.argv[2])), {
    compact: true
});

let vbuf0_fname = oct["root_node"]["VertexBufferPool"]["VertexBuffer"][0]["FileName"]["_text"],
    vbuf1_fname = oct["root_node"]["VertexBufferPool"]["VertexBuffer"][1]["FileName"]["_text"],
    ibuf0_fname = oct["root_node"]["IndexBufferPool"]["IndexBuffer"][0]["FileName"]["_text"];

let ibuf_build_name = `${ibuf0_fname.substr(0, ibuf0_fname.lastIndexOf('.'))}.pc_ibuf`,
    vbuf_build_name = `${vbuf0_fname.substr(0, vbuf0_fname.lastIndexOf('.'))}.pc_vbuf`;

let vbuf_array = [];

for (var i in oct["root_node"]["VertexStreamPool"]["VertexStream"]) {
    vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["Length"]["_text"]));
    vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["VertexBufferOffset"]["_text"]));
}

fs.writeFileSync(vbuf_build_name, "");
fs.writeFileSync(ibuf_build_name, "");

for (var i = 0; i < vbuf_array.length; i += 4) {

    let vertex = [vbuf_array[i], vbuf_array[i + 1]],
        uv = [vbuf_array[i + 2], vbuf_array[i + 3]];

    // console.log(vertex,uv)
    let total_scan = 0;
    scan_pos[0] = uv[1];
    scan_pos[1] = vertex[1];

    ;(async () => {
        while (total_scan < vertex[0]) {
            let scanned_float = Buffer.alloc(12);
            scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 0, 4);  //vertex x
            scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 4, 8);  //vertex y
            scanned_float.fill(endian(readHex(vbuf1_fname, 1, 4, true).toString("hex")), 8, 12); //vertex z

            fs.appendFileSync(vbuf_build_name, float_to_hex(float16_to_float(parseInt(readHex(vbuf0_fname, 0, 2, true).toString("hex"), 16)))); //uv u
            fs.appendFileSync(vbuf_build_name, float_to_hex(float16_to_float(parseInt(readHex(vbuf0_fname, 0, 2, true).toString("hex"), 16)))); //uv v
			
			switch(process.argv[3]){
			case "no_bone":
		    fs.appendFileSync(vbuf_build_name, Buffer.from("00000000","hex")); //bone indices?
		    fs.appendFileSync(vbuf_build_name, scanned_float);
		    fs.appendFileSync(vbuf_build_name, Buffer.from("FF000000","hex")); //bone weight?
		    scan_pos[1]+=20;
			break;
			default:
			process.argv[3] = undefined;
            fs.appendFileSync(vbuf_build_name, readHex(vbuf1_fname, 1, 4, true)); //bone indices?
            fs.appendFileSync(vbuf_build_name, scanned_float);
            fs.appendFileSync(vbuf_build_name, readHex(vbuf1_fname, 1, 4, true)); //bone weight?
            scan_pos[1] += 12;
			}

            total_scan++;
        }
    })()

    for (var model_name in oct["root_node"]["SceneTreeNodePool"]["Node"]) {
        if (oct["root_node"]["SceneTreeNodePool"]["Node"][model_name]["VertexStreamReferences"] != undefined)
        if (i/2 === parseInt(oct["root_node"]["SceneTreeNodePool"]["Node"][model_name]["VertexStreamReferences"]["entry"][0]["_text"]))
        break;
    } model_name = oct["root_node"]["SceneTreeNodePool"]["Node"][model_name]["NodeName"]["_text"];

    console.log(`
	\rMODEL ${i/4}: ${model_name}
	 Length: ${vertex[0]}
	 VertexBufferOffset: ${fs.readFileSync(vbuf_build_name).length - (((scan_pos[1] - vertex[1]) / 32)*28)}
	\r[vertex: %${(vertex[0] / ((scan_pos[1] - vertex[1]) / 32)) * 100} uv: %${(uv[0] / ((scan_pos[0] - uv[1]) / 4)) * 100}]`)

}

while (scan_pos[2] < fs.readFileSync(ibuf0_fname).length) {
    fs.appendFileSync(ibuf_build_name, endian(readHex(ibuf0_fname, 2, 2, true).toString("hex")));
}

console.log(`\n${vbuf_build_name}/${ibuf_build_name} finished with ${process.argv[3] != undefined ? process.argv[3] : 'non argument'}`)