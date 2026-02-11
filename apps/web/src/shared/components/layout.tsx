import type { PropsWithChildren } from "react";

export const Layout = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <main className="layout">
      <header className="layout__header">
        <h1>IT Ticket Management</h1>
        <p>MVP skeleton aligned with analysis and design documents</p>
      </header>
      <section className="layout__content">{children}</section>
    </main>
  );
};
