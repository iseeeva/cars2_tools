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

let vertex = [], uv = [], index = [];
let calc_vsize = 0, calc_isize = 0;

output['models'].forEach((models) => {
	
	console.log("[MODEL]", models["name"])
	;(async () => {
		models["vertices"].forEach((xyz) => {
			vertex.push(float_to_hex(xyz.x));
			vertex.push(float_to_hex(xyz.y));
			vertex.push(float_to_hex(xyz.z));
		    vertex.push(Buffer.from("00000000","hex")); //fake bone indices
		    vertex.push(Buffer.from("FF000000","hex")); //fake bone weight
			// console.log("ver:",xyz.x,xyz.y,xyz.z)
		})
		calc_vsize += models["vertices"].length * 20;
		console.log("[VERTEX]", calc_vsize - (models["vertices"].length * 20), "[VERTEX_F]", models["vertices"].length)
	})()
	
	;(async () => {
		models["textureCoords"].forEach((xyz) => {
			uv.push(float_to_hex(xyz.u));
			uv.push(float_to_hex(xyz.v));
			// console.log("uv:",uv.u,uv.v,uv.w)
		})
		calc_vsize += models["textureCoords"].length * 8;
		console.log("[UV]", calc_vsize - (models["textureCoords"].length * 8), "[UV_F]", models["textureCoords"].length)
	})()
	
	;(async () => {
		models["faces"].forEach((faces) => {
			faces["vertices"].forEach((xyz) => {
				index.push(int_to_hex16(xyz.vertexIndex - 1));
			// console.log("faces:",xyz.vertexIndex,xyz.textureCoordsIndex,xyz.vertexNormalIndex)
			})
		})
		calc_isize += models["faces"].length * 6;
		console.log("[FACE]", calc_isize - (models["faces"].length * 6), "[FACE_F]", models["faces"].length, "\n")
	})()

})

console.log("[VERTEX]", vertex.length/5, "[UV]", (vertex.length/5)*20, uv.length/2, "[FACE]", index.length/3);
vertex.forEach((vertex) => {fs.appendFileSync(vbuf_build_name,vertex);})
uv.forEach((uv) => {fs.appendFileSync(vbuf_build_name,uv);})
index.forEach((index) => {fs.appendFileSync(ibuf_build_name,index);})

console.log(vbuf_build_name,ibuf_build_name,"finished")
