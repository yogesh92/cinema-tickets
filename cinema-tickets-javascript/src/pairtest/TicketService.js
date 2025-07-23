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

    const totalAmount = ticketCounts.ADULT * 25 + ticketCounts.CHILD * 15;
    const totalSeats = ticketCounts.ADULT + ticketCounts.CHILD;

    this.#ticketPaymentService.makePayment(accountId, totalAmount);
    this.#seatReservationService.reserveSeat(accountId, totalSeats);
  }
}
