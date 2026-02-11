export const WorklogEditor = (): JSX.Element => {
  return (
    <section className="panel">
      <h3>Worklog</h3>
      <textarea
        className="worklog-textarea"
        rows={4}
        placeholder="Internal/External worklog entry placeholder"
      />
      <div className="inline-actions">
        <button type="button">Add Internal Note</button>
        <button type="button">Add External Note</button>
      </div>
    </section>
  );
};
