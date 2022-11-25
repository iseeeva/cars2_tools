let fs = require("fs"),
    path = require("path"),
	obj2js = require('obj-file-parser'),
	{scan_pos,readHex,endian,float_to_hex,float16_to_float,int_to_hex16} = require("./r_lib.js");

if (process.argv[2] === "--help" || process.argv[2] === undefined) {
    console.log(`\nCars 2 OBJ Model Converter v1.0\nby iseeeva \n\ncars2_buffer.exe blabla.obj`);
    process.exit()
}

////////////////////////////////////

const objFile = new obj2js(fs.readFileSync(process.argv[2],"utf8"));
const output = objFile.parse();

let ibuf_build_name = `${(process.argv[2]).substr(0, (process.argv[2]).lastIndexOf('.'))}.pc_ibuf`,
    vbuf_build_name = `${(process.argv[2]).substr(0, (process.argv[2]).lastIndexOf('.'))}.pc_vbuf`;

fs.writeFileSync(vbuf_build_name,"");
fs.writeFileSync(ibuf_build_name,"");

let model_name = [];
let vertex = [], uv = [], index = [];
let calc_vsize = 0, calc_vsize_total = 0, calc_vsize_array = [],
    calc_usize = 0, calc_usize_total = 0, calc_usize_array = [];
    calc_isize = 0, calc_isize_total = 0, calc_isize_array = [];

output['models'].forEach((models) => {
	
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

let total_vertex = vertex.length/5, total_uv = uv.length/2, total_index = index.length/3;

calc_vsize_array.forEach((calc) => {calc_vsize_total+=calc});
calc_usize_array.forEach((calc) => {calc_usize_total+=calc});
calc_isize_array.forEach((calc) => {calc_isize_total+=calc});

calc_usize=calc_vsize_total;
for(var i=0; i < calc_vsize_array.length; i++){
	calc_vsize+=calc_vsize_array[i];
	calc_usize+=calc_usize_array[i];
	calc_isize+=calc_isize_array[i];
	console.log(
	   `\r[MODEL] ${model_name[i]}
	    \r[VERTEX] ${calc_vsize-calc_vsize_array[i]} [VERTEX_F] ${calc_vsize_array[i]/20}
	    \r[UV] ${calc_usize-calc_usize_array[i]} [UV_F] ${calc_usize_array[i]/8}
	    \r[FACE] ${calc_isize-calc_isize_array[i]} [FACE_F] ${calc_isize_array[i]/6}
		`
	);
}

console.log("[VERTEX]", total_vertex, "[UV]", calc_vsize_total, total_uv, "[FACE]", total_index);

vertex.forEach((vertex) => {fs.appendFileSync(vbuf_build_name,vertex);})
uv.forEach((uv) => {fs.appendFileSync(vbuf_build_name,uv);})
index.forEach((index) => {fs.appendFileSync(ibuf_build_name,index);})

console.log(vbuf_build_name,ibuf_build_name,"finished")
