import React, { useRef } from "react";
import { useDndZone } from "react-dnd-action";
import { Column } from "./Column";

export function Board({ columnItems, onColumnItemsChange }) {
  const columnsContainerRef = useRef();
  function handleDndColumnsSorted(e) {
    onColumnItemsChange(e.items);
  }
  function handleDndCardsSorted(cid, e) {
    const colIdx = columnItems.findIndex((c) => c.id === cid);
    columnItems[colIdx].items = e.items;
    onColumnItemsChange([...columnItems]);
  }
  useDndZone(
    columnsContainerRef,
    { type: "column", items: columnItems, flipDurationMs: 300 },
    handleDndColumnsSorted
  );

  return (
    <section className="board" ref={columnsContainerRef}>
      {columnItems.map((column) => (
        <Column
          key={column.id}
          items={column.items}
          onItemsChange={(e) => handleDndCardsSorted(column.id, e)}
        />
      ))}
    </section>
  );
}
