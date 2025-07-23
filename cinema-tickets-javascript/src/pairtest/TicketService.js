import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #ticketPaymentService;
  #seatReservationService;

  constructor(
    ticketPaymentService = new TicketPaymentService(),
    seatReservationService = new SeatReservationService()
  ) {
    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException

    // Validate account ID and ticket type requests
    this.#validateAccountId(accountId);

    const ticketCounts = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
    };

    for (const req of ticketTypeRequests) {
      const type = req.getTicketType();
      const count = req.getNoOfTickets();
      ticketCounts[type] += count;
    }

    if (
      ticketCounts.ADULT === 0 &&
      (ticketCounts.CHILD > 0 || ticketCounts.INFANT > 0)
    ) {
      throw new InvalidPurchaseException(
        "Child or Infant tickets require at least one Adult ticket."
      );
    }

    const totalTickets =
      ticketCounts.ADULT + ticketCounts.CHILD + ticketCounts.INFANT;
    if (totalTickets > 20) {
      throw new InvalidPurchaseException(
        "Cannot purchase more than 20 tickets."
      );
    }

    if (ticketCounts.INFANT > ticketCounts.ADULT) {
      throw new InvalidPurchaseException(
        "Each infant must be accompanied by one adult."
      );
    }

    const totalAmount = ticketCounts.ADULT * 25 + ticketCounts.CHILD * 15;
    const totalSeats = ticketCounts.ADULT + ticketCounts.CHILD;

    this.#ticketPaymentService.makePayment(accountId, totalAmount);
    this.#seatReservationService.reserveSeat(accountId, totalSeats);
  }

  // Private method to validate account ID
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }
}
