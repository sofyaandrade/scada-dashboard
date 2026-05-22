import ITag from "../ITag/ITag";
import ITypeClp from "./ITypeClp";



export default interface IClp {
    ID: number,
    description: string,
	ip: string,
    type_clp_id: number,
	type_clp: ITypeClp,
	port: number,
	id_plc: number, 
	tags: ITag[] 
}
