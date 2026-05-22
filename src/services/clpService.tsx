
import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import IClp from "../interface/IClp/IClp";

export const getClps = createAsyncThunk<IClp[]>("clps/getClp", async () => {
    try {
        const response = await api.get<IClp[]>("clps/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})

export const getClp = getClps

export const readStatusClps = createAsyncThunk("tags/readStatusClps", async () => {
    try {
        const response = await api.get(`clps/status/`, {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
    }
})

export const addClp = createAsyncThunk("clps/addClp", async (clp: IClp) => {
    const response = await api.post("clps/", clp, {headers: authHeader()})
    return response.data
})

export const updateClp = createAsyncThunk("clps/updateClp",
    async (clp: IClp) => {
        const response = await api.patch(`clps/${clp.ID}/`, clp, {headers: authHeader()});
        return response.data
    })

export const deleteClp = createAsyncThunk("clps/deleteClp", async (equipamentoID: number) => {
    const response = await api.delete(`clps/${equipamentoID}/`, {headers: authHeader()})
    return response.data
})
