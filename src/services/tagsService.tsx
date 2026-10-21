
import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import ITag from "../interface/ITag/ITag";

export const getTags = createAsyncThunk<ITag[]>("tags/getTags", async () => {
    try {
        const response = await api.get<ITag[]>("tags/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})

export const readTagsRealTime = createAsyncThunk("tags/readTagsTempoReal", async () => {
    try {
        const response = await api.get(`tags/real-time/`, {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
    }
})

export const addTags = createAsyncThunk("tags/addTags", async (usuario: ITag) => {
    const response = await api.post("tags/", usuario, {headers: authHeader()})
    return response.data
})

export const updateTags = createAsyncThunk("tags/updateTags",  async (tag: ITag) => {
    const response = await api.patch(`tags/${tag.ID}/`, tag, {headers: authHeader()});
    return response.data
})

export const deleteTag = createAsyncThunk("tags/deleteTag", async (tagID: number) => {
    const response = await api.delete(`tags/${tagID}/`, {headers: authHeader()})
    return response.data
})

// export const updateTagValorModbus = createAsyncThunk("tags/updateTagValorModbus", async ({ID, ValorTag}: ITag) => {
//     try {
//         const response = await api.patch(`tags/editar-valor-modbus/${ID}/${ValorTag}/`, null, {headers: authHeader()});
//         return response.data
//     } catch (error) {
//         console.log(error)
//     }
// })
