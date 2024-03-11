import React, { useCallback, useRef, useState } from "react";
import { useDndZone } from "react-dnd-action";

export function Column({ name, items, onItemsChange }) {
  const itemsContainerRef = useRef();
  const [audioLength, setAudioLength] = useState({});

  const handleClick = useCallback(function () {
    alert("dragabble elements are still clickable :)");
  }, []);
  const handleSort = useCallback(
    function (e) {
      onItemsChange(e);
    },
    [onItemsChange]
  );
  const handleLoadedMetadata = (item, duration) => {
    setAudioLength((prev) => ({
      ...prev,
      [item.id]: duration,
    }));
  };
  useDndZone(
    itemsContainerRef,
    { items, flipDurationMs: 150 },
    handleSort,
    handleSort
  );

  return (
    <div className="column">
      <div className="column-content" ref={itemsContainerRef}>
        {items.map((item) => {
          console.log(item);
          return (
            <div
              key={item.id}
              style={{ width: audioLength[item.id] * 20 }}
              className="card"
              onClick={handleClick}
            >
              {item.name}
              <audio
                style={{
                  backgroundColor: "black",
                }}
                src={item?.audioUrl}
                onLoadedMetadata={(e) =>
                  handleLoadedMetadata(item, e.target.duration)
                }
                controls
              />
              {audioLength[item.id] && (
                <p>Audio Length: {audioLength[item.id]} seconds</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
