import {createContext, Dispatch, ReactNode, useContext, useEffect, useReducer} from "react";
import {DndContext} from "@dnd-kit/core";
import {InteractiveGridItem, InteractiveGridLayout} from "./InteractiveGrid.tsx";
import InteractiveGridResizeProvider from "./InteractiveGridResizeProvider.tsx";


export type InteractiveGridState = {
    editMode: boolean;
    zoom: number;
    gridItems: InteractiveGridItem[];
    gridLayout: InteractiveGridLayout;
    isDirty?: boolean;
};

const initialState: InteractiveGridState = {
    editMode: true,
    zoom: 100,
    gridItems: [],
    gridLayout: {
        columns: 4,
        rows: 4,
    }
};

export type InteractiveGridStateAction = { type: 0, items: InteractiveGridItem[] } | {
    type: 1, gridLayout: InteractiveGridLayout;
} | {
    type: 2, payload: {
        itemId: string | number;
        delta: { x: number; y: number };
    }
};

export const InteractiveGridContext = createContext<{
    state: InteractiveGridState;
    data?: [];
    dispatch: Dispatch<InteractiveGridStateAction>;
}>({
    state: initialState,
    data: [],
    dispatch: () => undefined,
});

/* Functions */

const getItemPosition = (item: InteractiveGridItem, gridLayout: InteractiveGridLayout) => {
  const x = item.layout.x * (gridLayout.cellWidth ?? 0);
  const y = item.layout.y * (gridLayout.cellHeight ?? 0);
    
  return { x, y };
};

const getNewItemGridPosition = (origin: { x: number, y: number }, delta: { x: number, y: number },  gridLayout: InteractiveGridLayout) => {
    const destinationX = origin.x + delta.x;
    const destinationY = origin.y + delta.y;
    
    if (gridLayout.cellWidth === 0 || gridLayout.cellHeight === 0)
        return { x: 0, y: 0 };
    const gridX = Math.round(destinationX / (gridLayout.cellWidth ?? 1));
    const gridY = Math.round(destinationY / (gridLayout.cellHeight ?? 1));
    
    return { x: gridX, y: gridY };
}

/* Functions End */
const gridReducer = (state: InteractiveGridState = initialState, action: InteractiveGridStateAction): InteractiveGridState => {
    if (action.type === 0) {
        return {...state, gridItems: [...action.items], isDirty: false}
    }
    if (action.type === 1) {
        return {...state,  gridLayout: {...action.gridLayout}}
    }
    if (action.type === 2) {
        const item = state.gridItems.find(y => y.id === action.payload.itemId);
        console.log(item);
        if (item) {
            const newState = {
                ...state, 
                gridItems: [...state.gridItems.map(y => {
                    if (y.id === action.payload.itemId) {
                        const newGridDestination = getNewItemGridPosition({...getItemPosition(y, state.gridLayout)}, {...action.payload.delta}, state.gridLayout);
                        return {...y, layout: {...y.layout, ...newGridDestination}};
                    }
                    return y;
                })],
                isDirty: true
            };
            return newState;
        }
    }
    return state;
}

const InteractiveGridProvider = ({ children, onChange }: {children: ReactNode; onChange?: (items: InteractiveGridItem[]) => void; }) => {
    const [state, dispatch] = useReducer(gridReducer, initialState);

    useEffect(() => {
        if (state.isDirty) {
            onChange?.(state.gridItems);
        }
    }, [onChange, state.gridItems, state.isDirty]);
    
    return (
        <DndContext onDragEnd={(event) => {
            dispatch({
                type: 2,
                payload: {
                    itemId: event.active.id,
                    delta: event.delta
                }
            });
        }}>
            <InteractiveGridResizeProvider>
                <InteractiveGridContext.Provider
                    value={{
                        state: state,
                        dispatch: dispatch
                    }}>
                    {children}
                </InteractiveGridContext.Provider>
            </InteractiveGridResizeProvider>
        </DndContext>
    )
}

export const useInteractiveGrid = () => {
    const context = useContext(InteractiveGridContext);
    if (!context) {
        throw new Error('useInteractiveGrid Hook must be used within the interactive grid provider');
    }
    return context;
}

export default InteractiveGridProvider;