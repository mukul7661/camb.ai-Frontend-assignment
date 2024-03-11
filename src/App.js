import React, { useState } from "react";
import { Board } from "./Board";
import "./styles.css";
import AudioPlayer from "./AudioPlayer";

export default function App() {
  const [board, setBoard] = useState([
    {
      id: 1,
      items: [],
    },
    {
      id: 2,
      items: [],
    },
    // {
    //   id: 3,
    //   items: [],
    // },
  ]);

  const addAudioPill = (audioUrl) => {
    const newAudioPill = {
      id: Date.now(),
      audioUrl,
      startTime: 0,
      endTime: 10,
    };
    const newBoard = [...board];
    newBoard[0].items = [...newBoard[0].items, newAudioPill];
    setBoard(newBoard);
  };

  return (
    <main className="App">
      <AudioPlayer audioPills={board} />
      <input
        type="file"
        onChange={(e) => addAudioPill(URL.createObjectURL(e.target.files[0]))}
      />
      <Board columnItems={board} onColumnItemsChange={setBoard} />
    </main>
  );
}
