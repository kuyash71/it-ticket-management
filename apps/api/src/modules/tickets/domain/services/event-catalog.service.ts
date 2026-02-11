import { DOMAIN_EVENTS, type DomainEventName } from "@itsm/contracts";

export const isSupportedDomainEvent = (eventName: string): eventName is DomainEventName => {
  return (DOMAIN_EVENTS as readonly string[]).includes(eventName);
};
