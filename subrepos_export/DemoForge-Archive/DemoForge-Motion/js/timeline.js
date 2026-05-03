const MIN_SEGMENT_DURATION = 0.04;

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function createId(){
  return `segment-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(seconds){
  if(!Number.isFinite(seconds)) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function createTimelineController(options){
  const {
    elements,
    onSelectionChange,
    onSegmentsChange,
    onPlayheadScrub
  } = options;

  const state = {
    duration: 0,
    playhead: 0,
    selectedId: null,
    segments: [],
    dragging: null
  };

  function sortSegments(){
    state.segments.sort((a, b) => a.index - b.index || a.start - b.start);
  }

  function normalizeIndices(){
    sortSegments();
    state.segments.forEach((segment, index) => {
      segment.index = index;
    });
  }

  function getSelectedSegment(){
    return state.segments.find((segment) => segment.id === state.selectedId) || null;
  }

  function emitSelection(){
    onSelectionChange?.(getSelectedSegment(), getSegments());
  }

  function emitSegments(){
    onSegmentsChange?.(getSegments());
  }

  function timeToPercent(time){
    if(!state.duration) return 0;
    return (time / state.duration) * 100;
  }

  function clientXToTime(clientX){
    const rect = elements.segmentTrack.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    return ratio * state.duration;
  }

  function updateMeta(){
    const total = getTotalSelectedDuration();
    elements.segmentSummary.textContent = state.segments.length
      ? `${state.segments.length} segment${state.segments.length > 1 ? "s" : ""} / ${total.toFixed(2)}s`
      : "Aucun segment";
  }

  function renderTrack(){
    elements.segmentTrack.innerHTML = "";

    const playhead = document.createElement("div");
    playhead.className = "playhead-marker";
    playhead.style.left = `${timeToPercent(state.playhead)}%`;
    elements.segmentTrack.appendChild(playhead);

    getSegments().forEach((segment) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = `segment-block${segment.id === state.selectedId ? " is-selected" : ""}`;
      node.style.left = `${timeToPercent(segment.start)}%`;
      node.style.width = `${Math.max(1.2, timeToPercent(segment.end - segment.start))}%`;
      node.dataset.segmentId = segment.id;
      node.innerHTML = `
        <span class="segment-handle left" data-drag-kind="start"></span>
        <span class="segment-label">${segment.index + 1}</span>
        <span class="segment-handle right" data-drag-kind="end"></span>
      `;
      elements.segmentTrack.appendChild(node);
    });
  }

  function renderList(){
    elements.segmentList.innerHTML = "";
    getSegments().forEach((segment) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = `segment-list-item${segment.id === state.selectedId ? " is-selected" : ""}`;
      node.dataset.segmentId = segment.id;
      node.innerHTML = `
        <strong>#${segment.index + 1}</strong>
        <span>${formatTime(segment.start)} -> ${formatTime(segment.end)}</span>
      `;
      elements.segmentList.appendChild(node);
    });
  }

  function render(){
    normalizeIndices();
    renderTrack();
    renderList();
    updateMeta();
    emitSelection();
    emitSegments();
  }

  function setSelected(segmentId){
    state.selectedId = segmentId;
    render();
  }

  function addSegment(start = 0, end = Math.min(2, state.duration || 2)){
    const safeDuration = state.duration || 0;
    const clampedStart = clamp(start, 0, safeDuration);
    const clampedEnd = clamp(Math.max(end, clampedStart + MIN_SEGMENT_DURATION), 0, safeDuration);
    const segment = {
      id: createId(),
      index: state.segments.length,
      start: clampedStart,
      end: clampedEnd
    };
    state.segments.push(segment);
    state.selectedId = segment.id;
    render();
    return segment;
  }

  function removeSelected(){
    if(!state.selectedId) return;
    state.segments = state.segments.filter((segment) => segment.id !== state.selectedId);
    state.selectedId = state.segments[0]?.id || null;
    render();
  }

  function moveSelected(direction){
    const selected = getSelectedSegment();
    if(!selected) return;
    const nextIndex = clamp(selected.index + direction, 0, state.segments.length - 1);
    const other = state.segments.find((segment) => segment.index === nextIndex);
    if(!other || other.id === selected.id) return;
    other.index = selected.index;
    selected.index = nextIndex;
    render();
  }

  function updateSelectedBounds({ start, end }){
    const segment = getSelectedSegment();
    if(!segment) return;
    segment.start = clamp(start, 0, Math.max(0, state.duration - MIN_SEGMENT_DURATION));
    segment.end = clamp(end, segment.start + MIN_SEGMENT_DURATION, state.duration);
    render();
  }

  function restoreSegments(segments){
    state.segments = Array.isArray(segments)
      ? segments.map((segment, index) => ({
          id: asId(segment?.id, index),
          index: clamp(Number(segment?.index ?? index), 0, 999),
          start: clamp(Number(segment?.start ?? 0), 0, state.duration),
          end: clamp(Number(segment?.end ?? state.duration), 0, state.duration)
        })).filter((segment) => segment.end - segment.start >= MIN_SEGMENT_DURATION)
      : [];

    if(!state.segments.length && state.duration){
      addSegment(0, state.duration);
      return;
    }

    state.selectedId = state.segments[0]?.id || null;
    render();
  }

  function asId(id, index){
    return typeof id === "string" && id ? id : `segment-${index + 1}`;
  }

  function setDuration(duration){
    state.duration = Math.max(0, Number(duration) || 0);
    if(!state.duration){
      state.segments = [];
      state.selectedId = null;
      state.playhead = 0;
      render();
      return;
    }

    if(!state.segments.length){
      addSegment(0, state.duration);
      return;
    }

    state.segments.forEach((segment) => {
      segment.start = clamp(segment.start, 0, state.duration);
      segment.end = clamp(Math.max(segment.end, segment.start + MIN_SEGMENT_DURATION), 0, state.duration);
    });
    state.playhead = clamp(state.playhead, 0, state.duration);
    render();
  }

  function setPlayhead(time){
    state.playhead = clamp(Number(time) || 0, 0, state.duration || 0);
    renderTrack();
  }

  function getSegments(){
    normalizeIndices();
    return state.segments.map((segment) => ({ ...segment }));
  }

  function getTotalSelectedDuration(){
    return state.segments.reduce((sum, segment) => sum + Math.max(0, segment.end - segment.start), 0);
  }

  function findSegmentIndexAtTime(time){
    return state.segments.findIndex((segment) => time >= segment.start && time <= segment.end);
  }

  function getInitialPlaybackTime(currentTime = 0){
    if(!state.segments.length) return 0;
    const inside = state.segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end);
    if(inside) return currentTime;
    const next = state.segments.find((segment) => currentTime < segment.start);
    return next ? next.start : state.segments[0].start;
  }

  function getPlaybackTime(time){
    if(!state.segments.length) return 0;
    const segmentIndex = findSegmentIndexAtTime(time);
    if(segmentIndex >= 0) return time;
    const next = state.segments.find((segment) => time < segment.start);
    return next ? next.start : state.segments[0].start;
  }

  function getSegmentAtTime(time){
    return state.segments.find((segment) => time >= segment.start && time <= segment.end) || null;
  }

  function getNextSegmentAfter(time){
    return state.segments.find((segment) => time < segment.start) || state.segments[0] || null;
  }

  function attachEvents(){
    elements.addSegmentBtn.addEventListener("click", () => {
      const base = clamp(state.playhead, 0, state.duration || 0);
      const end = Math.min(state.duration || 0, base + Math.max(0.5, (state.duration || 0) * 0.12));
      addSegment(base, end || state.duration || 0);
    });
    elements.removeSegmentBtn.addEventListener("click", removeSelected);
    elements.moveUpBtn.addEventListener("click", () => moveSelected(-1));
    elements.moveDownBtn.addEventListener("click", () => moveSelected(1));

    elements.segmentTrack.addEventListener("pointerdown", (event) => {
      if(!state.duration) return;
      const handle = event.target.closest("[data-drag-kind]");
      const block = event.target.closest("[data-segment-id]");
      if(block){
        const segmentId = block.dataset.segmentId;
        setSelected(segmentId);
        const segment = getSelectedSegment();
        if(!segment) return;
        const dragKind = handle?.dataset.dragKind || "move";
        state.dragging = {
          kind: dragKind,
          segmentId,
          pointerOffset: clientXToTime(event.clientX) - segment.start,
          width: segment.end - segment.start
        };
      }else{
        const time = clientXToTime(event.clientX);
        state.playhead = time;
        onPlayheadScrub?.(time);
      }
      event.preventDefault();
    });

    window.addEventListener("pointermove", (event) => {
      if(!state.dragging) return;
      const segment = getSelectedSegment();
      if(!segment) return;
      const rawTime = clientXToTime(event.clientX);
      if(state.dragging.kind === "start"){
        segment.start = clamp(rawTime, 0, segment.end - MIN_SEGMENT_DURATION);
      }else if(state.dragging.kind === "end"){
        segment.end = clamp(rawTime, segment.start + MIN_SEGMENT_DURATION, state.duration);
      }else{
        const width = state.dragging.width;
        const nextStart = clamp(rawTime - state.dragging.pointerOffset, 0, state.duration - width);
        segment.start = nextStart;
        segment.end = nextStart + width;
      }
      render();
    });

    window.addEventListener("pointerup", () => {
      state.dragging = null;
    });

    elements.segmentList.addEventListener("click", (event) => {
      const item = event.target.closest("[data-segment-id]");
      if(item){
        setSelected(item.dataset.segmentId);
      }
    });
  }

  attachEvents();
  render();

  return {
    addSegment,
    formatTime,
    getInitialPlaybackTime,
    getNextSegmentAfter,
    getPlaybackTime,
    getSegmentAtTime,
    getSegments,
    getSelectedSegment,
    getTotalSelectedDuration,
    removeSelected,
    restoreSegments,
    setDuration,
    setPlayhead,
    setSelected,
    updateSelectedBounds
  };
}
