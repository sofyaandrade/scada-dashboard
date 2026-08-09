export default interface IUser {
    ID: number,
    name: string,
    email: string,
    phone?: string,
    permission?: string,
    password: string,

}

export interface IUsuarioList extends IUser {
    dateCreated: any
}