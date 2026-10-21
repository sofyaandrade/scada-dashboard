import { createAsyncThunk } from "@reduxjs/toolkit";
import authHeader, { api } from "./api";
import ISistemaConfiguracao from "../interface/ISistemaConfiguracao/ISistemaConfiguracao";
const ID_SISTEMA_CONFIGURACAO_UNICO = 1
export const getSistemaConfiguracao = createAsyncThunk("sistema-configuracao/getSistemaConfiguracao",
    async () => {
        try {
            const response = await api.get(`sistema-configuracao/${ID_SISTEMA_CONFIGURACAO_UNICO}/`, { headers: authHeader() })
            return response.data
        } catch (error) {
            console.log(error)
        }
    })
export const updateSistemaConfiguracao = createAsyncThunk("sistema-configuracao/updateSistemaConfiguracao",
    async (sistemaConfiguracao: ISistemaConfiguracao) => {
        try {
            const response = await api.patch(`sistema-configuracao/${sistemaConfiguracao.ID}/`, sistemaConfiguracao, { headers: authHeader() })
            return response.data
        } catch (error) {
            console.log(error)
        }
    }
)