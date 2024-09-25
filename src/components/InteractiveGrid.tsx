﻿import {useEffect, useMemo, useRef} from "react";
import {useDraggable, useDroppable} from "@dnd-kit/core";
import {CSS} from '@dnd-kit/utilities';
import {useInteractiveGrid} from "./InteractiveGridProvider.tsx";

export type InteractiveGridProps = {
  options?: InteractiveGridOptions;  
  items?: InteractiveGridItem []
};

export type InteractiveGridOptions = {
    columns?: number;
    rows?: number;
    margin?: [number, number];
};

export type InteractiveGridItem = {
    id: string | number;
    layout: InteractiveGridItemLayout;
}

export const InteractiveGrid = ({
    options,
    items
                                }: InteractiveGridProps) => {
    
    const gridRef = useRef<HTMLDivElement>(null);
    
    const { dispatch, state } = useInteractiveGrid();
    
    useEffect(() => {
        dispatch({
            type: 0,
            items: items ?? []
        })
    }, [dispatch, items]);
    
    const gridLayout = useMemo(() => {
        if (!gridRef.current)
            return {};
        
        const width = gridRef.current.clientWidth;
        const height = gridRef.current.clientHeight;
        const marginX = options?.margin?.[0] ?? 0;
        const marginY = options?.margin?.[1] ?? 0;
        const columns = options?.columns ?? 4;
        const rows = options?.rows ?? 4;
        
        
        const cellWidth = width / columns - 2 * marginX;
        const cellHeight = height / rows - 2 * marginY;
        
        console.log(cellWidth);
        
        return {
            columns,
            rows,
            cellWidth,
            cellHeight,
            marginX,
            marginY
        }
    }, [options, gridRef.current]);

    useEffect(() => {
        dispatch( {
            type: 1,
            gridLayout: gridLayout
        })
    }, [dispatch, gridLayout]);
    
    /* Dnd Start */
    
    const { setNodeRef } = useDroppable({
        id: 'interactive-grid',
    });
    
    /* Dnd End */
    
    return <div ref={setNodeRef} style={{ width: '100%', height: '100%'}}><div ref={gridRef} style={{
        position: 'relative',
        width: '100%',
        height: '100%'
    }}>
        {[...Array(gridLayout.rows).keys()].map((_, i) => [...Array(gridLayout.columns).keys()].map((_, j) => 
            <div className="interactive-grid-cell" key={`${i}-${j}`} style={{ position: 'absolute', width: `${gridLayout.cellWidth}px`, height: `${gridLayout.cellHeight}px`, top: `${i * (gridLayout.cellHeight ?? 0) + (i + 1) * 2 * (gridLayout.marginY ?? 0)}px`, left: `${j * (gridLayout.cellWidth ?? 0) + (j + 1) * 2 * (gridLayout.marginX ?? 0)}px`}}>
                
            </div>
        ))}
        {state.gridItems?.map((item) => <InteractiveGridItem key={item.id} id={item.id} gridLayout={gridLayout} layout={item.layout} />)}
    </div></div>
}

type InteractiveGridItemProps = {
    id: string | number;
    layout: InteractiveGridItemLayout;
    gridLayout: InteractiveGridLayout
};

export type InteractiveGridItemLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type InteractiveGridLayout = {
    columns?: number;
    rows?: number;
    cellWidth?: number;
    cellHeight?: number;
    marginX?: number;
    marginY?: number;
};

const InteractiveGridItem = ({
    id, layout,
                     gridLayout        }: InteractiveGridItemProps) => {
    
    
    /* dnd kit */
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: { 
            layout
        }
    })
    /* end dnd kit */
    
    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             style={{ background: 'red', position: 'absolute', top: `${layout.y * (gridLayout.cellHeight ?? 0)}px`, left: `${layout.x * (gridLayout.cellWidth ?? 0)}px`,
            width: `${layout.w * (gridLayout.cellWidth ?? 0)}px`,
            height: `${layout.h * (gridLayout.cellHeight ?? 0)}px`,
        transform: CSS.Translate.toString(transform)}}>
            <button>
                
            </button>
        </div>
    )
}