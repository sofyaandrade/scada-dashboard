
import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import ITypeClp from "@/interface/IClp/ITypeClp";

export const getTypeClp = createAsyncThunk<ITypeClp[]>("type-clps/getTypeClp", async () => {
    try {
        const response = await api.get<ITypeClp[]>("type-clps/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})
