import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import { TICKET_PRICES, MAX_TICKETS_PER_PURCHASE } from "./config/ticketConfig.js";

/**
 * This implementation uses a `summary` object to accumulate totals for:
 * - Number of tickets by type
 * - Total amount to be paid
 * - Number of seats to reserve
 *
 * This approach simplifies control flow and avoids jumping between multiple helper functions.
 * It also improves readability and makes the business logic easier to trace, review, and test.
 *
 */
export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */
  #ticketPaymentService;
  #seatReservationService;

  /**
   * Constructor allows dependency injection for easier testing.
   * @param {TicketPaymentService} ticketPaymentService
   * @param {SeatReservationService} seatReservationService
   */
  constructor(
    ticketPaymentService = new TicketPaymentService(),
    seatReservationService = new SeatReservationService()
  ) {
    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;
  }

  /**
   * Main method to purchase tickets.
   * Validates input, calculates totals, and interacts with payment and seat services.
   * @param {number} accountId - The account ID making the purchase.
   * @param {...TicketTypeRequest} ticketTypeRequests - One or more ticket requests.
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Validate account ID and ticket requests
    this.#validateAccountId(accountId);
    this.#validateTicketRequests(ticketTypeRequests);

    // Count tickets by type and validate business rules
    const summary = this.#calculateTicketSummary(ticketTypeRequests);
    this.#validateTicketTotals(summary);

    // Make payment and reserve seats via third-party services
    this.#ticketPaymentService.makePayment(accountId, summary.totalAmount);
    this.#seatReservationService.reserveSeat(accountId, summary.totalSeats);
  }

  /**
   * Validates the account ID.
   * Throws InvalidPurchaseException if invalid.
   * @param {number} accountId
   */
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }

  /**
   * Validates the ticket requests array.
   * Throws InvalidPurchaseException if invalid.
   * @param {Array} ticketTypeRequests
   */
  #validateTicketRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket must be purchased."
      );
    }
  }

  /**
   * Counts tickets by type, calculates totals, and validates ticket objects.
   * Throws InvalidPurchaseException for invalid requests.
   * @param {Array} ticketTypeRequests
   * @returns {Object} summary - Contains ticketCounts, totalTickets, totalAmount, totalSeats
   */
  #calculateTicketSummary(ticketTypeRequests) {
    const counts = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
    };

    for (const req of ticketTypeRequests) {
      // Ensure request is a valid TicketTypeRequest
      if (!(req instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException("Invalid TicketTypeRequest object");
      }

      const type = req.getTicketType();
      const count = req.getNoOfTickets();

      // Ensure ticket count is a positive integer
      if (!Number.isInteger(count) || count <= 0) {
        throw new InvalidPurchaseException(
          `Ticket count must be a positive integer. Received: ${count} for ${type}`
        );
      }

      counts[type] += count;
    }

    // Calculate totals
    const totalTickets = counts.ADULT + counts.CHILD + counts.INFANT;
    const totalAmount = counts.ADULT * TICKET_PRICES.ADULT + counts.CHILD * TICKET_PRICES.CHILD;
    const totalSeats = counts.ADULT + counts.CHILD;

    return {
      ticketCounts: counts,
      totalTickets,
      totalAmount,
      totalSeats,
    };
  }

  /**
   * Validates business rules for ticket totals.
   * Throws InvalidPurchaseException if rules are violated.
   * @param {Object} summary - Contains ticketCounts and totalTickets
   */
  #validateTicketTotals(summary) {
    const { ticketCounts, totalTickets } = summary;

    // Maximum ticket limit
    if (totalTickets > MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException(
        "Cannot purchase more than 25 tickets."
      );
    }

    // Child or Infant tickets require at least one Adult ticket
    if (
      ticketCounts.ADULT === 0 &&
      (ticketCounts.CHILD > 0 || ticketCounts.INFANT > 0)
    ) {
      throw new InvalidPurchaseException(
        "Child or Infant tickets require at least one Adult ticket."
      );
    }

    // Each infant must be accompanied by one adult
    if (ticketCounts.INFANT > ticketCounts.ADULT) {
      throw new InvalidPurchaseException(
        "Each infant must be accompanied by one adult."
      );
    }
  }
}
