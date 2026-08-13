import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const ID_MODBUS = 1;

interface ClpRealTimeState {
    clpListRealTimeModbus: {
        [clpID: number]: { [idTag: number]: number };
    };
}

const initialState: ClpRealTimeState = {
    clpListRealTimeModbus: {},
};

interface UpdateSingleTagPayload {
    idTag: number;
    clpID: number;
    clptypeID: number;
    newValue: number;
}

const clpRealTimeSlice = createSlice({
    name: 'clpRealTime',
    initialState,
    reducers: {
        updateSingleTagValue: (state, action: PayloadAction<UpdateSingleTagPayload>) => {
            const { idTag, clpID, clptypeID, newValue } = action.payload;

            switch (clptypeID) {
                case ID_MODBUS:
                    if (!state.clpListRealTimeModbus[clpID]) {
                        state.clpListRealTimeModbus[clpID] = {};
                    }
                    state.clpListRealTimeModbus[clpID][idTag] = newValue;
                    break;
                default:
                    break;
            }
        },
    },
});

export const { updateSingleTagValue } = clpRealTimeSlice.actions;
export default clpRealTimeSlice.reducer;

export const selectModbus = (state: any) => state.clpRealTime.clpListRealTimeModbus;
