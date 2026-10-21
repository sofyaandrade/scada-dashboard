import { createSlice } from "@reduxjs/toolkit"
import ITag from "../../interface/ITag/ITag";
import { addTags, deleteTag, getTags, updateTags } from "../../services/tagsService";

const listValues: ITag[] = [];

const tagSlice = createSlice({
    name: 'tag',
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
      builder.addCase(getTags.pending, (state) => {
        state.list.status = "pending"
        state.list.isLoading = true
      })
      builder.addCase(getTags.fulfilled, (state, { payload }) => {
        state.list.status = "success"
        state.list.values = payload
        state.list.isLoading = false
      })
      builder.addCase(getTags.rejected, (state, action) => {
        state.list.status = "failed"
        state.list.isLoading = false
      })

      builder.addCase(addTags.pending, (state) => {
        state.save.isSaving = true
      })
      builder.addCase(addTags.fulfilled, (state, action) => {
        state.save.isSaving = false
      })
      builder.addCase(addTags.rejected, (state, action) => {
        state.save.isSaving = false
      })
  
  
      builder.addCase(updateTags.pending, (state) => {
        state.save.isSaving = true
      })
      builder.addCase(updateTags.fulfilled, (state, action) => {
        state.save.isSaving = false
      })
      builder.addCase(updateTags.rejected, (state, action) => {
        state.save.isSaving = false
      })
  
      builder.addCase(deleteTag.pending, (state) => {
        state.save.isSaving = true
      })
      builder.addCase(deleteTag.fulfilled, (state, action) => {
        state.save.isSaving = false
      })
      builder.addCase(deleteTag.rejected, (state, action) => {
        state.save.isSaving = false
      })
  
    }
  })
  
  export default tagSlice.reducer
  
