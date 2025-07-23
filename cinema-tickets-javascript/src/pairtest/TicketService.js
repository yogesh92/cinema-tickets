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
    
    this.#validateAccountId(accountId);
    this.#validateTicketRequests(ticketTypeRequests);

    const ticketCounts = this.#countTickets(ticketTypeRequests);
    this.#validateTicketTotals(ticketCounts);

    const totalAmount = this.#calculateTotalAmount(ticketCounts);
    const totalSeats = this.#calculateTotalSeats(ticketCounts);

    this.#ticketPaymentService.makePayment(accountId, totalAmount);
    this.#seatReservationService.reserveSeat(accountId, totalSeats);
  }

  // Private method to validate account ID
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }

  #validateTicketRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket must be purchased."
      );
    }

    for (const req of ticketTypeRequests) {
      if (
        typeof req?.getTicketType !== "function" ||
        typeof req?.getNoOfTickets !== "function"
      ) {
        throw new InvalidPurchaseException("Invalid TicketTypeRequest object.");
      }
    }
  }

  #countTickets(ticketTypeRequests) {
    const counts = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
    };

    for (const req of ticketTypeRequests) {
      const type = req.getTicketType();
      const count = req.getNoOfTickets();

      if (!Object.prototype.hasOwnProperty.call(counts, type)) {
        throw new InvalidPurchaseException(`Unrecognized ticket type: ${type}`);
      }

      counts[type] += count;
    }

    return counts;
  }

  #validateTicketTotals(counts) {
    const totalTickets = counts.ADULT + counts.CHILD + counts.INFANT;

    if (totalTickets > 20) {
      throw new InvalidPurchaseException(
        "Cannot purchase more than 20 tickets."
      );
    }

    if (counts.ADULT === 0 && (counts.CHILD > 0 || counts.INFANT > 0)) {
      throw new InvalidPurchaseException(
        "Child or Infant tickets require at least one Adult ticket."
      );
    }

    if (counts.INFANT > counts.ADULT) {
      throw new InvalidPurchaseException(
        "Each infant must be accompanied by one adult."
      );
    }
  }

  #calculateTotalAmount(counts) {
    return counts.ADULT * 25 + counts.CHILD * 15;
  }

  #calculateTotalSeats(counts) {
    return counts.ADULT + counts.CHILD;
  }
}
