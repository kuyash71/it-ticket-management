import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { http, setBearerToken } from "../api/http";
import { useAuth } from "../auth/AuthProvider";

type Ticket = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
};

export const TicketsPage = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("INCIDENT");

  useEffect(() => {
    setBearerToken(token);
  }, [token]);

  useEffect(() => {
    const fetchTickets = async () => {
      const response = await http.get<Ticket[]>("/api/tickets");
      setTickets(response.data);
    };

    void fetchTickets();
  }, []);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();

    const response = await http.post<Ticket>("/api/tickets", {
      type,
      title,
      description
    });

    setTickets((current) => [...current, response.data]);
    setTitle("");
    setDescription("");
  };

  return (
    <section>
      <h2>{t("ticket.list")}</h2>
      <form onSubmit={onCreate}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("ticket.title")}
          required
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("ticket.description")}
          required
        />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="INCIDENT">INCIDENT</option>
          <option value="SERVICE_REQUEST">SERVICE_REQUEST</option>
        </select>
        <button type="submit">{t("ticket.create")}</button>
      </form>

      {tickets.length === 0 ? (
        <p>{t("ticket.empty")}</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <strong>{ticket.title}</strong> - {ticket.type} / {ticket.status} / {ticket.priority}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
