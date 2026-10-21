import IClp from "../IClp/IClp";
import ITypeOperation from "./IAreaModbus";
import ISwap from "./ISwap";
import ITipoTag from "./ITypeTag";

export default interface ITag {
    ID: number,
    description: string,
    consumer_id: number,
    type_id: number,
    type: ITipoTag,
    swap_id: number,
    swap: ISwap,
    operation_id: number,
    operation_type: ITypeOperation,
    offset: number,
    id_clp: number,
    CLP: IClp,
}
