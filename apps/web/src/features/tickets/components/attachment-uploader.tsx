export const AttachmentUploader = (): JSX.Element => {
  return (
    <section className="panel">
      <h3>Attachment</h3>
      <p>Max 10 MB, internal/external visibility required.</p>
      <div className="inline-actions">
        <input type="file" />
        <select>
          <option value="EXTERNAL">External</option>
          <option value="INTERNAL">Internal</option>
        </select>
        <button type="button">Upload</button>
      </div>
    </section>
  );
};
