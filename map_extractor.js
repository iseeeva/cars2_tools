let fs = require("fs"),
    path = require("path"),
    xml_convert = require('xml-js'),
	{scan_pos,readHex} = require("./r_lib.js");

if (process.argv[2] === "--help" || process.argv[2] === undefined) {
    console.log(`\nCars 2 PC Model Extractor v1.0\nby iseeeva \n\ncars2_maper.exe blabla.xml`);
    process.exit()
}

////////////////////////////////////

var index_ref_num = 0,
	index_stride = 0;

const oct = xml_convert.xml2js(fs.readFileSync(path.resolve(process.cwd(), process.argv[2])), {
    compact: true
});

const vbuf0_fname = oct["root_node"]["VertexBufferPool"]["VertexBuffer"][0]["FileName"]["_text"],
      ibuf0_fname = oct["root_node"]["IndexBufferPool"]["IndexBuffer"][0]["FileName"]["_text"];

let vbuf_array = [];
for (var i in oct["root_node"]["VertexStreamPool"]["VertexStream"]) {
        vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["Width"]["_text"]));
        vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["_text"]));
        vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["Length"]["_text"]));
        vbuf_array.push(parseInt(oct["root_node"]["VertexStreamPool"]["VertexStream"][i]["VertexBufferOffset"]["_text"]));
}

let data_array = [
// "id":          [], // node id, reference id
// "stream_name": [], // model placeholder name
// "vertex":      [], // stream length, stream stride size
// "index":       [], // index length, index stride size
];
for (var a = 0; a < (vbuf_array.length / 4); a++) { //var i in oct["root_node"]["SceneTreeNodePool"]["Node"]
    (async () => {
        for (var i in oct["root_node"]["SceneTreeNodePool"]["Node"]) {
            if (oct["root_node"]["SceneTreeNodePool"]["Node"][i]["VertexStreamReferences"] != undefined && oct["root_node"]["SceneTreeNodePool"]["Node"][i]["IndexStreamReference"] != undefined) {
				
				search_array = [];
				if(Array.isArray(oct["root_node"]["SceneTreeNodePool"]["Node"][i]["VertexStreamReferences"]["entry"])){
				search_array = oct["root_node"]["SceneTreeNodePool"]["Node"][i]["VertexStreamReferences"]["entry"];
				}else if (oct["root_node"]["SceneTreeNodePool"]["Node"][i]["VertexStreamReferences"]["entry"] != undefined){
				search_array[0] = JSON.parse(`{"_text":${oct["root_node"]["SceneTreeNodePool"]["Node"][i]["VertexStreamReferences"]["entry"]["_text"]}}`);
				}else{continue}

                    search_array.forEach((element) => {
                        if (vbuf_array[(a*4) + 1] === parseInt(element["_text"])) {
                            index_ref_num = parseInt(oct["root_node"]["SceneTreeNodePool"]["Node"][i]["IndexStreamReference"]["_text"]);
                            index_stride  = parseInt(oct["root_node"]["IndexBufferPool"]["IndexBuffer"][0]["Width"]["_text"]);
							
							scan_pos[1]=vbuf_array[(a*4) + 3];
							fs.writeFileSync(`output/${oct["root_node"]["SceneTreeNodePool"]["Node"][i]["NodeName"]["_text"]}_${i}_${vbuf_array[(a*4) + 1]}.pc_vbuf`.replaceAll(":","_"), readHex(vbuf0_fname, 1, vbuf_array[(a*4) + 2]*vbuf_array[(a*4)], false));
							scan_pos[2]=parseInt(oct["root_node"]["IndexStreamPool"]["IndexStream"][index_ref_num]["IndexBufferOffset"]["_text"]);
							fs.writeFileSync(`output/${oct["root_node"]["SceneTreeNodePool"]["Node"][i]["NodeName"]["_text"]}_${i}_${index_ref_num}.pc_ibuf`.replaceAll(":","_"), readHex(ibuf0_fname, 2, parseInt(oct["root_node"]["IndexStreamPool"]["IndexStream"][index_ref_num]["Length"]["_text"])*index_stride, false));
							
							if(data_array[i] === undefined){data_array[i] = ({"id":[],"stream_name":[],"vertex":[],"index":[]})}
							data_array[i]["id"].push(i); data_array[i]["id"].push(vbuf_array[(a*4) + 1]);
							data_array[i]["stream_name"].push(oct["root_node"]["SceneTreeNodePool"]["Node"][i]["NodeName"]["_text"]);
							data_array[i]["vertex"].push(vbuf_array[(a*4) + 2]); data_array[i]["vertex"].push(vbuf_array[(a*4)]);
							if(data_array[i]["vertex"].length === 2){data_array[i]["index"].push(parseInt(oct["root_node"]["IndexStreamPool"]["IndexStream"][index_ref_num]["Length"]["_text"]));}
							if(data_array[i]["vertex"].length === 2){data_array[i]["index"].push(index_stride);}
							
							// console.log(`
							            // \rMODEL ${total_model++}: ${oct["root_node"]["SceneTreeNodePool"]["Node"][i]["NodeName"]["_text"]} (_${i}_${vbuf_array[(a*4) + 1]})
							            // \rReferans ${vbuf_array[(a*4) + 1]}, Node: ${i} içinde bulundu
										// \r VertexLength: ${vbuf_array[(a*4) + 2]}
										// \r VertexOffset: ${vbuf_array[(a*4) + 3]}
										// \r IndexLength:  ${parseInt(oct["root_node"]["IndexStreamPool"]["IndexStream"][index_ref_num]["Length"]["_text"])}
										// \r IndexOffset:  ${parseInt(oct["root_node"]["IndexStreamPool"]["IndexStream"][index_ref_num]["IndexBufferOffset"]["_text"])}
										// `);
							// process.exit();
                        }
                    });
            }
        }
    })()
}

data_array.forEach((element) => {
	console.log(element)
});

console.log(`\n${vbuf0_fname}/${ibuf0_fname} finished`)