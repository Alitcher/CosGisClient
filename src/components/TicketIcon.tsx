import ticket from "@/assets/concert_event_admission_pass_entry_ticket_icon_266914.svg";

/**
 * Ticket icon shown in front of price tags. "Concert Icon" by Icon Factory
 * (icon-icons.com), CC BY 4.0, used unchanged - credited on the About page.
 */
export default function TicketIcon({ size = 16 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ticket-icon" src={ticket.src} width={size} height={size} alt="" aria-hidden="true" />;
}
