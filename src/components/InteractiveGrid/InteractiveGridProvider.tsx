import {createContext, Dispatch, ReactNode, useContext, useEffect, useReducer} from "react";
import {DndContext} from "@dnd-kit/core";
import {InteractiveGridLayout} from "./InteractiveGrid.tsx";
import { InteractiveGridItem } from "./InteractiveGridItem.tsx";
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
} | {
    type: 3, payload: {
        id: string | number;
        width: number;
        height: number;
    }
};;

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

const getNewItemGridSize = (width: number, height: number,  gridLayout: InteractiveGridLayout) => {
    if (gridLayout.cellWidth === 0 || gridLayout.cellHeight === 0)
        return { w: 1, h: 1};
  const newWidth = Math.round(width / (gridLayout.cellWidth ?? 1));
  const newHeight = Math.round(height / (gridLayout.cellHeight ?? 1));
  
  return {
      w: newWidth,
      h: newHeight,
  }
};

const reorderGridItems = (gridItems: InteractiveGridItem[], gridLayout: InteractiveGridLayout): InteractiveGridItem[] =>  {
    // Copy the original grid items to avoid mutating the input.
    const items = [...gridItems];
    const gridWidth = gridLayout.columns ?? 1;
    const gridHeight = gridLayout.rows ?? 1;

    // Sort the items by their y and then x position.
    items.sort((a, b) => a.layout.y === b.layout.y ? a.layout.x - b.layout.x : a.layout.y - b.layout.y);

    // This will store the cells that are occupied in the grid.
    const occupiedCells = new Set<string>();

    // Function to check if a position is free.
    function isPositionFree(x: number, y: number, w: number, h: number): boolean {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                if (occupiedCells.has(`${i},${j}`)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Function to occupy cells in the grid.
    function occupyPosition(x: number, y: number, w: number, h: number) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                occupiedCells.add(`${i},${j}`);
            }
        }
    }

    // Reorder and resolve collisions.
    for (const item of items) {
        let { x, y } = item.layout;
        const { w, h } = item.layout;

        // Check if the current position is occupied.
        if (!isPositionFree(x, y, w, h)) {
            // Find the next available position.
            let newX = x;
            let newY = y;
            let found = false;

            // Search downwards for the next available position.
            while (!found) {
                if (newX + w > gridWidth) {
                    // Move to the next row.
                    newX = 0;
                    newY++;
                }

                if (isPositionFree(newX, newY, w, h)) {
                    found = true;
                    x = newX;
                    y = newY;
                } else {
                    newX++; // Move right in the same row.
                }

                // Check if the item has fallen off the grid.
                if (newY > 100) { // Arbitrary large number, indicates out of bounds.
                    console.warn(`Item ${item.id} could not be placed within the grid and will be removed.`);
                    x = -1;
                    y = -1;
                    break;
                }
            }
        }

        // If item is out of bounds, skip it.
        if (x >= 0 && y >= 0) {
            // Update the item's layout.
            item.layout.x = x;
            item.layout.y = y;

            // Occupy the cells in the grid.
            occupyPosition(x, y, w, h);
        }
    }

    // Return items that are within the grid boundaries.
    return items.filter(item => item.layout.x >= 0 && item.layout.y >= 0 && item.layout.x <= gridWidth && item.layout.y <= gridHeight);
}

/* Functions End */
const gridReducer = (state: InteractiveGridState = initialState, action: InteractiveGridStateAction): InteractiveGridState => {
    if (action.type === 0) {
        if (state.gridItems.length === 0)
            return {...state,  gridItems: [...reorderGridItems(action.items, state.gridLayout)],  isDirty: false }
        return {...state, gridItems: [...action.items], isDirty: false}
    }
    if (action.type === 1) {
        return {...state,  gridLayout: {...action.gridLayout}}
    }
    if (action.type === 2) {
        const item = state.gridItems.find(y => y.id === action.payload.itemId);
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
            newState.gridItems = reorderGridItems(newState.gridItems, state.gridLayout);
            
            return newState;
        }
    }
    if (action.type === 3) {
        const item = state.gridItems.find(y => y.id === action.payload.id);
        if (item) {
            const newState = {
                ...state,
                gridItems: [...state.gridItems.map(y => {
                    if (y.id === action.payload.id) {
                        const newSize = getNewItemGridSize(action.payload.width, action.payload.height, state.gridLayout);
                        return {...y, layout: {...y.layout, ...newSize}};
                    }
                    return y;
                })],
                isDirty: true
            };
            newState.gridItems = reorderGridItems(newState.gridItems, state.gridLayout);
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
            <InteractiveGridResizeProvider onChange={(id, width, height) => {
                dispatch({
                   type: 3,
                   payload:  {
                       id,
                       width,
                       height
                   }
                });
            }}>
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