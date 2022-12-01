let fs = require("fs"),
    path = require("path"),
	obj2js = require('obj-file-parser'),
	{scan_pos,readHex,endian,float_to_hex,float16_to_float,int_to_hex16} = require("./r_lib.js");

if (process.argv[2] === "--help" || process.argv[2] === undefined) {
    console.log(`\nCars 2 OBJ Model Converter v1.0\nby iseeeva \n\ncars2_buffer.exe blabla.obj`);
    process.exit()
}

////////////////////////////////////

let objFile = new obj2js(fs.readFileSync(process.argv[2],"utf8")); objFile = objFile.parse();

let ibuf_build_name = `${(process.argv[2]).substr(0, (process.argv[2]).lastIndexOf('.'))}.pc_ibuf`,
    vbuf_build_name = `${(process.argv[2]).substr(0, (process.argv[2]).lastIndexOf('.'))}.pc_vbuf`;
    // xml_build_name = `${(process.argv[2]).substr(0, (process.argv[2]).lastIndexOf('.'))}.pc_xml`; //xml

fs.writeFileSync(vbuf_build_name,"");fs.writeFileSync(ibuf_build_name,"");
let vbuf_stream = fs.createWriteStream(vbuf_build_name, {flags: "a",mode: 0744}),
    ibuf_stream = fs.createWriteStream(ibuf_build_name, {flags: "a",mode: 0744});
	
let model_name = [];
let vertex = [], vertex_normal = [], uv = [], index = [];
let calc_vsize = 0, calc_vsize_total = 0, calc_vsize_array = [],
    calc_nsize = 0, calc_nsize_total = 0, calc_nsize_array = [],
    calc_usize = 0, calc_usize_total = 0, calc_usize_array = [],
    calc_isize = 0, calc_isize_total = 0, calc_isize_array = [];

objFile['models'].forEach((models) => {
	
	model_name.push(models["name"]);
	;(async () => {
		models["vertices"].forEach((xyz) => {
			vertex.push(float_to_hex(xyz.x));
			vertex.push(float_to_hex(xyz.y));
			vertex.push(float_to_hex(xyz.z));
		    vertex.push(Buffer.from("00000000","hex")); //fake bone indices
		    vertex.push(Buffer.from("FF000000","hex")); //fake bone weight
			// console.log("ver:",xyz.x,xyz.y,xyz.z)
		})
		calc_vsize_array.push(models["vertices"].length * 20);
	})()

	;(async () => {
		models["vertexNormals"].forEach((xyz) => {
			vertex_normal.push(float_to_hex(xyz.x));
			vertex_normal.push(float_to_hex(xyz.y));
			vertex_normal.push(float_to_hex(xyz.z));
			vertex_normal.push(Buffer.from("00000000","hex"));
			// console.log("vn:",xyz.x,xyz.y,xyz.z)
		})
		calc_nsize_array.push(models["vertexNormals"].length * 16);
	})()
	
	;(async () => {
		models["textureCoords"].forEach((xyz) => {
			uv.push(float_to_hex(xyz.u));
			uv.push(float_to_hex(xyz.v));
			// console.log("uv:",uv.u,uv.v,uv.w)
		})
		calc_usize_array.push(models["textureCoords"].length * 8);
	})()
	
	;(async () => {
		models["faces"].forEach((faces) => {
			faces["vertices"].forEach((xyz) => {
				index.push(int_to_hex16(xyz.vertexIndex - 1));
			// console.log("faces:",xyz.vertexIndex,xyz.textureCoordsIndex,xyz.vertexNormalIndex)
			})
		})
		calc_isize_array.push(models["faces"].length * 6);
	})()

})

////////////////////////////////////

let total_vertex = vertex.length/5, total_vn = vertex_normal.length/4, total_uv = uv.length/2, total_index = index.length/3;

calc_vsize_array.forEach((calc) => {calc_vsize_total+=calc});
calc_nsize_array.forEach((calc) => {calc_nsize_total+=calc});
calc_usize_array.forEach((calc) => {calc_usize_total+=calc});
calc_isize_array.forEach((calc) => {calc_isize_total+=calc});
calc_usize=calc_vsize_total;
calc_nsize=calc_vsize_total+calc_usize_total;

for(var i=0; i < calc_vsize_array.length; i++){
	calc_vsize+=calc_vsize_array[i];
	calc_nsize+=calc_nsize_array[i];
	calc_usize+=calc_usize_array[i];
	calc_isize+=calc_isize_array[i];
	
	console.log(
	   `\r[MODEL] ${model_name[i]}
	    \r[VERTEX] ${calc_vsize-calc_vsize_array[i]} [VERTEX_F] ${calc_vsize_array[i]/20}
	    \r[VERTEX_NORMAL] ${calc_nsize-calc_nsize_array[i]} [VERTEX_F] ${calc_nsize_array[i]/16}
	    \r[UV] ${calc_usize-calc_usize_array[i]} [UV_F] ${calc_usize_array[i]/8}
	    \r[FACE] ${calc_isize-calc_isize_array[i]} [FACE_F] ${calc_isize_array[i]/6}
		`
	);
}

vertex.forEach(async(vertex) => {await vbuf_stream.write(vertex);})
uv.forEach(async(uv) => {await vbuf_stream.write(uv);})
vertex_normal.forEach(async(vertex) => {await vbuf_stream.write(vertex);})
index.forEach(async(index) => {await ibuf_stream.write(index);})
vbuf_stream.end();ibuf_stream.end();

console.log("[VERTEX]", total_vertex, "[VERTEX_NORMAL]", calc_vsize_total + calc_usize_total, total_vn, "[UV]", calc_vsize_total, total_uv, "[FACE]", total_index);
console.log(vbuf_build_name,ibuf_build_name,"finished")
