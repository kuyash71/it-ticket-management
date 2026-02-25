import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { http, setBearerToken } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
export const TicketsPage = () => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("INCIDENT");
    useEffect(() => {
        setBearerToken(token);
    }, [token]);
    useEffect(() => {
        if (!token) {
            setTickets([]);
            return;
        }
        let cancelled = false;
        const fetchTickets = async () => {
            try {
                const response = await http.get("/api/tickets");
                if (!cancelled) {
                    setTickets(response.data);
                }
            }
            catch (error) {
                console.error("Failed to fetch tickets", error);
            }
        };
        void fetchTickets();
        return () => {
            cancelled = true;
        };
    }, [token]);
    const onCreate = async (event) => {
        event.preventDefault();
        try {
            const response = await http.post("/api/tickets", {
                type,
                title,
                description
            });
            setTickets((current) => [...current, response.data]);
            setTitle("");
            setDescription("");
        }
        catch (error) {
            console.error("Failed to create ticket", error);
        }
    };
    return (_jsxs("section", { children: [_jsx("h2", { children: t("ticket.list") }), _jsxs("form", { onSubmit: onCreate, children: [_jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), placeholder: t("ticket.title"), required: true }), _jsx("input", { value: description, onChange: (event) => setDescription(event.target.value), placeholder: t("ticket.description"), required: true }), _jsxs("select", { value: type, onChange: (event) => setType(event.target.value), children: [_jsx("option", { value: "INCIDENT", children: "INCIDENT" }), _jsx("option", { value: "SERVICE_REQUEST", children: "SERVICE_REQUEST" })] }), _jsx("button", { type: "submit", children: t("ticket.create") })] }), tickets.length === 0 ? (_jsx("p", { children: t("ticket.empty") })) : (_jsx("ul", { children: tickets.map((ticket) => (_jsxs("li", { children: [_jsx("strong", { children: ticket.title }), " - ", ticket.type, " / ", ticket.status, " / ", ticket.priority] }, ticket.id))) }))] }));
};
