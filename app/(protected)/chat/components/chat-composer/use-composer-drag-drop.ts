import { useCallback, useRef, useState } from "react";

export function useComposerDragDrop(
  canAttach: boolean,
  onAttach: (file: File) => void,
) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const attachFile = useCallback(
    (file: File) => {
      if (!canAttach) return;
      onAttach(file);
    },
    [canAttach, onAttach],
  );

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (!canAttach) return;
    if (!event.dataTransfer.types.includes("Files")) return;

    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    if (!canAttach) return;

    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!canAttach) return;
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (!canAttach) return;

    const file = event.dataTransfer.files[0];
    if (file) {
      attachFile(file);
    }
  };

  return {
    isDragging,
    attachFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
