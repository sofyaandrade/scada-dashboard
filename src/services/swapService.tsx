
import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import ISwap from "@/interface/ITag/ISwap";

export const getSwap = createAsyncThunk<ISwap[]>("swaps/getSwap", async () => {
    try {
        const response = await api.get<ISwap[]>("swaps/", {headers: authHeader()})
        return response.data
    } catch (error) {
        console.log(error)
        return []
    }
})
