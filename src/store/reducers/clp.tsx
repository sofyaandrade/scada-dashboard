import { createSlice } from '@reduxjs/toolkit'
import { addClp, deleteClp, getClp, updateClp } from '../../services/clpService';
import IClp from '@/interface/IClp/IClp';

const listValues: IClp[] = [];

const equipamentoSlice = createSlice({
  name: 'equipamento',
  initialState: {
    list: {
      isLoading: false,
      status: "",
      values: listValues
    },
    save: {
      isSaving: false,
      isDeleting: false
    }
  },
  reducers: {

  },
  extraReducers: builder => {
    builder.addCase(getClp.pending, (state) => {
      state.list.status = "pending"
      state.list.isLoading = true
    })
    builder.addCase(getClp.fulfilled, (state, { payload }) => {
      state.list.status = "success"
      state.list.values = payload
      state.list.isLoading = false
    })
    builder.addCase(getClp.rejected, (state, action) => {
      state.list.status = "failed"
      state.list.isLoading = false
    })

    builder.addCase(addClp.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(addClp.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(addClp.rejected, (state, action) => {
      state.save.isSaving = false
    })


    builder.addCase(updateClp.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(updateClp.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(updateClp.rejected, (state, action) => {
      state.save.isSaving = false
    })

    builder.addCase(deleteClp.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(deleteClp.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(deleteClp.rejected, (state, action) => {
      state.save.isSaving = false
    })

  }
})

export default equipamentoSlice.reducer
