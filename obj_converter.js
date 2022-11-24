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

output['models'].forEach((models) => {
	
	console.log("[MODEL]", models["name"])
	;(async () => {
		console.log("[VERTEX]", fs.readFileSync(vbuf_build_name).length)
		models["vertices"].forEach((xyz) => {
			fs.appendFileSync(vbuf_build_name,float_to_hex(xyz.x));
			fs.appendFileSync(vbuf_build_name,float_to_hex(xyz.y));
			fs.appendFileSync(vbuf_build_name,float_to_hex(xyz.z));
		    fs.appendFileSync(vbuf_build_name, Buffer.from("00000000","hex")); //fake bone indices
		    fs.appendFileSync(vbuf_build_name, Buffer.from("FF000000","hex")); //fake bone weight
			// console.log("ver:",xyz.x,xyz.y,xyz.z)
		})
		console.log("[VERTEX_F]", models["vertices"].length)
	})()
	
	;(async () => {
		console.log("[UV]",fs.readFileSync(vbuf_build_name).length)
		models["textureCoords"].forEach((uv) => {
			fs.appendFileSync(vbuf_build_name,float_to_hex(uv.u));
			fs.appendFileSync(vbuf_build_name,float_to_hex(uv.v));
			// fs.appendFileSync(vbuf_build_name,float_to_hex(uv.w));
			// console.log("uv:",uv.u,uv.v,uv.w)
		})
		console.log("[UV_F]", models["textureCoords"].length)
	})()
	
	;(async () => {
		console.log("[FACE]",fs.readFileSync(ibuf_build_name).length)
		models["faces"].forEach((faces) => {
			faces["vertices"].forEach((xyz) => {
				fs.appendFileSync(ibuf_build_name,int_to_hex16(xyz.vertexIndex - 1));
				// fs.appendFileSync(ibuf_build_name,int_to_hex16(xyz.textureCoordsIndex));
				// fs.appendFileSync(ibuf_build_name,int_to_hex16(xyz.vertexNormalIndex));
			// console.log("faces:",xyz.vertexIndex,xyz.textureCoordsIndex,xyz.vertexNormalIndex)
			})
		})
		console.log("[FACE_F]", models["faces"].length, "\n")
	})()

})