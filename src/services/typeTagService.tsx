import { createAsyncThunk } from "@reduxjs/toolkit"
import authHeader, { api } from "./api"
import ITypeTag from "@/interface/ITag/ITypeTag"

export const getTypeTag = createAsyncThunk("type-tags/getTypeTag", async () => {
    try {
        const response = await api.get<ITypeTag[]>("type-tags/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})
