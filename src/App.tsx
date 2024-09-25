import './App.css'
import {InteractiveGrid, InteractiveGridItem} from "./components/InteractiveGrid.tsx";
import {useState} from "react";
import InteractiveGridProvider from "./components/InteractiveGridProvider.tsx";

function App() {
    
    const [components, setComponents] = useState<InteractiveGridItem[]>([
        {
            id: '1',
            layout: {
                h: 2,
                w: 1,
                y: 0,
                x: 0
            }
        },
        {
            id: '2',
            layout: {
                h: 2,
                w: 1,
                y: 0,
                x: 0
            }
        }
    ]);

  return (
      <InteractiveGridProvider onChange={(items) => { console.log('item-update', items); setComponents([...items]) }}>
          <div style={{ width: '100vw', height: '300px'}}>
            <InteractiveGrid options={{ columns: 12, rows: 6, margin: [0, 0] }} items={components} />
          </div>
      </InteractiveGridProvider>
  )
}

export default App
