import './App.css'
import { useState } from "react";
import { InteractiveGrid, InteractiveGridItem, InteractiveGridProvider } from "./components/InteractiveGrid";

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
      <InteractiveGridProvider onChange={(items) => { setComponents([...items]) }}>
          <div style={{ width: '100vw', height: '300px'}}>
            <InteractiveGrid options={{ columns: 12, rows: 6, margin: [0, 0] }} items={components} />
          </div>
      </InteractiveGridProvider>
  )
}

export default App
