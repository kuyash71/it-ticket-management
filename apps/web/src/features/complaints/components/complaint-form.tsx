export const ComplaintForm = () => {
  return (
    <section className="panel complaint-panel">
      <h2>Service Quality Complaint</h2>
      <p>Customer feedback is routed to manager review without auto-changing ticket status.</p>
      <form className="complaint-form">
        <label>
          Ticket ID
          <input name="ticketId" type="text" placeholder="TCK-1001" />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} placeholder="Describe the service quality issue" />
        </label>
        <button type="submit">Submit Complaint</button>
      </form>
    </section>
  );
};
