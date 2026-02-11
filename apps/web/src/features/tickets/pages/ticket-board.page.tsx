import { AttachmentUploader } from "../components/attachment-uploader";
import { TicketDetail } from "../components/ticket-detail";
import { TicketList } from "../components/ticket-list";
import { TimelinePanel } from "../components/timeline-panel";
import { WorklogEditor } from "../components/worklog-editor";
import { useTicketBoard } from "../hooks/use-ticket-board";

export const TicketBoardPage = () => {
  const { tickets, selectedId, selectedTicket, setSelectedId } = useTicketBoard();

  return (
    <section className="ticket-board-grid">
      <TicketList tickets={tickets} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="ticket-board-main">
        {selectedTicket ? (
          <>
            <TicketDetail ticket={selectedTicket} />
            <TimelinePanel ticket={selectedTicket} />
            <WorklogEditor />
            <AttachmentUploader />
          </>
        ) : (
          <section className="panel">
            <p>No ticket selected.</p>
          </section>
        )}
      </div>
    </section>
  );
};
