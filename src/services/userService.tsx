
import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import IUser from "@/interface/IUser/IUsuario";

export const getUsers = createAsyncThunk<IUser[]>("users/getUsers", async () => {
    try {
        const response = await api.get<IUser[]>("users/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})

export const addUser = createAsyncThunk("users/addUsers", async (User: IUser) => {
    try {
        const response = await api.post("users/", User, {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
    }
})

export const updateUser = createAsyncThunk("users/updateUsers",
    async (User: IUser) => {
        try {
            const response = await api.patch(`users/${User.ID}/`, User, {headers: authHeader()});
            return response.data
        } catch (error) {
            console.log(error)
        }
    })

export const deleteUser = createAsyncThunk("users/deleteUsers", async (UserId: number) => {
    try {
        const response = await api.delete(`users/${UserId}/`, {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
    }
})

export const getPerfilUserLogado = createAsyncThunk("users/getUsers", async (UserId: number) => {
    try {
        const response = await api.get(`/User-perfil/User/${UserId}/`, {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
    }
})
