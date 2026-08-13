import { createSlice } from '@reduxjs/toolkit'
import { addUser, deleteUser, getUsers, updateUser } from '../../services/userService';
import IUser from '@/interface/IUser/IUsuario';

const listValues: IUser[] = [];

const usuarioSlice = createSlice({
  name: 'usuario',
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
    builder.addCase(getUsers.pending, (state) => {
      state.list.status = "pending"
      state.list.isLoading = true
    })
    builder.addCase(getUsers.fulfilled, (state, { payload }) => {
      state.list.status = "success"
      state.list.values = payload
      state.list.isLoading = false
    })
    builder.addCase(getUsers.rejected, (state, action) => {
      state.list.status = "failed"
      state.list.isLoading = false
    })

    builder.addCase(addUser.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(addUser.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(addUser.rejected, (state, action) => {
      state.save.isSaving = false
    })


    builder.addCase(updateUser.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(updateUser.rejected, (state, action) => {
      state.save.isSaving = false
    })

    builder.addCase(deleteUser.pending, (state) => {
      state.save.isSaving = true
    })
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.save.isSaving = false
    })
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.save.isSaving = false
    })

  }
})

export default usuarioSlice.reducer
