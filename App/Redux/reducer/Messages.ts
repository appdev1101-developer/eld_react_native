import { createSlice } from '@reduxjs/toolkit';
import { WsContact } from '../../Model/Message';
import { ChatPreviewItem } from '../../core/cache/messagesCache';

interface MessagesReduxDataType {

    driverList: WsContact[];
    groupList: WsContact[];
    recentChat: ChatPreviewItem[];
    
}

const initialState: MessagesReduxDataType = {
    driverList: [],
    groupList: [],
    recentChat:[],
};

export const MessageUserSlice = createSlice({
    name: 'messages',
    initialState: initialState,
    reducers: {
        setMsgDriverList(state, action) {
            state.driverList = action.payload;
        },
        setMsgGroupList(state, action) {
            state.groupList = action.payload;
        },
        setRecentChatList(state, action) {
            state.recentChat = action.payload;
        },
        clearAllChats() {
            return initialState;
        }
    }
});
export const { setMsgDriverList, setMsgGroupList, setRecentChatList, clearAllChats} = MessageUserSlice.actions;

export default MessageUserSlice.reducer;