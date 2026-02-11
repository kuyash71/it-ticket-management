import { TicketBoardPage } from "./features/tickets/pages/ticket-board.page";
import { ComplaintForm } from "./features/complaints/components/complaint-form";
import { Layout } from "./shared/components/layout";

export const App = (): JSX.Element => {
  return (
    <Layout>
      <TicketBoardPage />
      <ComplaintForm />
    </Layout>
  );
};
