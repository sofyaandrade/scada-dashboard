import IUsuario from "./IUsuario";

export default interface IPerfil {
    ID: number,
    Descricao: string
    Usuarios: IUsuario[],

}