import { configureStore } from '@reduxjs/toolkit';
import user from './reducers/users';
import tags from './reducers/tags';
import clp from './reducers/clp';
import realTime from './reducers/realTime';


const store = configureStore({
    reducer: {
        tags:tags,
        user: user,
        clp: clp,
        realTime: realTime
    },
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
