import {createContext, Dispatch, MouseEventHandler, ReactNode, useContext, useReducer} from "react";

export const InteractiveGridResizeContext = createContext<{
    dispatch: Dispatch<InteractiveCurrentResize>;
    state: InteractiveGridResizeState;
}>({
    state: {
        currentResize: {
            active: false
        }
    },
    dispatch: () => undefined
    
});

export type InteractiveGridResizeState= {
    currentResize: {
        active: boolean;
        id?: string | number;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
    }
};

export type InteractiveCurrentResize = {
    active: boolean;
    id?: string | number;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
}

const initialState: InteractiveGridResizeState = {
  currentResize: {
      active: false
  }  
};

const resizeReducer = (state: InteractiveGridResizeState, action: InteractiveCurrentResize): InteractiveGridResizeState => {
    if (action)
        return {
        ...state,
            currentResize: {
                ...state.currentResize,
                ...action
            }
        }
    
    return state;
};

const InteractiveGridResizeProvider = ({ children }: { children: ReactNode; onChange?: () => void; }) => {
    const [state, dispatch] = useReducer(resizeReducer, initialState);

    const stopResize: MouseEventHandler<HTMLDivElement> = () => {
        dispatch({
           active: false
        });
    };

    const resizeFrame: MouseEventHandler<HTMLDivElement> = (e) => {
        const { active, x, y, w, h } = state.currentResize;
        if (w === undefined || h === undefined || x === undefined || y === undefined)
            return;
        if (active) {
            const xDiff = Math.abs(x - e.clientX);
            const yDiff = Math.abs(y - e.clientY);
            const newW = x > e.clientX ? w - xDiff : w + xDiff;
            const newH = y > e.clientY ? h + yDiff : h - yDiff;

            dispatch({
                ...state.currentResize, 
                x: e.clientX,
                y: e.clientY,
                w: newW,
                h: newH,
            });
            
            //setDrag({ ...drag, x: e.clientX, y: e.clientY });
            //setDims({ w: newW, h: newH });
        }
    };
    
    return (
        <InteractiveGridResizeContext.Provider
            value={{
                state: state, 
                dispatch: dispatch
            }}>
        <div onMouseMove={resizeFrame} onMouseUp={stopResize}>
            {children}
        </div>
        </InteractiveGridResizeContext.Provider>
    )
}

export const useResizable = ({ id }: { id: string | number; }) => {
    const context = useContext(InteractiveGridResizeContext);
    if (!context) {
        throw new Error('useInteractiveGrid Hook must be used within the interactive grid provider');
    }
    
    const onStartResize: MouseEventHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        context.dispatch({
            active: true,
            id: id, 
            x: e.clientX,
            y: e.clientY,
            w: e.currentTarget.clientWidth,
            h: e.currentTarget.clientHeight,
        })

    };
    
    return { onStartResize, isResizing: context.state.currentResize.id === id, size: { width: context.state.currentResize.w, height: context.state.currentResize.h } };
}


export default InteractiveGridResizeProvider;