/* eslint-disable no-undef */
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";

const mockTicketPaymentService = {
  makePayment: jest.fn(),
};

const mockSeatReservationService = {
  reserveSeat: jest.fn(),
};

test("processes valid purchase (2 ADULT, 1 CHILD, 1 INFANT) correctly", () => {
  const ticketService = new TicketService(mockTicketPaymentService, mockSeatReservationService);

  const requests = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("CHILD", 1),
    new TicketTypeRequest("INFANT", 1),
  ];

  ticketService.purchaseTickets(1, ...requests);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 65); // (2x25 + 1x15)
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 adults + 1 child
});