import {useMemo} from "react";
import {useResizable} from "./InteractiveGridResizeProvider.tsx";
import {useDraggable} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";
import {InteractiveGridItemLayout, InteractiveGridLayout} from "./InteractiveGrid.tsx";

export type InteractiveGridItem = {
    id: string | number;
    layout: InteractiveGridItemLayout;
}

type InteractiveGridItemProps = {
    id: string | number;
    layout: InteractiveGridItemLayout;
    gridLayout: InteractiveGridLayout
};

export const InteractiveGridItem = ({
                                              id, layout,
                                              gridLayout        }: InteractiveGridItemProps) => {

    const { width, height } = useMemo(() => {
        return {
            width: layout.w * (gridLayout.cellWidth ?? 0),
            height: layout.h * (gridLayout.cellHeight ?? 0),
        }
    }, [gridLayout.cellHeight, gridLayout.cellWidth, layout.h, layout.w]);

    /* resize */
    const { size, isResizing, onStartResize } = useResizable({
        id: id,
        width,
        height
    });
    /* end resize */

    /* dnd kit */
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: isResizing ? '-' : id,
        data: {
            layout
        },
    })
    /* end dnd kit */


    return (
        <div ref={setNodeRef}

             style={{ background: 'red', position: 'absolute', top: `${layout.y * (gridLayout.cellHeight ?? 0)}px`, left: `${layout.x * (gridLayout.cellWidth ?? 0)}px`,
                 width: isResizing ? size.width : `${width}px`,
                 height: isResizing ? size.height : `${height}px`,
                 transform: !isResizing ? CSS.Translate.toString(transform) : 'none'}}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <button {...(!isResizing ? attributes : {})}
                        {...(!isResizing ? listeners : {})} > drag</button>
                <button style={{ position: 'absolute', bottom: 0, right: 0 }} onMouseDown={(e) => { onStartResize(e); }}>
                    resize
                </button>
            </div>
        </div>
    )
};