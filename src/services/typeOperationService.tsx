import { createAsyncThunk } from "@reduxjs/toolkit"
import authHeader, { api } from "./api"
import ITypeOperation from "@/interface/ITag/IAreaModbus"

export const getTypeOperation = createAsyncThunk<ITypeOperation[]>("type-operations/getTypeOperation", async () => {
    try {
        const response = await api.get<ITypeOperation[]>("type-operations/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})
